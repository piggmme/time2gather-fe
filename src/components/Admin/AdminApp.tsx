import { useTranslation } from '../../hooks/useTranslation'
import {
  lazy, Suspense, useEffect, useRef, useState,
} from 'react'
import { loadGoogle } from './googleIdentity'
import { isAxiosError } from 'axios'

import {
  createAdminSession, getAdminConfig, getAdminCredential, getAdminSession, setAdminCredential, type AdminSession,
} from '../../services/admin'
import { adminCredentialStorageKey } from '../../services/adminCredential'
import styles from './AdminLogin.module.scss'

const AdminDashboard = lazy(() => import('./AdminDashboard'))

function replaceAdminPath (pathname: string) {
  history.replaceState(history.state, '', `${pathname}${window.location.search}${window.location.hash}`)
}

export default function AdminApp () {
  const { t, locale } = useTranslation()
  const [session, setSession] = useState<AdminSession | null>(null)
  const [restoringSession, setRestoringSession] = useState(true)
  const [status, setStatus] = useState('admin.login.checking')
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const button = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const expire = () => {
      setAdminCredential(null)
      setSession(null)
      setRestoringSession(false)
      setError('admin.login.expired')
      replaceAdminPath('/admin/login')
    }
    const storageChanged = (event: StorageEvent) => {
      if ((event.key === adminCredentialStorageKey || event.key === null) && event.newValue === null) expire()
    }
    window.addEventListener('admin-session-expired', expire)
    window.addEventListener('storage', storageChanged)
    return () => {
      window.removeEventListener('admin-session-expired', expire)
      window.removeEventListener('storage', storageChanged)
    }
  }, [])

  useEffect(() => {
    if (!session) return
    // Browser timers overflow beyond ~24.8 days; schedule long sessions in chunks.
    let timeout: number
    const checkExpiry = () => {
      const remaining = new Date(session.expiresAt).getTime() - Date.now()
      if (remaining <= 0) window.dispatchEvent(new Event('admin-session-expired'))
      else timeout = window.setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647))
    }
    checkExpiry()
    return () => window.clearTimeout(timeout)
  }, [session])

  useEffect(() => {
    if (session) return
    let active = true
    setStatus('admin.login.checking')
    const initialize = async () => {
      if (getAdminCredential()) {
        setRestoringSession(true)
        try {
          const identity = await getAdminSession()
          if (!active) return
          setSession(identity)
          setError('')
          replaceAdminPath('/admin')
          return
        } catch (error) {
          if (!active) return
          // Keep the saved login on transient failures so retry can restore it.
          if (!isAxiosError(error) || ![401, 403].includes(error.response?.status ?? 0)) throw error
        }
      }
      if (!active) return
      setRestoringSession(false)
      replaceAdminPath('/admin/login')
      // Load Google only after attempting to restore the existing login.
      const googleReady = loadGoogle().then(google => ({ google, error: null }), error => ({ google: null, error }))
      const config = await getAdminConfig()
      if (!active) return
      if (!config.enabled) {
        setStatus('admin.login.notConfigured')
        return
      }
      const result = await googleReady
      if (!active || !button.current) return
      if (!result.google) throw result.error
      const google = result.google
      google.initialize({
        client_id: config.clientId,
        auto_select: false,
        callback: async ({ credential }) => {
          if (!active) return
          setError('')
          setStatus('admin.login.verifying')
          try {
            const identity = await createAdminSession(credential)
            if (!active) return
            setSession(identity)
            replaceAdminPath('/admin')
          } catch {
            if (!active) return
            setAdminCredential(null)
            setError('admin.login.notAllowed')
            setStatus('admin.login.google')
          }
        },
      })
      button.current.replaceChildren()
      google.renderButton(button.current, { theme: 'outline', size: 'large', text: 'signin_with', locale: locale === 'pcm' ? 'en' : locale })
      setStatus('admin.login.google')
    }
    initialize().catch(() => {
      if (active) {
        setStatus('admin.login.unavailable')
        setError('admin.login.networkError')
      }
    })
    return () => {
      active = false
    }
  }, [session, retry, locale])

  const logout = () => {
    setAdminCredential(null)
    setSession(null)
    setRestoringSession(false)
    setError('')
    void loadGoogle().then(google => google.disableAutoSelect()).catch(() => {})
  }

  if (session) return (
    <>
      <div className={styles.session}>
        <span>{session.email}</span>
        <button type='button' onClick={logout}>{t('admin.login.logout')}</button>
      </div>
      <Suspense fallback={<p role='status'>{t('admin.loading')}</p>}>
        <AdminDashboard />
      </Suspense>
    </>
  )

  return (
    <main className={styles.login}>
      <a href='/' className={styles.brand}>Time2Gather</a>
      <span className={styles.eyebrow}>{t('admin.eyebrow')}</span>
      <h1>{t(restoringSession || status === 'admin.login.checking' ? 'admin.metaTitle' : 'admin.login.title')}</h1>
      {!restoringSession && status !== 'admin.login.checking' && <p>{t('admin.login.description')}</p>}
      <p role='status'>{t(status)}</p>
      <div ref={button} className={styles.googleButton} hidden={status === 'admin.login.notConfigured' || status === 'admin.login.unavailable'} aria-busy={status === 'admin.login.checking'} />
      {error && <p role='alert' className={styles.error}>{t(error)}</p>}
      {error && (
        <button
          type='button'
          onClick={() => {
            setError('')
            setRetry(value => value + 1)
          }}
        >{t('admin.login.retry')}
        </button>
      )}
      <small>{t('admin.login.sessionHelp')}</small>
    </main>
  )
}
