import { useState } from 'react'
import styles from './CreateMeeting.module.scss'
import Button from '../Button/Button'
import { navigate } from 'astro:transitions/client'
import { useSearchParam } from 'react-use'
import Input from '../Input/Input'
import { useTranslation } from '../../hooks/useTranslation'

export default function DescriptionStep () {
  const titleParam = useSearchParam('title')
  const descriptionParam = useSearchParam('description')
  const [description, setDescription] = useState(descriptionParam || '')
  const { t } = useTranslation()

  return (
    <>
      <h2 className={styles.title}>{t('createMeeting.descriptionStep.heading')}</h2>
      <div className={styles.inputContainer}>
        <Input
          placeholder={t('createMeeting.descriptionStep.placeholder')}
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div className={styles.buttonContainer}>
        <Button
          buttonType='ghost'
          onClick={() => {
            navigate(`/meetings/create?step=title&title=${titleParam}`)
          }}
        >
          {t('common.previous')}
        </Button>
        <Button
          disabled={description.length === 0}
          buttonType='primary'
          onClick={() => {
            navigate(`/meetings/create?step=dates&title=${titleParam}&description=${description}`)
          }}
        >
          {t('common.next')}
        </Button>
      </div>
    </>
  )
}
