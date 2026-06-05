import webpush from 'web-push';
import { ENV } from './_core/env';

// ─── Boot-time guard ──────────────────────────────────────────────────────────
// VAPID keys must be set as environment variables. The previously committed
// fallback keys are now considered compromised and have been rotated.
// Generate a fresh pair with: npx web-push generate-vapid-keys
if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
  throw new Error(
    '[boot] VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are required. ' +
    'Generate a new keypair with: npx web-push generate-vapid-keys'
  );
}

webpush.setVapidDetails(
  'mailto:hello@operatorhouse.click',
  ENV.vapidPublicKey,
  ENV.vapidPrivateKey,
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
// VAPID_PUBLIC_KEY is intentionally non-secret — it is the public half of the
// ECDH keypair and must be sent to browsers to create push subscriptions.
// Only VAPID_PRIVATE_KEY is secret and it never leaves the server.
export const VAPID_PUBLIC_KEY = ENV.vapidPublicKey;
