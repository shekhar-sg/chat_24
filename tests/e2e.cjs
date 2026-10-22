const { chromium, expect } = require("@playwright/test");
const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());
if (
  !process.env.FIRESTORE_EMULATOR_HOST?.startsWith("127.0.0.1:") ||
  !process.env.FIREBASE_AUTH_EMULATOR_HOST?.startsWith("127.0.0.1:")
)
  throw new Error(
    "Run this suite using the local Auth and Firestore emulators."
  );
const projectId = "demo-beyond-chat";
const baseURL = "http://127.0.0.1:3100";
fs.mkdirSync("test-results", { recursive: true });
const log = fs.openSync("test-results/e2e-server.log", "w");
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3100",
  ],
  {
    env: {
      ...process.env,
      NEXT_BUILD_DIR: ".next-e2e",
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
      FIREBASE_PROJECT_ID: projectId,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: projectId,
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
    },
    stdio: ["ignore", log, log],
    windowsHide: true,
  }
);
let browser;
const uploadedAssets = [];
async function signup(context, name) {
  const page = await context.newPage();
  await page.goto(`${baseURL}/signup`);
  await page.getByLabel("Display name").fill(name);
  await page.getByLabel("Email").fill(`${name.toLowerCase()}@example.test`);
  await page
    .getByLabel("Password", { exact: true })
    .fill("Local-test-password-123!");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByText("Your Inbox", { exact: true })).toBeVisible({
    timeout: 60000,
  });
  return page;
}
(async () => {
  try {
    for (let i = 0; i < 90; i++) {
      try {
        if ((await fetch(`${baseURL}/api/auth/csrf`)).ok) break;
      } catch {}
      if (i === 89)
        throw new Error(
          "Test server did not become ready; see test-results/e2e-server.log"
        );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    browser = await chromium.launch({
      channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
      headless: true,
    });
    const a = await browser.newContext({
      baseURL,
      viewport: { width: 1440, height: 900 },
      hasTouch: true,
      isMobile: true,
    });
    const b = await browser.newContext({
      baseURL,
      viewport: { width: 1440, height: 900 },
    });
    const guest = await browser.newContext({ baseURL });
    for (const context of [a, b, guest]) context.setDefaultTimeout(20000);
    const errors = [];
    for (const context of [a, b])
      context.on("page", (page) =>
        page.on("pageerror", (error) => errors.push(error.message))
      );
    const guestPage = await guest.newPage();
    await guestPage.goto(baseURL);
    await expect(guestPage).toHaveURL(/\/login/);
    for (const endpoint of [
      "/api/auth/session",
      "/api/files/download?conversationId=x&messageId=y",
    ])
      expect((await guest.request.get(endpoint)).status()).toBe(401);
    expect(
      (
        await guest.request.post("/api/users", {
          data: { displayName: "test" },
        })
      ).status()
    ).toBe(401);
    await guest.addCookies([
      { name: "session", value: "invalid-session", url: baseURL },
    ]);
    await guestPage.goto(`${baseURL}/login`);
    await expect(
      guestPage.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();
    for (const width of [360, 390, 1440]) {
      await guestPage.setViewportSize({ width, height: 844 });
      await guestPage
        .getByLabel("Password", { exact: true })
        .fill("Visibility-test");
      await guestPage
        .getByRole("button", { name: "Show password", exact: true })
        .click();
      await expect(
        guestPage.getByLabel("Password", { exact: true })
      ).toHaveAttribute("type", "text");
      await guestPage
        .getByRole("button", { name: "Hide password", exact: true })
        .click();
      expect(
        await guestPage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      await guestPage.screenshot({ path: `test-results/login-${width}.png` });
      await guestPage.goto(`${baseURL}/signup`);
      await expect(
        guestPage.getByRole("heading", { name: "Create your account" })
      ).toBeVisible();
      expect(
        await guestPage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      await guestPage.screenshot({ path: `test-results/signup-${width}.png` });
      await guestPage.goto(`${baseURL}/login`);
    }
    console.log(
      "PASS: protected pages, JSON API authorization, invalid-cookie recovery"
    );

    const alice = await signup(a, "Alice");
    const bob = await signup(b, "Bob");
    console.log("PASS: both accounts signed up");
    await alice.getByRole("button", { name: "Start new conversation" }).click();
    await alice.getByRole("button", { name: /Bob/ }).click();
    console.log("PASS: conversation created");
    await expect(alice.getByLabel("Message", { exact: true })).toBeEnabled({
      timeout: 30000,
    });
    await alice
      .getByLabel("Message", { exact: true })
      .fill("Hello Bob from Alice");
    await alice.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      alice.getByRole("log").getByText("Hello Bob from Alice", { exact: true })
    ).toBeVisible();
    await expect(bob.getByLabel("Unread messages")).toBeVisible({
      timeout: 30000,
    });
    await bob.getByRole("link", { name: /Alice/ }).click();
    await expect(
      bob.getByRole("log").getByText("Hello Bob from Alice", { exact: true })
    ).toBeVisible();
    await bob
      .getByLabel("Message", { exact: true })
      .fill("Hello Alice from Bob");
    await bob.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      alice.getByRole("log").getByText("Hello Alice from Bob", { exact: true })
    ).toBeVisible();
    await alice.reload();
    await expect(
      alice.getByRole("log").getByText("Hello Alice from Bob", { exact: true })
    ).toBeVisible({ timeout: 30000 });
    console.log(
      "PASS: signup, session refresh, two-user messaging, unread indication"
    );

    const conversationId = new URL(alice.url()).pathname.split("/").at(-1);
    // A second session observes the real Firestore typing lifecycle.
    await bob.getByLabel("Message", { exact: true }).fill("Typing a draft");
    await expect(
      alice.getByRole("status", { name: "Bob is typing" })
    ).toBeVisible();
    await bob.getByRole("button", { name: "Choose emoji" }).focus();
    await expect(
      alice.getByRole("status", { name: "Bob is typing" })
    ).toHaveCount(0);
    await bob.getByLabel("Message", { exact: true }).fill("");
    console.log(
      "PASS: auth layouts, password visibility and real typing lifecycle"
    );
    expect(
      (
        await a.request.post("/api/users", {
          headers: { origin: "https://evil.test" },
          data: { displayName: "bad" },
        })
      ).status()
    ).toBe(403);
    expect(
      (
        await a.request.get("/api/files/download?url=https://evil.test/file")
      ).status()
    ).toBe(400);
    if (process.env.RUN_CLOUDINARY_SMOKE === "true") {
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6pAAAAABJRU5ErkJggg==",
        "base64"
      );
      await alice
        .getByLabel("Message", { exact: true })
        .fill("Live upload caption");
      const uploadedResponse = alice.waitForResponse(
        (response) =>
          response.url().endsWith("/api/files/upload") &&
          response.request().method() === "POST"
      );
      await alice.locator('input[type="file"]').setInputFiles({
        name: "smoke.png",
        mimeType: "image/png",
        buffer: png,
      });
      const response = await uploadedResponse;
      expect(response.status()).toBe(200);
      const uploaded = await response.json();
      const publicId = new URL(uploaded.fileUrl).pathname
        .split("/upload/")[1]
        .replace(/^v[0-9]+\//, "")
        .replace(/\.[^.]+$/, "");
      uploadedAssets.push(publicId);
      await expect(alice.getByText("smoke.png", { exact: true })).toBeVisible();
      await alice.getByRole("button", { name: "Send", exact: true }).click();
      await expect(
        alice.getByRole("log").getByText("Live upload caption", { exact: true })
      ).toBeVisible();
      await alice
        .getByRole("button", { name: "Preview smoke.png", exact: true })
        .click();
      const downloaded = alice.waitForEvent("download");
      await alice
        .getByRole("dialog")
        .getByRole("button", { name: "Download", exact: true })
        .click();
      const download = await downloaded;
      expect(download.suggestedFilename()).toBe("smoke.png");
      expect(fs.statSync(await download.path()).size).toBeGreaterThan(0);
      await alice
        .getByRole("dialog")
        .getByRole("button", { name: "Close", exact: true })
        .click();
      console.log(
        "PASS: real Cloudinary image upload, caption, preview and authenticated download (test asset removed in cleanup)"
      );
    }

    await bob.getByRole("link", { name: "Inbox", exact: true }).click();
    await bob.getByRole("button", { name: "Sign out", exact: true }).click();
    await bob
      .getByRole("dialog")
      .getByRole("button", { name: "Sign out", exact: true })
      .click();
    await expect(
      bob.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible({ timeout: 30000 });
    await bob.getByLabel("Email").fill("bob@example.test");
    await bob
      .getByLabel("Password", { exact: true })
      .fill("Local-test-password-123!");
    await bob.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(bob.getByText("Your Inbox", { exact: true })).toBeVisible({
      timeout: 30000,
    });
    console.log("PASS: logout and subsequent login");

    // Invalid upload fails locally and retains the text draft. No Cloudinary asset is created.
    await alice
      .getByLabel("Message", { exact: true })
      .fill("Caption survives failed upload");
    await alice.locator('input[type="file"]').setInputFiles({
      name: "bad.html",
      mimeType: "text/html",
      buffer: Buffer.from("<html>bad</html>"),
    });
    await expect(
      alice.getByRole("alert").filter({ hasText: "Upload failed" })
    ).toBeVisible();
    await expect(alice.getByLabel("Message", { exact: true })).toHaveValue(
      "Caption survives failed upload"
    );
    await alice.getByRole("button", { name: "Close", exact: true }).click();
    await alice.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      alice
        .getByRole("log")
        .getByText("Caption survives failed upload", { exact: true })
    ).toBeVisible();
    console.log("PASS: rejected attachment shows feedback and preserves draft");

    const {
      initializeTestEnvironment,
    } = require("@firebase/rules-unit-testing");
    const rules = fs.readFileSync("firestore.rules", "utf8");
    const restricted = rules.replace(
      "&& data.senderId == request.auth.uid && data.createdAt == request.time",
      "&& data.senderId == request.auth.uid && data.createdAt == request.time && data.get('text', '') != 'blocked-message'"
    );
    const failedSendEnv = await initializeTestEnvironment({
      projectId,
      firestore: { host: "127.0.0.1", port: 8080, rules: restricted },
    });
    try {
      await alice
        .getByLabel("Message", { exact: true })
        .fill("blocked-message");
      await alice.getByRole("button", { name: "Send", exact: true }).click();
      await expect(
        alice
          .getByRole("alert")
          .filter({ hasText: "Message could not be sent" })
      ).toBeVisible({ timeout: 30000 });
      await expect(alice.getByLabel("Message", { exact: true })).toHaveValue(
        "blocked-message"
      );
    } finally {
      const restored = await initializeTestEnvironment({
        projectId,
        firestore: { host: "127.0.0.1", port: 8080, rules },
      });
      await restored.cleanup();
      await failedSendEnv.cleanup();
    }
    await alice
      .getByRole("alert")
      .filter({ hasText: "Message could not be sent" })
      .getByRole("button", { name: "Close" })
      .click();
    await alice.getByLabel("Message", { exact: true }).fill("Retried message");
    await alice.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      alice.getByRole("log").getByText("Retried message", { exact: true })
    ).toBeVisible();
    console.log(
      "PASS: rejected send retains the draft and a subsequent retry succeeds"
    );

    const { initializeApp, deleteApp } = require("firebase-admin/app");
    const { getFirestore, Timestamp } = require("firebase-admin/firestore");
    const fixtureApp = initializeApp({ projectId }, "e2e-history-fixture");
    const fixtureDb = getFirestore(fixtureApp);
    try {
      const sender = (await a.request.get("/api/auth/session")).ok()
        ? (await (await a.request.get("/api/auth/session")).json()).uid
        : null;
      const batch = fixtureDb.batch();
      for (let i = 0; i < 105; i++)
        batch.set(
          fixtureDb
            .collection("conversations")
            .doc(conversationId)
            .collection("messages")
            .doc(`history-${String(i).padStart(3, "0")}`),
          {
            type: "text",
            senderId: sender,
            text: `History ${String(i).padStart(3, "0")}`,
            createdAt: Timestamp.fromMillis(Date.now() - 300000 + i * 1000),
          }
        );
      await batch.commit();
      await expect(
        alice.getByRole("button", { name: "Load older messages", exact: true })
      ).toBeVisible({ timeout: 30000 });
      await expect(
        alice.getByRole("log").getByText("History 000", { exact: true })
      ).toHaveCount(0);
      await alice
        .getByRole("button", { name: "Load older messages", exact: true })
        .click();
      await expect(
        alice.getByRole("log").getByText("History 000", { exact: true })
      ).toHaveCount(1);
      await alice
        .getByLabel("Message", { exact: true })
        .fill("Newest after pagination");
      await alice.getByRole("button", { name: "Send", exact: true }).click();
      await expect(
        alice
          .getByRole("log")
          .getByText("Newest after pagination", { exact: true })
      ).toBeVisible();
    } finally {
      await fixtureDb.terminate();
      await deleteApp(fixtureApp);
    }
    console.log(
      "PASS: history beyond 100 messages, older-page expansion, and new messages after pagination"
    );

    await alice.getByRole("button", { name: "toggle theme" }).click();
    await alice.screenshot({ path: "test-results/desktop-dark.png" });
    await alice.setViewportSize({ width: 390, height: 844 });
    await alice.getByRole("button", { name: "open AI drawer" }).click();
    await expect(
      alice.getByRole("heading", { name: "AI Assistant" })
    ).toBeVisible();
    await alice.route("**/api/ai/chat", async (route) => {
      const input = route.request().postDataJSON();
      expect(input.conversationId).toBe(conversationId);
      await route.fulfill({
        json: { text: "Thanks, I will follow up shortly.", refused: false },
      });
    });
    await alice
      .getByRole("button", { name: "Suggest reply", exact: true })
      .click();
    await alice
      .getByRole("button", { name: "Insert draft", exact: true })
      .click();
    await alice.keyboard.press("Escape");
    await expect(alice.getByLabel("Message", { exact: true })).toHaveValue(
      "Thanks, I will follow up shortly."
    );
    await expect(
      alice
        .getByRole("log", { name: "Messages", exact: true })
        .getByText("Thanks, I will follow up shortly.", { exact: true })
    ).toHaveCount(0);
    await alice.getByLabel("Message", { exact: true }).fill("");
    await alice.unroute("**/api/ai/chat");
    await expect(
      alice.getByRole("button", { name: "open AI drawer" })
    ).toBeVisible();
    expect(
      await alice.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
    for (const width of [360, 390]) {
      await alice.setViewportSize({ width, height: 844 });
      const messages = alice.getByRole("log", {
        name: "Messages",
        exact: true,
      });
      const cdp = await a.newCDPSession(alice);
      await cdp.send("Emulation.setTouchEmulationEnabled", {
        enabled: true,
        maxTouchPoints: 1,
      });
      const box = await messages.boundingBox();
      // Real touch input rather than assigning scrollTop tests gesture handling.
      const before = await messages.evaluate((node) => node.scrollTop);
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 3;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      for (let offset = 20; offset <= 180; offset += 20) {
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x, y: y + offset }],
        });
        // Chromium needs frames between moves to recognize a real swipe.
        await alice.waitForTimeout(25);
      }
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect
        .poll(() => messages.evaluate((node) => node.scrollTop))
        .toBeLessThan(before);
      await alice.getByRole("button", { name: "open AI drawer" }).click();
      await alice.keyboard.press("Escape");
      await expect
        .poll(() => alice.evaluate(() => document.body.style.overflow))
        .not.toBe("hidden");
      await cdp.detach();
      await alice.setViewportSize({ width, height: 500 });
      await alice.getByLabel("Message", { exact: true }).focus();
      const inputBox = await alice
        .getByLabel("Message", { exact: true })
        .boundingBox();
      expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(500);
      await alice.setViewportSize({ width, height: 844 });
    }
    await alice.screenshot({ path: "test-results/mobile-chat.png" });
    await alice.getByRole("link", { name: "Inbox", exact: true }).click();
    await expect(alice.getByText("Your Inbox", { exact: true })).toBeVisible();
    console.log(
      "PASS: theme, mobile navigation, drawer Escape dismissal, no horizontal overflow"
    );

    const c = await browser.newContext({ baseURL });
    const charlie = await signup(c, "Charlie");
    // Direct unauthorized conversation navigation exercises listener error states.
    await charlie.goto(`${baseURL}/conversation/${conversationId}`);
    await expect(
      charlie.getByText("Unable to load this conversation.", { exact: true })
    ).toBeVisible({ timeout: 30000 });
    await expect(charlie.getByLabel("Message", { exact: true })).toBeDisabled();
    expect(errors).toEqual([]);
    console.log(
      "PASS: unauthorized conversation errors are visible and sending is disabled; no browser runtime exceptions"
    );
  } catch (error) {
    if (browser)
      for (const [i, context] of browser.contexts().entries())
        for (const [j, page] of context.pages().entries()) {
          console.log(
            `Failure page ${i}/${j}: ${page.url()}\n${(await page.locator("body").innerText()).slice(0, 2000)}`
          );
          await page
            .screenshot({ path: `test-results/failure-${i}-${j}.png` })
            .catch(() => {});
        }
    throw error;
  } finally {
    await browser?.close();
    let cleanupError;
    try {
      if (uploadedAssets.length) {
        const { v2: cloudinary } = require("cloudinary");
        cloudinary.config({
          cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        for (const publicId of uploadedAssets) {
          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
          });
          if (result.result !== "ok")
            throw new Error("Cloudinary test asset cleanup failed");
        }
      }
    } catch (error) {
      cleanupError = error;
    }
    if (server.pid) {
      if (process.platform === "win32") {
        try {
          execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
            stdio: "ignore",
            windowsHide: true,
          });
        } catch {}
      } else server.kill("SIGTERM");
    }
    fs.closeSync(log);
    if (cleanupError) throw cleanupError;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
