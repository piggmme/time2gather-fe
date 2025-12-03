import classnames from 'classnames'
import styles from './Toast.module.scss'
import { useStore } from '@nanostores/react'
import { $toasts } from '../../stores/toast'

export default function Toast () {
  const toasts = useStore($toasts)

  return (
    <div className={styles.container}>
      <ul>
        {toasts.map((item) => {
          const classes = classnames(styles.toast, {
            [styles.caution]: item.type === 'caution',
          })
          return (
            <li key={item.id} className={classes}>
              {item.message}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
