import styles from './Home.module.scss'
import Button from './Button/Button'
import { useStore } from '@nanostores/react'

import { $me } from '../stores/me'
import { useTranslation } from '../hooks/useTranslation'

export default function Home () {
  const me = useStore($me)
  const isLoggedIn = me !== null
  const { t } = useTranslation()

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.illustration}>
        <img src="/time2gather-icon.svg" alt="Time2Gather" className={styles.icon} />
      </div>
      
      <div className={styles.heroContent}>
        <h1 className={styles.title}>
          <span>Time2Gather</span>에서<br />
          약속을 잡아보세요
        </h1>
        <p className={styles.subtitle}>
          복잡한 일정 조율은 이제 그만.<br />
          친구들과 가장 완벽한 시간을 찾아드려요.
        </p>
      </div>

      <div className={styles.actionGroup}>
        <Button 
          as='a' 
          buttonType='primary' 
          href={isLoggedIn ? '/meetings/create' : '/login'}
          className={styles.mainButton}
        >
          {t('home.createMeetingButton')}
        </Button>
        
        {isLoggedIn && (
          <Button 
            as='a' 
            buttonType='default' 
            href='/my'
          >
            내 약속 확인하기
          </Button>
        )}
      </div>
    </div>
  )
}
