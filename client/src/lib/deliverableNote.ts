export function buildClientDeliveryNote({
  clientName,
  title,
  url,
  expiresAt,
}: {
  clientName?: string;
  title: string;
  url: string;
  expiresAt?: Date | string | null;
}) {
  const expiry = expiresAt ? new Date(expiresAt).toLocaleDateString() : null;
  return [
    clientName ? `Hi ${clientName},` : "Hello,",
    "",
    `I prepared ${title} for you. It includes the recommendations and the selected source trail behind them, so you can see the reasoning without accessing my private workspace.`,
    "",
    `View it here: ${url}`,
    expiry ? `The private link is available until ${expiry}.` : "",
    "",
    "Please reply with any questions or the point you would like to discuss next.",
  ].filter(Boolean).join("\n");
}
