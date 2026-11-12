export type GoogleIdentity = {
  initialize: (options: { client_id: string, callback: (result: { credential: string }) => void, auto_select: boolean }) => void
  renderButton: (element: HTMLElement, options: { theme: string, size: string, text: string, locale?: string }) => void
  disableAutoSelect: () => void
}

let googleScript: Promise<GoogleIdentity> | undefined

export function loadGoogle (): Promise<GoogleIdentity> {
  const identity = (window as unknown as { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts?.id
  if (identity) return Promise.resolve(identity)
  if (googleScript) return googleScript

  googleScript = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script')
    const fail = () => {
      window.clearTimeout(timeout)
      script.onload = null
      script.onerror = null
      script.remove()
      googleScript = undefined
      reject(new Error('Google login unavailable'))
    }
    const timeout = window.setTimeout(fail, 15000)
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      const google = (window as unknown as { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts?.id
      if (!google) return fail()
      window.clearTimeout(timeout)
      script.onload = null
      script.onerror = null
      resolve(google)
    }
    script.onerror = fail
    document.head.appendChild(script)
  })
  return googleScript
}
