# Operator House — Final-Mile Test Guide

Use this guide after publishing the latest checkpoint. Each test is safe to perform with your own data. The PayPal sandbox test is explicitly marked separately because it creates only a no-charge test subscription.

## 1. Confirm the Onboarding Cinematic Recovery

1. Open the published Operator House app in a private/incognito window, or use **Replay Intro** in the sidebar after you sign in.
2. On the first screen, select **Show me the room**.
3. On the **Meet Specter** screen, wait up to **15 seconds** for the clip to begin. The text and Next button should remain usable the entire time.
4. If the video cannot load, you should see a subtly moving poster, not a black screen, plus **Retry motion**. Select it after your connection is stable; the app reloads that same onboarding slide and tries the original clip again.
5. Select the Next arrow or **Skip intro**. You should always be able to continue even if media is unavailable.

**Pass condition:** no black or blocked screen; onboarding remains readable and navigable; normal clips play when the network is available.

## 2. Save an Approved Strategy to the Vault

**Before you start:** You need one completed strategy. Create one from **Strategy Generator** if your history is empty.

1. Open **Strategy Generator** from the sidebar.
2. Scroll to **Recent Strategies** and expand a strategy that shows completed content.
3. Select **Save to Vault**.
4. You should see: **“Approved strategy saved to your Vault.”**
5. Open **The Vault** from the sidebar and find the new item. It is tagged `approved-strategy` and records the strategy as its source.
6. Return to the same strategy and select **Save to Vault** again.

**Pass condition:** the second click says the strategy is already saved; it does not create a duplicate Vault item.

## 3. Create and Revoke a Branded Client Strategy Link

**Before you start:** You need one completed strategy and at least one Vault item.

1. In **Strategy Generator → Recent Strategies**, select **Share** on a completed strategy.
2. Enter the client name and your consultant/brand name.
3. Optionally paste a publicly hosted logo URL and choose an accent color.
4. Select one or more **client-visible source excerpts**. Only these selected excerpts will be visible to a recipient.
5. Choose an expiry period, then select **Create client-ready link**.
6. Copy the link and open it in an incognito/private window.
7. Confirm the recipient sees your branding, the strategy, and only the selected evidence excerpts—no sidebar, chatbot, client list, Vault browser, or internal workspace controls.
8. Return to the Share panel. Under **Existing client links**, select **Revoke**.
9. Refresh the copied link.

**Pass condition:** the link works before revocation and becomes unavailable after revocation. Never share a link containing sensitive content until you have reviewed the selected excerpts.

## 4. Record a Pipeline Outcome and Learning Signal

**Before you start:** You need at least one deal. If the board is empty, open **Pipeline** and use **New Deal** to create one.

1. In **Pipeline**, drag a deal card into the **Closed** column.
2. In the outcome prompt, select either **Closed Won** or **Closed Lost**.
3. For **Closed Lost**, choose one concise reason such as Budget, Timing, Not a priority, Fit, Competitor, No response, or Other.
4. Select **Record Closed Lost**.
5. Look above the board for **Close-lost signals**.

**Pass condition:** wins close without requiring a reason; losses require one short reason; the learning signal shows only real recorded loss counts.

## 5. Optional PayPal Sandbox Release Check

Use your normal desktop browser and a PayPal **Sandbox buyer** account—not a live PayPal account.

1. Open the published app and choose **Pricing**.
2. Select a plan, then **Continue to billing**.
3. Complete the PayPal Sandbox approval for the $0 test trial.
4. Return to Operator House and confirm the success message says **Founding access activated**.
5. In PayPal Sandbox, cancel the test subscription when finished.

**Pass condition:** no live payment is created; the test activates access only after PayPal reports an approved sandbox subscription. If browser input prevents entering sandbox credentials, complete this check separately in your own browser.
