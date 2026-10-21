const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  timestampToMillis,
  hasUnreadMessage,
  messagePreview,
  validateAttachment,
  isCloudinaryFileUrl,
} = require("../../src/lib/chat.ts");
const {
  isSameOrigin,
  isDocumentId,
} = require("../../src/lib/server/request.ts");
const {
  conversationFromDoc,
  messageFromDoc,
} = require("../../src/lib/firebase/serializers.ts");

test("unresolved timestamps remain null and cannot create false read receipts", () => {
  assert.equal(timestampToMillis(null), null);
  assert.equal(timestampToMillis(undefined), null);
  assert.equal(timestampToMillis({ toMillis: () => 42 }), 42);
  const conversation = conversationFromDoc("c", {
    participantIds: ["a", "b"],
    readAt: { a: null },
    createdAt: null,
  });
  assert.equal(conversation.readAt.a, null);
  assert.equal(conversation.createdAt, null);
  assert.equal(
    hasUnreadMessage(
      { ...conversation, lastMessage: { senderId: "b", createdAt: null } },
      "a"
    ),
    false
  );
});
test("unread state uses incoming sender and confirmed read timestamp", () => {
  const c = {
    lastMessage: { senderId: "b", createdAt: 100 },
    readAt: { a: 90 },
  };
  assert.equal(hasUnreadMessage(c, "a"), true);
  assert.equal(hasUnreadMessage({ ...c, readAt: { a: 100 } }, "a"), false);
  assert.equal(hasUnreadMessage(c, "b"), false);
});
test("file previews and captions survive serialization", () => {
  assert.equal(
    messagePreview({ type: "file", fileName: "report.pdf" }),
    "report.pdf"
  );
  const file = messageFromDoc("m", {
    type: "file",
    fileName: "report.pdf",
    caption: "Please review",
    createdAt: { toMillis: () => 123 },
  });
  assert.equal(file.caption, "Please review");
  assert.equal(file.createdAt, 123);
});
test("attachments reject unsafe origins, schemes, sizes, and MIME types", () => {
  const valid = {
    fileName: "a.pdf",
    fileUrl: "https://res.cloudinary.com/demo/image/upload/v1/chat-files/a.pdf",
    fileSize: 20,
    contentType: "application/pdf",
  };
  assert.doesNotThrow(() => validateAttachment(valid, "demo"));
  for (const file of [
    { ...valid, fileSize: 0 },
    { ...valid, fileSize: 10485761 },
    { ...valid, fileSize: 1.5 },
    { ...valid, contentType: "text/html" },
    { ...valid, fileUrl: "https://evil.test/a" },
    { ...valid, fileName: "x".repeat(256) },
  ])
    assert.throws(() => validateAttachment(file, "demo"));
  for (const url of [
    "http://res.cloudinary.com/demo/image/upload/a",
    "https://res.cloudinary.com/other/image/upload/a",
    "https://user@res.cloudinary.com/demo/image/upload/a",
    "https://res.cloudinary.com.evil.test/demo/image/upload/a",
    "https://res.cloudinary.com/demo/../other/image/upload/a",
  ])
    assert.equal(isCloudinaryFileUrl(url, "demo"), false);
});
test("mutating API requests reject cross-origin and document path injection", () => {
  assert.equal(
    isSameOrigin(
      new Request("https://chat.test/api/users", {
        headers: { origin: "https://evil.test" },
      })
    ),
    false
  );
  assert.equal(
    isSameOrigin(
      new Request("https://chat.test/api/users", {
        headers: { origin: "https://chat.test" },
      })
    ),
    true
  );
  assert.equal(
    isSameOrigin(
      new Request("http://localhost:3100/api/users", {
        headers: { origin: "http://127.0.0.1:3100", host: "127.0.0.1:3100" },
      })
    ),
    true
  );
  assert.equal(
    isSameOrigin(
      new Request("https://chat.test/api/users", {
        headers: { origin: "null" },
      })
    ),
    false
  );
  for (const id of [null, "", "a/b", "..", "x".repeat(1501)])
    assert.equal(isDocumentId(id), false);
  assert.equal(isDocumentId("a_b"), true);
});
