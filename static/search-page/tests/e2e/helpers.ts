export function authFileFromUrl(url: string) {
    const s = url.split(':')
    return `.playwright/auth/user-${s[2]}.json`
}