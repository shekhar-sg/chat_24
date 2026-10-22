const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const {
  setLogLevel,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  limitToLast,
  serverTimestamp,
  Timestamp,
  writeBatch,
} = require("firebase/firestore");
if (!process.env.FIRESTORE_EMULATOR_HOST?.startsWith("127.0.0.1:"))
  throw new Error(
    "Tests require the local Firestore emulator; live databases are never used."
  );
setLogLevel("silent");
let env, alice, bob, outsider;
const base = () => ({
  type: "direct",
  participantIds: ["alice", "bob"],
  lastMessage: null,
  lastMessageAt: null,
  readAt: { alice: null, bob: null },
  typing: { alice: false, bob: false },
  createdAt: serverTimestamp(),
});
before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-beyond-chat",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
  alice = env.authenticatedContext("alice").firestore();
  bob = env.authenticatedContext("bob").firestore();
  outsider = env.authenticatedContext("outsider").firestore();
});
after(async () => {
  await env?.cleanup();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    for (const uid of ["alice", "bob", "outsider"])
      await setDoc(doc(context.firestore(), "users", uid), {
        displayName: uid,
        email: `${uid}@example.test`,
        photoURL: null,
        status: null,
      });
  });
  await setDoc(doc(alice, "conversations", "alice_bob"), base());
});
async function send(db, id, fields) {
  const batch = writeBatch(db);
  const message = {
    type: "text",
    senderId: "alice",
    text: "Hello",
    createdAt: serverTimestamp(),
    ...fields,
  };
  batch.set(doc(db, "conversations", "alice_bob", "messages", id), message);
  batch.update(doc(db, "conversations", "alice_bob"), {
    lastMessage: {
      type: message.type,
      senderId: message.senderId,
      messageId: id,
      ...(message.type === "file"
        ? { fileName: message.fileName }
        : { text: message.text }),
      createdAt: serverTimestamp(),
    },
    lastMessageAt: serverTimestamp(),
  });
  return batch.commit();
}

test("AI quota documents cannot be read or changed by clients", async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "aiRateLimits", "alice"), {
      startedAt: Date.now(),
      count: 5,
    });
  });
  for (const db of [
    alice,
    outsider,
    env.unauthenticatedContext().firestore(),
  ]) {
    await assertFails(getDoc(doc(db, "aiRateLimits", "alice")));
    await assertFails(setDoc(doc(db, "aiRateLimits", "alice"), { count: 0 }));
  }
});

test("signed-in member directory is read-only; unauthenticated users see nothing", async () => {
  await assertSucceeds(
    getDocs(
      query(collection(alice, "users"), orderBy("displayName"), limit(30))
    )
  );
  await assertFails(
    getDocs(collection(env.unauthenticatedContext().firestore(), "users"))
  );
  await assertFails(updateDoc(doc(alice, "users", "alice"), { isAdmin: true }));
});
test("participants can query their inbox; outsiders cannot read or write conversation data", async () => {
  await assertSucceeds(
    getDocs(
      query(
        collection(alice, "conversations"),
        where("participantIds", "array-contains", "alice"),
        orderBy("lastMessageAt", "desc"),
        limit(30)
      )
    )
  );
  await assertFails(getDoc(doc(outsider, "conversations", "alice_bob")));
  await assertFails(
    getDocs(collection(outsider, "conversations", "alice_bob", "messages"))
  );
  await assertFails(
    updateDoc(doc(outsider, "conversations", "alice_bob"), {
      "typing.alice": true,
    })
  );
});
test("conversation creation rejects duplicate, missing, or forged participants and schema pollution", async () => {
  for (const fields of [
    { participantIds: ["alice", "alice"] },
    { participantIds: ["bob", "outsider"] },
    { participantIds: ["alice", "missing"] },
    { isAdmin: true },
    { createdAt: Timestamp.fromMillis(1) },
    { typing: { alice: true, bob: false } },
    { readAt: { alice: null } },
  ])
    await assertFails(
      setDoc(doc(alice, "conversations", `bad${Math.random()}`), {
        ...base(),
        ...fields,
      })
    );
});
test("only the caller's read and typing fields can change; immutable fields stay fixed", async () => {
  const ref = doc(alice, "conversations", "alice_bob");
  await assertSucceeds(
    updateDoc(ref, {
      "readAt.alice": serverTimestamp(),
      "typing.alice": true,
      "typingAt.alice": serverTimestamp(),
    })
  );
  for (const fields of [
    { "readAt.bob": serverTimestamp() },
    { "typing.bob": true },
    { "typingAt.bob": serverTimestamp() },
    { participantIds: ["alice", "outsider"] },
    { createdAt: serverTimestamp() },
    { extra: true },
    { "readAt.alice": "oops" },
  ])
    await assertFails(updateDoc(ref, fields));
});
test("text and summary must be atomic; spoofing, replay, invalid timestamps and oversized bodies fail", async () => {
  await assertSucceeds(send(alice, "good"));
  await assertFails(send(bob, "spoof", { senderId: "alice" }));
  for (const fields of [
    { text: "" },
    { text: "x".repeat(10001) },
    { text: 42 },
    { extra: true },
    { createdAt: Timestamp.fromMillis(1) },
  ])
    await assertFails(send(alice, `bad${Math.random()}`, fields));
  await assertFails(
    setDoc(doc(alice, "conversations", "alice_bob", "messages", "alone"), {
      type: "text",
      text: "alone",
      senderId: "alice",
      createdAt: serverTimestamp(),
    })
  );
  await assertFails(
    updateDoc(doc(alice, "conversations", "alice_bob"), {
      lastMessage: {
        messageId: "good",
        type: "text",
        senderId: "alice",
        text: "forged",
        createdAt: serverTimestamp(),
      },
      lastMessageAt: serverTimestamp(),
    })
  );
  await assertFails(
    updateDoc(doc(alice, "conversations", "alice_bob", "messages", "good"), {
      text: "edited",
    })
  );
});
test("valid file captions work; oversized and unsafe attachments are rejected", async () => {
  const rules = fs.readFileSync("firestore.rules", "utf8");
  const cloud = rules.match(/cloudinary\[\.\]com\/([^/]+)\//)[1];
  const file = {
    type: "file",
    senderId: "alice",
    fileName: "a.pdf",
    fileUrl: `https://res.cloudinary.com/${cloud}/image/upload/v1/chat-files/a.pdf`,
    fileSize: 100,
    contentType: "application/pdf",
    caption: "Please review",
    createdAt: serverTimestamp(),
  };
  // Build a file-only payload (text is not an allowed file field).
  const commit = async (id, overrides = {}) => {
    const payload = { ...file, ...overrides };
    const batch = writeBatch(alice);
    batch.set(
      doc(alice, "conversations", "alice_bob", "messages", id),
      payload
    );
    batch.update(doc(alice, "conversations", "alice_bob"), {
      lastMessage: {
        type: "file",
        senderId: "alice",
        fileName: payload.fileName,
        messageId: id,
        createdAt: serverTimestamp(),
      },
      lastMessageAt: serverTimestamp(),
    });
    return batch.commit();
  };
  await assertSucceeds(commit("file"));
  assert.equal(
    (
      await getDoc(doc(bob, "conversations", "alice_bob", "messages", "file"))
    ).data().caption,
    "Please review"
  );
  for (const fields of [
    { fileSize: -1 },
    { fileSize: 10485761 },
    { fileUrl: "http://evil.test/a.pdf" },
    { contentType: "text/html" },
    { caption: "x".repeat(10001) },
    { fileName: "x".repeat(256) },
  ])
    await assertFails(commit(`bad${Math.random()}`, fields));
});
test("latest-message window includes message 101; expanding it returns unique older history", async () => {
  await env.withSecurityRulesDisabled(async (context) => {
    const batch = writeBatch(context.firestore());
    for (let i = 0; i < 105; i++)
      batch.set(
        doc(
          context.firestore(),
          "conversations",
          "alice_bob",
          "messages",
          `m${String(i).padStart(3, "0")}`
        ),
        {
          type: "text",
          senderId: "alice",
          text: String(i),
          createdAt: Timestamp.fromMillis(i + 1),
        }
      );
    await batch.commit();
  });
  const ref = collection(bob, "conversations", "alice_bob", "messages");
  const latest = await getDocs(
    query(ref, orderBy("createdAt", "asc"), limitToLast(100))
  );
  assert.equal(latest.docs[0].data().text, "5");
  assert.equal(latest.docs.at(-1).data().text, "104");
  const all = await getDocs(
    query(ref, orderBy("createdAt", "asc"), limitToLast(200))
  );
  assert.equal(all.size, 105);
  assert.equal(new Set(all.docs.map((d) => d.id)).size, 105);
});
test("concurrent get-or-create preserves an existing conversation", async () => {
  const dbPath = path.resolve("src/lib/firebase/firestore.ts");
  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: { db: alice },
  };
  const {
    getOrCreateDirectConversation,
  } = require("../../src/lib/firebase/firestore/conversations.ts");
  await send(alice, "existing");
  await Promise.all([
    getOrCreateDirectConversation("alice", "bob"),
    getOrCreateDirectConversation("alice", "bob"),
  ]);
  assert.equal(
    (await getDoc(doc(alice, "conversations", "alice_bob"))).data().lastMessage
      .text,
    "Hello"
  );
  await assertFails(
    setDoc(doc(alice, "conversations", "missing", "messages", "orphan"), {
      type: "text",
      text: "orphan",
      senderId: "alice",
      createdAt: serverTimestamp(),
    })
  );
});
