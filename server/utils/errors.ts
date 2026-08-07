/**
 * Sanitize error messages returned to clients in production.
 * In development, returns the original error message.
 * In production, returns a generic 'Internal server error' message.
 */
export function safeErrorMessage(error: any): string {
  if (process.env.NODE_ENV === 'production') {
    return 'Internal server error'
  }
  return error?.message || 'Internal server error'
}
