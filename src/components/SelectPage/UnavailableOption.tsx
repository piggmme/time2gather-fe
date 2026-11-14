import { useTranslation } from '../../hooks/useTranslation'
import styles from './SelectPage.module.scss'

export default function UnavailableOption ({ checked, onChange, time }: {
  checked: boolean
  onChange: (checked: boolean) => void
  time: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className={styles.unavailableOption}>
      <label className={styles.unavailableLabel}>
        <input type='checkbox' checked={checked} onChange={event => onChange(event.target.checked)} />
        <span>{t(time ? 'meeting.unavailable.times' : 'meeting.unavailable.dates')}</span>
      </label>
    </div>
  )
}
