export async function fetcher<T>(
  url: string,
  options?: Omit<RequestInit, 'body'> & { body?: unknown }
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body:
      options?.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}