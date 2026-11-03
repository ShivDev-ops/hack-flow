/**
 * A resilient fetch wrapper that automatically retries transient network errors
 * such as closed idle sockets, ECONNRESET, and transient DNS/socket failures.
 */
export async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 3,
  delay = 250
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      return await fetch(input, init);
    } catch (err: any) {
      attempt++;
      const isTransient =
        err?.name === 'TypeError' ||
        err?.message?.includes('fetch failed') ||
        err?.code === 'ECONNRESET' ||
        err?.code === 'ETIMEDOUT' ||
        err?.cause?.code === 'ECONNRESET' ||
        err?.cause?.code === 'UND_ERR_SOCKET' ||
        err?.cause?.code === 'ENETUNREACH';

      if (attempt < retries && isTransient) {
        console.warn(
          `[Supabase Fetch Retry] Attempt ${attempt} failed with: ${err?.message || err}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}

