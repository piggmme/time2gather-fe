import { useState } from 'react'
import styles from './CreateMeeting.module.scss'
import Button from '../Button/Button'
import { navigate } from 'astro:transitions/client'
import { useSearchParam } from 'react-use'
import Input from '../Input/Input'
import { useTranslation } from '../../hooks/useTranslation'

export default function TitleStep () {
  const titleParam = useSearchParam('title')
  const meetingTypeParam = useSearchParam('meetingType')
  const [title, setTitle] = useState(titleParam || '')
  const { t } = useTranslation()

  return (
    <>
      <h2 className={styles.title}>{t('createMeeting.titleStep.heading')}</h2>
      <div className={styles.inputContainer}>
        <Input
          placeholder={t('createMeeting.titleStep.placeholder')}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>
      <div className={styles.buttonContainer}>
        <Button
          buttonType='ghost'
          onClick={() => {
            const newUrl = `/meetings/create?step=meetingType&meetingType=${meetingTypeParam}`
            navigate(newUrl)
          }}
        >
          {t('common.previous')}
        </Button>
        <Button
          disabled={title.length === 0}
          buttonType='primary'
          onClick={() => {
            navigate(`/meetings/create?step=dates&meetingType=${meetingTypeParam}&title=${title}`)
          }}
        >
          {t('common.next')}
        </Button>
      </div>
    </>
  )
}
