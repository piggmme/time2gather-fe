import styles from './Home.module.scss';
import Button from './Button/Button';

export default function Home() {
  const isLoggedIn = false;
  return (
    <div className={styles.container}>
      <Button as="a" buttonType='primary' href={isLoggedIn ? '/meetings/create' : '/login'}>약속 만들러 가기</Button>
    </div>
  )
}