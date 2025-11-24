import KakaoLogin from "./KakaoLogin";
import styles from './Login.module.scss';

export default function Login() {
  return (
    <>
      <h1 className={styles.title}>
        약속 잡으러 갈까요?
      </h1>
      <KakaoLogin />
    </>
  )
}