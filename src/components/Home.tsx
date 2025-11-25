import styles from './Home.module.scss';
import Button from './Button/Button';
import { useStore } from '@nanostores/react';
import { $me } from '../stores/me';

export default function Home() {
  const me = useStore($me);
  const isLoggedIn = me !== null;

  return (
    <div className={styles.container}>
      <Button as="a" buttonType='primary' href={isLoggedIn ? '/meetings/create' : '/login'}>약속 만들러 가기</Button>
    </div>
  )
}