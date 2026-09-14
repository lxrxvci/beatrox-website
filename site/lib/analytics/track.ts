'use client'

export type AnalyticsEventParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Client-side GA4 event tracking. No-ops when gtag is unavailable (dev
 * without NEXT_PUBLIC_GA_MEASUREMENT_ID, ad blockers, SSR), so callers
 * never need to guard. Server-side GA4 Data API access lives separately
 * in ./ga4.ts.
 */
export function trackEvent(name: string, params?: AnalyticsEventParams): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}

export function trackPhoneClick(linkUrl: string, linkLocation: string): void {
  trackEvent('phone_click', { link_url: linkUrl, link_location: linkLocation })
}

export function trackRentalsClick(linkUrl: string, linkLocation: string): void {
  trackEvent('rentals_click', { link_url: linkUrl, link_location: linkLocation })
}
