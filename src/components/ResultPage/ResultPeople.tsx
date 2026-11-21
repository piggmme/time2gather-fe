import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import Avatar from '../Avatar/Avatar'
import styles from './ResultPeople.module.scss'

type Participants = get_meetings_$meetingCode_response['data']['participants']

export default function ResultPeople ({ people, label, inDetails = false }: {
  people: Participants
  label?: string
  inDetails?: boolean
}) {
  return (
    <ul className={inDetails ? `${styles.List} ${styles.Detail}` : styles.List} aria-label={label}>
      {people.map(person => (
        <li key={person.userId}>
          <Avatar src={person.profileImageUrl} name={person.username} size={32} />
          <bdi>{person.username}</bdi>
        </li>
      ))}
    </ul>
  )
}
