// Lightweight Node.js verification script for the framework-agnostic core client.
// Uses the built dist bundle to avoid extra tooling dependencies.

import { AgentChatClient, AgentChatError } from "../dist/index.js";

const config = {
  apiUrl: process.env.AGENTCHAT_API_URL || "http://127.0.0.1:8787",
  testUser: process.env.AGENTCHAT_TEST_USER || "testuser",
  testPassword: process.env.AGENTCHAT_TEST_PASSWORD || "testpass",
};

function log(msg) {
  // eslint-disable-next-line no-console
  console.log(msg);
}

/**
 * Happy-path verification: mirrors the working curl flow.
 */
async function verifyHappyPath() {
  log("🔍 AgentChat Core Verification (Node)");
  log(`API URL: ${config.apiUrl}`);
  log("");

  const client = new AgentChatClient({
    apiUrl: config.apiUrl,
    getToken: () => null,
    setToken: () => {},
    clearToken: () => {},
  });

  try {
    // 1. Login as agent (matches curl behavior)
    log("• Test 1: loginAsAgent");
    const auth = await client.loginAsAgent(
      config.testUser,
      config.testPassword
    );
    log(`  ✓ Logged in as ${auth.username} (${auth.kind})`);

    // 2. Get channels
    log("• Test 2: getChannels");
    const channels = await client.getChannels();
    log(`  ✓ Found ${channels.length} channel(s)`);

    // 3. Get messages for first channel (if any)
    if (channels.length > 0) {
      const channelId = channels[0].conversationId;
      log("• Test 3: getMessages");
      const messages = await client.getMessages(channelId, { limit: 20 });
      log(`  ✓ Loaded ${messages.length} message(s) for ${channelId}`);

      // 4. Send a test message
      log("• Test 4: sendMessage");
      const sent = await client.sendMessage(
        channelId,
        "[verify-core] test message"
      );
      log(`  ✓ Sent message id=${sent.id}`);
    } else {
      log("  ℹ No channels yet; skipping getMessages/sendMessage");
    }

    // 5. Presence
    log("• Test 5: getPresence");
    const presence = await client.getPresence();
    log(
      `  ✓ Presence: ${presence.online.length} online, ${
        Object.keys(presence.lastSeenAt ?? {}).length
      } lastSeen entries`
    );

    // 6. Logout
    log("• Test 6: logout");
    await client.logout();
    log("  ✓ Logout successful");

    log("");
    log("✅ Happy-path core verification completed.");
    return true;
  } catch (err) {
    log("");
    log("❌ Happy-path core verification failed.");
    // eslint-disable-next-line no-console
    console.error(err);
    return false;
  }
}

/**
 * Negative-path verification: ensure AgentChatError codes behave as expected.
 */
async function verifyErrorHandling() {
  log("");
  log("🔍 Error Handling Verification");
  log("━".repeat(50));
  log("");

  const unauthenticatedClient = new AgentChatClient({
    apiUrl: config.apiUrl,
    getToken: () => null,
    setToken: () => {},
    clearToken: () => {},
  });

  let passCount = 0;
  let failCount = 0;

  // Test 1: Invalid credentials
  log("Test 1: Invalid credentials → auth error");
  try {
    await unauthenticatedClient.loginAsHuman(
      "invalid_user_xyz",
      "wrong_password"
    );
    log("  ❌ Should have thrown AgentChatError");
    failCount++;
  } catch (error) {
    if (error instanceof AgentChatError) {
      if (AgentChatError.isAuthError(error)) {
        log(`  ✓ Threw auth error: ${error.code} (status ${error.status})`);
        passCount++;
      } else {
        log(
          `  ❌ Wrong error code: ${error.code} (expected UNAUTHORIZED / FORBIDDEN)`
        );
        failCount++;
      }
    } else {
      log("  ❌ Not an AgentChatError");
      // eslint-disable-next-line no-console
      console.error(error);
      failCount++;
    }
  }

  // Test 2: Network error (invalid URL)
  log("Test 2: Invalid API URL → NETWORK_ERROR");
  const badUrlClient = new AgentChatClient({
    apiUrl: "http://nonexistent.invalid.local:9999",
    getToken: () => null,
    setToken: () => {},
    clearToken: () => {},
  });

  try {
    await badUrlClient.getChannels();
    log("  ❌ Should have thrown AgentChatError");
    failCount++;
  } catch (error) {
    if (error instanceof AgentChatError) {
      if (AgentChatError.isNetworkError(error)) {
        log(`  ✓ Correctly threw NETWORK_ERROR (code=${error.code})`);
        passCount++;
      } else {
        log(
          `  ❌ Wrong error code: ${error.code} (expected NETWORK_ERROR), status=${error.status}`
        );
        failCount++;
      }
    } else {
      log("  ❌ Not an AgentChatError");
      // eslint-disable-next-line no-console
      console.error(error);
      failCount++;
    }
  }

  // Test 3: Protected endpoint without auth
  log("Test 3: Protected endpoint without token → auth error");
  try {
    await unauthenticatedClient.getChannels();
    log("  ❌ Should have thrown AgentChatError");
    failCount++;
  } catch (error) {
    if (error instanceof AgentChatError) {
      if (AgentChatError.isAuthError(error)) {
        log(`  ✓ Threw auth error: ${error.code} (status ${error.status})`);
        passCount++;
      } else {
        log(
          `  ❌ Wrong error code: ${error.code} (expected UNAUTHORIZED / FORBIDDEN)`
        );
        failCount++;
      }
    } else {
      log("  ❌ Not an AgentChatError");
      // eslint-disable-next-line no-console
      console.error(error);
      failCount++;
    }
  }

  // Test 4: Non-existent conversation ID (soft check)
  log("Test 4: Non-existent conversation → ideally NOT_FOUND (soft check)");
  const maybeAuthedClient = new AgentChatClient({
    apiUrl: config.apiUrl,
    getToken: () => null,
    setToken: () => {},
    clearToken: () => {},
  });

  try {
    await maybeAuthedClient.loginAsAgent(
      config.testUser,
      config.testPassword
    );
  } catch (err) {
    log("  ⚠️ Could not login for 404 test; skipping this check.");
  }

  try {
    await maybeAuthedClient.getMessages("nonexistent-conversation-id-12345");
    log("  ⚠️ API did not error for nonexistent conversation id (acceptable)");
  } catch (error) {
    if (error instanceof AgentChatError) {
      if (error.code === "NOT_FOUND" && error.status === 404) {
        log(`  ✓ Threw NOT_FOUND as expected (status ${error.status})`);
        passCount++;
      } else {
        log(
          `  ⚠️ Got ${error.code} (status ${error.status}); NOT_FOUND would be ideal but this is not a hard failure`
        );
      }
    } else {
      log("  ❌ Not an AgentChatError");
      // eslint-disable-next-line no-console
      console.error(error);
      failCount++;
    }
  }

  log("");
  log("━".repeat(50));
  const total = passCount + failCount;
  log(`Error handling: ${passCount}/${total} tests passed`);

  if (failCount > 0) {
    log("");
    log("⚠️ Some error handling tests failed");
    return false;
  }

  log("✅ All error handling tests passed!");
  return true;
}

/**
 * Run all verifications and set exit code accordingly.
 */
async function runAll() {
  try {
    const happyPathPassed = await verifyHappyPath();
    const errorHandlingPassed = await verifyErrorHandling();

    log("");
    log("═".repeat(50));

    if (happyPathPassed && errorHandlingPassed) {
      log("✅ ALL VERIFICATIONS PASSED");
      log("═".repeat(50));
      process.exit(0);
    } else {
      log("❌ SOME VERIFICATIONS FAILED");
      log("═".repeat(50));
      process.exit(1);
    }
  } catch (error) {
    log("");
    log("💥 Unexpected error during verification:");
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  }
}

runAll();

