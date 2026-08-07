const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Periodically clean up expired rate limit entries every 15 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now > data.resetTime) {
        rateLimitMap.delete(ip)
      }
    }
  }, 15 * 60 * 1000)
}

export function rateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxAttempts = 5

  const data = rateLimitMap.get(ip)

  if (!data) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + windowMs
    })
    return { allowed: true }
  }

  if (now > data.resetTime) {
    // Window expired, reset
    data.count = 1
    data.resetTime = now + windowMs
    return { allowed: true }
  }

  if (data.count >= maxAttempts) {
    return {
      allowed: false,
      retryAfterMs: data.resetTime - now
    }
  }

  data.count++
  return { allowed: true }
}
