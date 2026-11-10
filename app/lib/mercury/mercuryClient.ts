import "server-only";

const MERCURY_BASE = "https://api.mercury.com/api/v1";

export class MercuryApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = "MercuryApiError";
  }
}

function getToken(): string {
  const token = process.env.MERCURY_API_TOKEN?.trim();
  if (!token) {
    throw new MercuryApiError("MERCURY_API_TOKEN not configured", 500);
  }
  return token;
}

export async function mercuryFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${getToken()}`);
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${MERCURY_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new MercuryApiError(
      `Mercury API error: ${res.status}`,
      res.status,
      detail,
    );
  }

  return res.json() as Promise<T>;
}
