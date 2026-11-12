import { useId } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import type { useMeetingName } from '../../hooks/useMeetingName'
import Input from '../Input/Input'
import Button from '../Button/Button'
import styles from './MeetingNameField.module.scss'

export default function MeetingNameField ({ identity }: { identity: ReturnType<typeof useMeetingName> }) {
  const id = useId()
  const { t } = useTranslation()
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{t('meeting.identity.label')}</label>
      <Input id={id} dir='auto' autoComplete='nickname' maxLength={100} value={identity.name} disabled={!identity.ready} onChange={event => identity.setName(event.target.value)} />
      {identity.failed && <div role='alert'><p>{t('common.error')}</p><Button buttonType='secondary' onClick={identity.retry}>{t('locationVote.retry')}</Button></div>}
    </div>
  )
}
