// Provider-neutral transactional email HTTP adapter. Configure a provider endpoint and key in deployment secrets.
export async function sendTransactionalEmail({ to, subject, text }) {
  const endpoint = process.env.EMAIL_API_URL;
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!endpoint || !apiKey || !from) {
    if (process.env.NODE_ENV === "production")
      throw new Error("Transactional email is not configured");
    console.warn(
      `Transactional email not sent in development: ${subject} (configure EMAIL_API_URL/EMAIL_API_KEY/EMAIL_FROM).`,
    );
    return { delivered: false, reason: "email_not_configured" };
  }
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!response.ok)
    throw new Error(
      `Transactional email provider returned HTTP ${response.status}`,
    );
  return { delivered: true };
}
