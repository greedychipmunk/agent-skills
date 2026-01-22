/**
 * Middleware Template
 *
 * This template demonstrates Next.js Middleware with:
 * - Authentication/authorization checks
 * - Redirects and rewrites
 * - Request/response modification
 * - Geolocation-based routing
 * - Rate limiting patterns
 * - Logging and analytics
 *
 * Middleware runs before every request to matched routes.
 * It executes on the Edge Runtime for fast performance.
 *
 * Usage:
 * 1. Copy to middleware.ts at project root
 * 2. Customize the matcher configuration
 * 3. Implement your middleware logic
 *
 * Location: middleware.ts (project root, same level as app/)
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// ============================================================================
// TYPES
// ============================================================================

interface RateLimitEntry {
  count: number
  timestamp: number
}

// In-memory store (for demo - use Redis/KV in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1"
  return ip
}

/**
 * Check if user is authenticated
 * Implement your actual auth check here
 */
function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get("auth-token")?.value
  // TODO: Implement actual token verification
  return !!token
}

/**
 * Get user role from token
 */
function getUserRole(request: NextRequest): string | null {
  const role = request.cookies.get("user-role")?.value
  return role || null
}

/**
 * Simple rate limiting check
 */
function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now - entry.timestamp > windowMs) {
    // New window
    rateLimitStore.set(identifier, { count: 1, timestamp: now })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    }
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.timestamp + windowMs,
    }
  }

  // Increment count
  entry.count++
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.timestamp + windowMs,
  }
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  )

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY")

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")

  // Enable XSS filter
  response.headers.set("X-XSS-Protection", "1; mode=block")

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Permissions policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  )

  return response
}

/**
 * Log request for analytics
 */
function logRequest(request: NextRequest) {
  const logData = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    userAgent: request.headers.get("user-agent"),
    ip: getClientIp(request),
    referer: request.headers.get("referer"),
  }

  // TODO: Send to your analytics service
  console.log("Request:", JSON.stringify(logData))
}

// ============================================================================
// MIDDLEWARE HANDLERS
// ============================================================================

/**
 * Handle authentication for protected routes
 */
function handleAuth(request: NextRequest): NextResponse | null {
  const isAuth = isAuthenticated(request)
  const pathname = request.nextUrl.pathname

  // Protected routes that require authentication
  const protectedPaths = ["/dashboard", "/profile", "/settings", "/api/user"]

  const isProtectedPath = protectedPaths.some(
    (path) => pathname.startsWith(path)
  )

  if (isProtectedPath && !isAuth) {
    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ["/login", "/register", "/forgot-password"]
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path))

  if (isAuthPath && isAuth) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return null
}

/**
 * Handle role-based access control
 */
function handleRBAC(request: NextRequest): NextResponse | null {
  const role = getUserRole(request)
  const pathname = request.nextUrl.pathname

  // Admin-only routes
  const adminPaths = ["/admin", "/api/admin"]
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path))

  if (isAdminPath && role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url))
  }

  return null
}

/**
 * Handle API rate limiting
 */
function handleRateLimit(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname

  // Only rate limit API routes
  if (!pathname.startsWith("/api")) {
    return null
  }

  const ip = getClientIp(request)
  const { allowed, remaining, resetTime } = checkRateLimit(
    `api:${ip}`,
    100, // 100 requests
    60 * 1000 // per minute
  )

  if (!allowed) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(resetTime),
          "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
        },
      }
    )
  }

  return null
}

/**
 * Handle internationalization routing
 */
function handleI18n(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname

  // Skip if already has locale
  const locales = ["en", "es", "fr", "de"]
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return null
  }

  // Get preferred locale from headers or cookie
  const acceptLanguage = request.headers.get("accept-language")
  const preferredLocale = request.cookies.get("locale")?.value

  let locale = preferredLocale || "en"

  if (!preferredLocale && acceptLanguage) {
    // Parse accept-language header
    const preferred = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().substring(0, 2))
      .find((lang) => locales.includes(lang))

    if (preferred) {
      locale = preferred
    }
  }

  // Rewrite to locale path (internal rewrite, URL stays the same)
  // Or redirect if you want URL to change
  // return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))

  return NextResponse.rewrite(new URL(`/${locale}${pathname}`, request.url))
}

/**
 * Handle geolocation-based routing
 */
function handleGeo(request: NextRequest): NextResponse | null {
  const country = request.geo?.country || "US"
  const pathname = request.nextUrl.pathname

  // Example: Block certain countries
  const blockedCountries = ["XX"] // Add blocked country codes
  if (blockedCountries.includes(country)) {
    return new NextResponse("Access denied", { status: 403 })
  }

  // Example: Redirect to country-specific content
  if (pathname === "/" && country !== "US") {
    // Could redirect to localized version
    // return NextResponse.redirect(new URL(`/${country.toLowerCase()}`, request.url))
  }

  return null
}

// ============================================================================
// MAIN MIDDLEWARE
// ============================================================================

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // Has file extension
  ) {
    return NextResponse.next()
  }

  // Log request (optional)
  logRequest(request)

  // Check rate limiting for API routes
  const rateLimitResponse = handleRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  // Handle authentication
  const authResponse = handleAuth(request)
  if (authResponse) return authResponse

  // Handle role-based access
  const rbacResponse = handleRBAC(request)
  if (rbacResponse) return rbacResponse

  // Handle internationalization (optional)
  // const i18nResponse = handleI18n(request)
  // if (i18nResponse) return i18nResponse

  // Handle geolocation (optional)
  // const geoResponse = handleGeo(request)
  // if (geoResponse) return geoResponse

  // Continue with request and add security headers
  const response = NextResponse.next()

  // Add rate limit headers for API routes
  if (pathname.startsWith("/api")) {
    const ip = getClientIp(request)
    const { remaining, resetTime } = checkRateLimit(ip, 100, 60000)
    response.headers.set("X-RateLimit-Limit", "100")
    response.headers.set("X-RateLimit-Remaining", String(remaining))
    response.headers.set("X-RateLimit-Reset", String(resetTime))
  }

  // Add security headers
  addSecurityHeaders(response)

  return response
}

// ============================================================================
// MATCHER CONFIGURATION
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",

    /*
     * Or match specific paths:
     */
    // "/dashboard/:path*",
    // "/api/:path*",
    // "/admin/:path*",
  ],
}
