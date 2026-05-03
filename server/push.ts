import webpush from 'web-push';

// ─── Boot-time guard ──────────────────────────────────────────────────────────
// VAPID keys must be set as environment variables. The previously committed
// fallback keys are now considered compromised and have been rotated.
// Generate a fresh pair with: npx web-push generate-vapid-keys
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  throw new Error(
    '[boot] VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required. ' +
    'Generate a new keypair with: npx web-push generate-vapid-keys'
  );
}

webpush.setVapidDetails(
  'mailto:hello@operatorhouse.click',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function sendPushNotification(
  sub: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string; url?: string }
) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (err: any) {
    // 410 Gone = subscription expired
    if (err?.statusCode === 410) return 'expired';
    console.error('[Push] send failed', err?.message);
    return false;
  }
}

// Export the current public key so the client can subscribe with the correct key.
// NOTE: After rotating VAPID keys, existing push subscriptions tied to the old
// public key will return 410 on next send. The client should re-subscribe on
// receiving a 410 response or on next page load.
export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
