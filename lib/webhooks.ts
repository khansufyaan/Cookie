import { createHmac } from "node:crypto";
import { webhooksForEvent, type WebhookEvent } from "./db";

/**
 * Webhook delivery — best-effort push notifications to subscribed apps.
 * Each delivery is signed: X-VWR-Signature = HMAC-SHA256(secret, rawBody),
 * so receivers can verify the payload came from us. Fire-and-forget with a
 * short timeout; failures are logged, not retried (documented at-least-once
 * semantics land with the production queue).
 */
export async function deliverWebhooks(
  event: WebhookEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const hooks = await webhooksForEvent(event).catch(() => []);
  if (hooks.length === 0) return;

  const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
  await Promise.allSettled(
    hooks.map(async (h) => {
      const signature = createHmac("sha256", h.secret).update(body).digest("hex");
      try {
        await fetch(h.url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-vwr-event": event,
            "x-vwr-signature": signature,
          },
          body,
          signal: AbortSignal.timeout(5000),
        });
      } catch (err) {
        console.error(`webhook ${h.id} delivery failed:`, err);
      }
    }),
  );
}
