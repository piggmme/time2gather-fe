import { FaCrown } from 'react-icons/fa6'
import badgeStyles from '../Badge/Badge.module.scss'
import styles from './HostBadge.module.scss'

export default function HostBadge ({ label }: { label: string }) {
  return (
    <span className={`${badgeStyles.badge} ${styles.hostBadge}`} data-host-badge>
      <FaCrown aria-hidden='true' focusable='false' />
      <span data-i18n='comments.host'>{label}</span>
    </span>
  )
}
