import { test, expect } from "@playwright/test";

// Valid 1x1 transparent PNG buffer for real browser canvas metadata extraction & S3/MinIO upload
const ONE_BY_ONE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

test.describe("Primary High Seam: Multi-User Real-Time Messaging, Receipts, Typing & Media Lightbox E2E", () => {
  test("two simultaneous browser contexts verify messaging, receipt tick progression, typing indicators, and media lightbox", async ({
    browser,
  }) => {
    // 1. Create two isolated browser contexts
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // 2. Generate unique credentials
    const timestamp = Date.now();
    const userA = {
      name: "Alice Playwright",
      email: `alice-pw-${timestamp}@example.com`,
      password: "Password123!",
    };
    const userB = {
      name: "Bob Playwright",
      email: `bob-pw-${timestamp}@example.com`,
      password: "Password123!",
    };

    // Register User A and User B via Fastify server API
    const regARes = await pageA.request.post("http://localhost:3001/api/v1/auth/register", {
      data: userA,
    });
    expect(regARes.ok()).toBe(true);
    const dataA = await regARes.json();

    const regBRes = await pageB.request.post("http://localhost:3001/api/v1/auth/register", {
      data: userB,
    });
    expect(regBRes.ok()).toBe(true);
    const dataB = await regBRes.json();

    // Create direct chat between Alice and Bob
    const chatRes = await pageA.request.post("http://localhost:3001/api/v1/chats/direct", {
      headers: { authorization: `Bearer ${dataA.accessToken}` },
      data: { targetUserId: dataB.user.id },
    });
    expect(chatRes.ok()).toBe(true);
    const chatData = await chatRes.json();
    const chatId = chatData.id;

    // 3. User B opens web app at '/' and logs in
    await pageB.goto("http://localhost:5173/");
    await pageB.fill("#login-email", userB.email);
    await pageB.fill("#login-password", userB.password);
    await pageB.click('button[type="submit"]');
    await expect(pageB.locator(`[data-testid="chat-item-${chatId}"]`)).toBeVisible({ timeout: 15000 });

    // 4. User A opens chat route /c/$chatId and logs in
    await pageA.goto(`http://localhost:5173/c/${chatId}`);
    await pageA.fill("#login-email", userA.email);
    await pageA.fill("#login-password", userA.password);
    await pageA.click('button[type="submit"]');
    await expect(pageA.locator('[data-testid="message-input"]')).toBeVisible({ timeout: 15000 });

    // 5. User A types a message
    const testMessageText = `Hello Bob, real-time message at ${timestamp}`;
    await pageA.click('[data-testid="message-input"]');
    await pageA.keyboard.type(testMessageText);

    // 6. User A clicks send
    await pageA.click('[data-testid="send-message-button"]');

    // 7. Verify progression in User A's browser:
    // It should render immediately with optimistic status ('idle' clock or 'send' single tick)
    await expect(
      pageA.locator('[data-testid="message-status-send"], [data-testid="message-status-idle"]').last()
    ).toBeVisible({ timeout: 5000 });

    // 8. Bob's client receives message via WebSocket while outside the chat
    // Bob's client emits message:ack_received, updating Alice's status to 'received' (double gray ticks)
    await expect(pageA.locator('[data-testid="message-status-received"]').last()).toBeVisible({ timeout: 10000 });

    // 9. Bob now clicks and opens the chat /c/$chatId in active viewport
    await pageB.click(`[data-testid="chat-item-${chatId}"]`);
    await expect(pageB.locator(".chat-container").getByText(testMessageText)).toBeVisible({ timeout: 10000 });

    // 10. Because Bob is viewing the message in active viewport, Bob's client emits message:ack_read
    // Alice's message status transitions to 'read' (double blue ticks)
    await expect(pageA.locator('[data-testid="message-status-read"]').last()).toBeVisible({ timeout: 10000 });

    // 11. Verify real-time typing indicators:
    // When Alice types in the composer, Bob sees the header typing indicator in real time
    await pageA.click('[data-testid="message-input"]');
    await pageA.keyboard.type("Checking typing indicator...");
    await expect(pageB.getByTestId("header-typing-indicator")).toBeVisible({ timeout: 5000 });
    await expect(pageB.getByTestId("header-typing-indicator")).toHaveText("typing...");

    // Clear or send the typed message
    await pageA.click('[data-testid="send-message-button"]');
    await expect(pageB.locator(".chat-container").getByText("Checking typing indicator...")).toBeVisible({
      timeout: 10000,
    });

    // 12. Verify Media Upload & Fullscreen Media Lightbox:
    // Alice attaches a PNG image and sends it with a caption
    const mediaCaption = `Playwright media upload ${timestamp}`;
    const fileInput = pageA.locator('.chat-container input[type="file"]');
    await fileInput.setInputFiles({
      name: "e2e-photo.png",
      mimeType: "image/png",
      buffer: ONE_BY_ONE_PNG,
    });

    // Verify local preview thumbnail appears in Alice's composer before sending
    await expect(pageA.locator('img[alt="e2e-photo.png"]')).toBeVisible({ timeout: 5000 });

    await pageA.click('[data-testid="message-input"]');
    await pageA.keyboard.type(mediaCaption);
    await pageA.click('[data-testid="send-message-button"]');

    // Bob receives the media message in real time
    await expect(pageB.locator(".chat-container").getByText(mediaCaption)).toBeVisible({ timeout: 15000 });
    const mediaAttachmentOnB = pageB.getByTestId("media-attachment").last();
    await expect(mediaAttachmentOnB).toBeVisible({ timeout: 10000 });

    // Bob clicks the media attachment to open the fullscreen Media Lightbox
    await mediaAttachmentOnB.click();
    const lightbox = pageB.getByTestId("media-lightbox");
    await expect(lightbox).toBeVisible({ timeout: 5000 });
    await expect(lightbox.getByText("Alice Playwright")).toBeVisible();
    await expect(lightbox.getByText(mediaCaption)).toBeVisible();

    // Verify zoom controls inside the Media Lightbox
    await expect(lightbox.getByText("100%")).toBeVisible();
    await lightbox.getByRole("button", { name: /acercar|zoom in/i }).click();
    await expect(lightbox.getByText("125%")).toBeVisible();

    // Close the Media Lightbox
    await lightbox.getByRole("button", { name: /cerrar imagen/i }).click();
    await expect(lightbox).toBeHidden();

    await contextA.close();
    await contextB.close();
  });
});
