import styles from './Home.module.scss';
import Button from './Button/Button';
import { useStore } from '@nanostores/react';

import { $me } from '../stores/me';
import { useTranslation } from '../hooks/useTranslation';

export default function Home() {
  const me = useStore($me);
  const isLoggedIn = me !== null;
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <Button as="a" buttonType='primary' href={isLoggedIn ? '/meetings/create' : '/login'}>{t('home.createMeetingButton')}</Button>
    </div>
  )
}