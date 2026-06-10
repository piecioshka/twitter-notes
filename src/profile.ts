// Detects whether a given URL is an X user profile, and extracts the profile name.

/** Hosts treated as X. */
const X_HOSTS = new Set(['x.com', 'twitter.com', 'www.x.com', 'www.twitter.com'])

/**
 * First-segment paths that are NOT profiles (app sections).
 * The list is intentionally broad — a false match would show the panel where it shouldn't.
 */
const RESERVED = new Set([
  'home', 'explore', 'notifications', 'messages', 'bookmarks', 'search',
  'settings', 'i', 'compose', 'lists', 'hashtag', 'tos', 'privacy', 'about',
  'login', 'logout', 'signup', 'intent', 'share', 'account', 'communities',
  'premium', 'premium_sign_up', 'verified_orgs', 'jobs', 'topics', 'connect_people',
  'follower_requests', 'your_twitter_data', 'personalization', 'display',
  'download', 'flow', 'oauth', 'oauth2', 'widgets', 'tweet', 'status',
  'home_timeline', 'mentions', 'moments', 'analytics', 'ads', 'help',
  'who_to_follow', 'graphql', 'live', 'broadcasts', 'spaces',
])

/**
 * Second path segment that still refers to the SAME profile (profile tabs).
 * The panel should stay visible on these.
 */
const PROFILE_SUBTABS = new Set([
  'with_replies', 'media', 'likes', 'highlights', 'superfollows',
  'affiliates', 'articles', 'verified_followers',
])

/** X profile name rules: letters/digits/underscore, 1–15 chars. */
const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/

export interface ProfileMatch {
  /** Profile name from the URL (original letter case, without "@"). */
  handle: string
}

/**
 * Returns a profile match for the given URL, or null.
 * Accepts: `/<handle>` and `/<handle>/<subtab>` (profile tabs).
 */
export function parseProfile(url: URL): ProfileMatch | null {
  if (!X_HOSTS.has(url.hostname)) return null

  const segments = url.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean)
  if (segments.length === 0) return null

  const first = segments[0]
  if (first === undefined) return null

  // longer paths allowed only for known profile tabs
  if (segments.length > 1) {
    const second = segments[1]
    if (second === undefined || !PROFILE_SUBTABS.has(second)) return null
  }

  if (!HANDLE_RE.test(first)) return null
  if (RESERVED.has(first.toLowerCase())) return null

  return { handle: first }
}

/** Convenience shortcut: whether the URL (as a string) points to a profile. */
export function parseProfileFromHref(href: string): ProfileMatch | null {
  try {
    return parseProfile(new URL(href))
  } catch {
    return null
  }
}
