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

    // 3. User B opens chat route /c/$chatId and logs in
    await pageB.goto(`http://localhost:5173/c/${chatId}`);
    await pageB.fill("#login-email", userB.email);
    await pageB.fill("#login-password", userB.password);
    await pageB.click('button[type="submit"]');
    await expect(pageB.locator('[data-testid="message-input"]')).toBeVisible({ timeout: 15000 });

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
    // It should render and reach at least 'send' (single tick)
    const statusOnA = pageA.locator(`[data-testid^="message-status-"]`).last();
    await expect(statusOnA).toBeVisible();

    // 8. In User B's browser, message arrives in real-time in the timeline
    await expect(pageB.locator(".chat-container").getByText(testMessageText)).toBeVisible({ timeout: 10000 });

    // 9. Because User B is active in viewport, Bob confirms read
    // User A's message status transitions to 'read' (double blue ticks)
    await expect(pageA.locator('[data-testid="message-status-read"]').last()).toBeVisible({ timeout: 10000 });

    await contextA.close();
    await contextB.close();
  });
});
