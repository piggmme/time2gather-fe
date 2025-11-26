import Button from '../Button/Button';
import { useTranslation } from '../../hooks/useTranslation';

const REST_API_KEY = import.meta.env.PUBLIC_KAKAO_REST_API_KEY || '4ea5e31b7c9fd5131c30f91acac4abb0'
const KAKAO_REDIRECT_URI = import.meta.env.PUBLIC_KAKAO_REDIRECT_URI || 'https://time2gather.org/login/oauth2/code/kakao'

export default function KakaoLogin () {
  const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${REST_API_KEY}&redirect_uri=${KAKAO_REDIRECT_URI}`
  const { t } = useTranslation();

  return (
    <Button buttonType='kakao' onClick={() => window.location.replace(`${KAKAO_AUTH_URL}`)}>
      {t('login.kakaoLogin')}
    </Button>
  )
}