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
          <span>Time2Gather</span>{t('home.heroTitleSuffix')}
        </h1>
        <p className={styles.subtitle}>
          {t('home.heroSubtitle')}
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
            {t('home.viewMyMeetings')}
          </Button>
        )}
      </div>
    </div>
  )
}
