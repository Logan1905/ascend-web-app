/**
 * Retries an async function when a JWT clock-skew error is detected.
 * Supabase returns "JWT issued at future" when the client clock is slightly
 * behind the server. A short delay + retry usually resolves it.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 2, delay = 1000 } = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const message = err instanceof Error ? err.message : String(err);

      // Only retry on clock-skew related JWT errors
      const isClockSkew =
        message.includes("JWT issued at future") ||
        message.includes("token is not yet valid");

      if (!isClockSkew || attempt === retries) {
        throw err;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
