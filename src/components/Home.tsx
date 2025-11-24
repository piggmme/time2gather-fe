import styles from './Home.module.scss';

export default function Home() {
  const isLoggedIn = false;
  return (
    <div className={styles.container}>
      <a className={styles.button} href={isLoggedIn ? '/meetings/create' : '/login'}>약속 만들러 가기</a>
    </div>
  )
}