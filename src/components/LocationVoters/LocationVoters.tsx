import type { LocationInfo } from '../../services/meetings'
import { useTranslation } from '../../hooks/useTranslation'
import Avatar from '../Avatar/Avatar'
import styles from './LocationVoters.module.scss'

export default function LocationVoters ({ voters }: { voters: LocationInfo['voters'] }) {
  const { t } = useTranslation()
  return (
    <div className={styles.container}>
      {voters.length > 0
        ? (
            <>
              <p className={styles.label}>{t('locationVote.voters')}</p>
              <ul className={styles.list} aria-label={t('locationVote.voters')}>
                {voters.map(voter => (
                  <li key={voter.userId}>
                    <Avatar src={voter.profileImageUrl} name={voter.username} size={22} />
                    <bdi>{voter.username}</bdi>
                  </li>
                ))}
              </ul>
            </>
          )
        : <p className={styles.label}>{t('locationVote.noVotes')}</p>}
    </div>
  )
}
