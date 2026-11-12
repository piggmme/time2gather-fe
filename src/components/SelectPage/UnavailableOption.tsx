import { useId } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import styles from './SelectPage.module.scss'

export default function UnavailableOption ({ checked, onChange, time }: {
  checked: boolean
  onChange: (checked: boolean) => void
  time: boolean
}) {
  const { t } = useTranslation()
  const helpId = useId()
  return (
    <div className={styles.unavailableOption}>
      <label className={styles.unavailableLabel}>
        <input type='checkbox' checked={checked} onChange={event => onChange(event.target.checked)} aria-describedby={helpId} />
        <span>{t(time ? 'meeting.unavailable.times' : 'meeting.unavailable.dates')}</span>
      </label>
      <p className={styles.unavailableHint} id={helpId} aria-live='polite'>{t(checked ? 'meeting.unavailable.selectedHint' : 'meeting.unavailable.hint')}</p>
    </div>
  )
}
