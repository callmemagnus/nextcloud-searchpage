/**
 * Warn with a magnifying glass
 * @param rest 
 */
export function cwarn(...rest: unknown[]) {
    console.warn('🔎 SEARCH_PAGE::', ...rest)
}

/**
 * Log with a magnifying glass
 * @param rest 
 */
export function clog(...rest: unknown[]) {
    console.log('🔎 SEARCH_PAGE::', ...rest)
}