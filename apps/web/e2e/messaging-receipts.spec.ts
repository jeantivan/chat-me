import { test, expect } from "@playwright/test";

test.describe("Real-Time Direct Messaging & Status Receipts Progression", () => {
  test("two simultaneous browser sessions verify real-time dispatch and receipt progression (idle -> send -> received -> read)", async ({
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
    // It should render immediately with status icon
    const statusOnA = pageA.locator(`[data-testid^="message-status-"]`).last();
    await expect(statusOnA).toBeVisible();

    // 8. Bob's client receives message via WebSocket while outside the chat
    // Bob's client emits message:ack_received, updating Alice's status to 'received' (double gray ticks)
    await expect(pageA.locator('[data-testid="message-status-received"]').last()).toBeVisible({ timeout: 10000 });

    // 9. Bob now clicks and opens the chat /c/$chatId in active viewport
    await pageB.click(`[data-testid="chat-item-${chatId}"]`);
    await expect(pageB.locator(".chat-container").getByText(testMessageText)).toBeVisible({ timeout: 10000 });

    // 10. Because Bob is viewing the message in active viewport, Bob's client emits message:ack_read
    // Alice's message status transitions to 'read' (double blue ticks)
    await expect(pageA.locator('[data-testid="message-status-read"]').last()).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
  });
});
