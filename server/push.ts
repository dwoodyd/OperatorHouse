import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:hello@operatorhouse.click',
  process.env.VAPID_PUBLIC_KEY ?? 'BKY0U6ZO8vrRHkguUvoS8UXYWmMM0a9uo8_CkwYBg1cPvGOLXTOxM6QmzAWAdrmEwmFaXYqezT4cdLjAwP4FolQ',
  process.env.VAPID_PRIVATE_KEY ?? 'qbATmcquxaZjLqdQRYHDo4b5i4nsb-kmqzQv3fDwCIk',
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

export const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? 'BKY0U6ZO8vrRHkguUvoS8UXYWmMM0a9uo8_CkwYBg1cPvGOLXTOxM6QmzAWAdrmEwmFaXYqezT4cdLjAwP4FolQ';
