// The server controls expiration; persistence also survives closing the browser.
export const adminCredentialStorageKey = 'time2gather.admin.credential'
let credential: string | null = null

export function getAdminCredential () {
  try {
    const saved = window.localStorage.getItem(adminCredentialStorageKey)
    const legacy = saved ? null : window.sessionStorage.getItem(adminCredentialStorageKey)
    credential = saved || legacy
    if (legacy) window.localStorage.setItem(adminCredentialStorageKey, legacy)
    window.sessionStorage.removeItem(adminCredentialStorageKey)
  } catch {
    // Browsers that block storage can still use an in-memory login.
  }
  return credential
}

export function setAdminCredential (value: string | null) {
  credential = value
  try {
    if (value) window.localStorage.setItem(adminCredentialStorageKey, value)
    else window.localStorage.removeItem(adminCredentialStorageKey)
    window.sessionStorage.removeItem(adminCredentialStorageKey)
  } catch {
    // Storage availability must not prevent login or logout.
  }
}
