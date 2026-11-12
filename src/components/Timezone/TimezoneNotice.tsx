import { useTranslation } from '../../hooks/useTranslation'
import { useDisplayTimeZone } from '../../hooks/useDisplayTimeZone'
import TimeZoneSelect from './TimeZoneSelect'
import styles from './Timezone.module.scss'
export default function TimezoneNotice ({ zone, dateOnly = false, grid = false }: { zone: string, dateOnly?: boolean, grid?: boolean }) {
  const { t } = useTranslation()
  const [displayZone, setDisplayZone] = useDisplayTimeZone(zone)
  if (dateOnly) return null
  return (
    <aside className={styles.notice}>
      <TimeZoneSelect value={displayZone} onChange={setDisplayZone} label={t('timezone.display')} description={t(grid ? 'timezone.gridHint' : 'timezone.hint')} />
    </aside>
  )
}
