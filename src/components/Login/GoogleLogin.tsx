import Button from '../Button/Button'
import { useTranslation } from '../../hooks/useTranslation'
import GoogleLogo from '../../assets/google-logo.svg'

const GOOGLE_CLIENT_ID = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID || ''
const GOOGLE_REDIRECT_URI = import.meta.env.PUBLIC_GOOGLE_REDIRECT_URI || 'https://time2gather.org/login/oauth2/code/google'

export default function GoogleLogin () {
  const GOOGLE_AUTH_URL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&scope=${encodeURIComponent('openid email profile')}`
  const { t } = useTranslation()

  return (
    <Button buttonType='google' onClick={() => window.location.replace(`${GOOGLE_AUTH_URL}`)}>
      <img src={GoogleLogo.src} alt="Google" width={20} height={20} />
      {t('login.googleLogin')}
    </Button>
  )
}
