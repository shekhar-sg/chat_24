const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const writes = [];
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === "@/lib/firebase/firestore") return { db: {} };
  if (request === "firebase/firestore")
    return {
      doc: () => ({ id: "new-message" }),
      collection: () => ({}),
      serverTimestamp: () => "server-time",
      writeBatch: () => ({
        set: (_ref, data) => writes.push(data),
        update: () => {},
        commit: async () => {},
      }),
    };
  return originalLoad.call(this, request, ...args);
};
const {
  sendFileMessage,
} = require("../../src/lib/firebase/firestore/conversations.ts");
Module._load = originalLoad;

test("file-only messages omit caption for compatibility; nonempty captions remain bounded", async () => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "test-cloud";
  const file = {
    senderId: "alice",
    fileName: "image.png",
    fileUrl:
      "https://res.cloudinary.com/test-cloud/image/upload/v1/chat-files/test.png",
    fileSize: 100,
    contentType: "image/png",
  };
  for (const caption of [undefined, "", "   "]) {
    await sendFileMessage("chat", { ...file, caption });
    assert.equal(Object.hasOwn(writes.at(-1), "caption"), false);
    assert.equal(writes.at(-1).fileName, "image.png");
  }
  await sendFileMessage("chat", { ...file, caption: " Please review " });
  assert.equal(writes.at(-1).caption, "Please review");
  await assert.rejects(
    sendFileMessage("chat", { ...file, caption: "x".repeat(10001) })
  );
});
