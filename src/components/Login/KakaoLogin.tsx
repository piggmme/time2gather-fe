import styles from './KakaoLogin.module.scss'

export default function KakaoLogin () {
  const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?response_type=code&client_id=${
    import.meta.env.PUBLIC_KAKAO_REST_API_KEY
  }&redirect_uri=${import.meta.env.PUBLIC_KAKAO_REDIRECT}`

  return (
    <button className={styles.button} onClick={() => window.location.replace(`${KAKAO_AUTH_URL}`)}>
      카카오로 계속하기
    </button>
  )
}