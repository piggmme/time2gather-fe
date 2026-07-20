import { useAsync, useSearchParam } from 'react-use'
import { auth } from '../../services/auth'
import { navigate } from 'astro:transitions/client'
import { $me } from '../../stores/me'
import { $redirect } from '../../stores/redirect'
import { getAuthRedirectOrDefault, getSafeAuthRedirect } from '../../utils/authRedirect'
import { useTranslation } from '../../hooks/useTranslation'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import Button from '../Button/Button'
import styles from './Oauth.module.scss'

type OauthProvider = 'kakao' | 'google'

const redirectUrls: Record<OauthProvider, string> = {
  kakao: 'https://time2gather.org/login/oauth2/code/kakao',
  google: 'https://time2gather.org/login/oauth2/code/google',
}

export default function Oauth ({ provider }: { provider: OauthProvider }) {
  const code = useSearchParam('code')
  const { t } = useTranslation()

  const { loading, error } = useAsync(async () => {
    if (!code) throw new Error('Missing OAuth authorization code')

    $me.set(undefined)
    await auth.oauth.$provider.post(provider, {
      authorizationCode: code,
      redirectUrl: import.meta.env.DEV
        ? `https://localhost:3000/login/oauth2/code/${provider}`
        : redirectUrls[provider],
    })
    const response = await auth.me.get()
    if (response.data) {
      $me.set(response.data)
    }
    const redirect = getAuthRedirectOrDefault($redirect.get())
    $redirect.set('')
    navigate(redirect)
  }, [code, provider])

  const hasError = Boolean(error) || (!loading && !code)
  const savedRedirect = getSafeAuthRedirect($redirect.get())
  const loginHref = savedRedirect
    ? `/login?redirect=${encodeURIComponent(savedRedirect)}`
    : '/login'

  return (
    <main className={styles.statusPage}>
      <section
        className={styles.statusContent}
        role={hasError ? 'alert' : 'status'}
        aria-live='polite'
        aria-atomic='true'
      >
        {hasError
          ? (
              <span className={styles.errorIcon} aria-hidden='true'>
                <ExclamationTriangleIcon width={24} height={24} />
              </span>
            )
          : <span className={styles.spinner} aria-hidden='true' />}
        <h1 className={styles.title}>
          {t(hasError ? 'login.oauth.errorTitle' : 'login.oauth.loadingTitle')}
        </h1>
        <p className={styles.description}>
          {t(hasError ? 'login.oauth.errorDescription' : 'login.oauth.loadingDescription')}
        </p>
        {hasError && (
          <Button as='a' href={loginHref} buttonType='primary' className={styles.retryButton}>
            {t('login.oauth.retry')}
          </Button>
        )}
      </section>
    </main>
  )
}
