export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  if (!origin) return true;
  try {
    // Next's internal request URL can use localhost behind a proxy or when bound
    // to 127.0.0.1. Compare with the browser-facing Host header instead.
    const parsed = new URL(origin);
    const target = new URL(request.url);
    return (
      ["https:", "http:"].includes(parsed.protocol) &&
      parsed.protocol === target.protocol &&
      parsed.host === (request.headers.get("host") || target.host)
    );
  } catch {
    return false;
  }
}

export function isDocumentId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 1500 &&
    !value.includes("/") &&
    value !== "." &&
    value !== ".."
  );
}
