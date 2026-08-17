# PayPal Sandbox Release Check

Run this check in a normal desktop browser with a **PayPal Sandbox buyer account**. It creates a sandbox subscription only; it does **not** charge a real payment method or create a live customer subscription.

| Step | Expected result |
| --- | --- |
| Open the published app and sign in with a test Operator House user. | You reach the dashboard with your own test workspace. |
| Open **Pricing** and select **Operator** or **Operator Pro**. | The CTA takes you to `/billing-setup?tier=…`; it does not open a detached checkout window. |
| Confirm the displayed plan, founding price, and 90-day no-charge trial. | The selected plan matches the intended tier. |
| Approve the PayPal **Sandbox** subscription. | Operator House shows “Founding access activated” and returns to the dashboard. |
| Open billing controls or refresh the dashboard. | The account has a subscription ID, the selected founding tier, and a `trialing` or `active` billing status. |
| Cancel the sandbox subscription in the app or Sandbox. | The account updates to `cancelled` after the relevant cancellation action or webhook. |

If approval cannot be completed, collect the PayPal error reference, the selected tier, and the current URL. Do not test with a live PayPal account or a real payment method.
