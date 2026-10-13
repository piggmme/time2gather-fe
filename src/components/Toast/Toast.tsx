import classnames from 'classnames'
import styles from './Toast.module.scss'
import { useStore } from '@nanostores/react'
import { $toasts, closeToast } from '../../stores/toast'
import { Cross2Icon, ExclamationTriangleIcon, InfoCircledIcon } from '@radix-ui/react-icons'
import { useTranslation } from '../../hooks/useTranslation'

export default function Toast () {
  const toasts = useStore($toasts)
  const { t } = useTranslation()

  return (
    <div className={styles.container} aria-live='polite' aria-atomic='false'>
      <ul>
        {toasts.map((item) => {
          const classes = classnames(styles.toast, {
            [styles.caution]: item.type === 'caution',
          })
          return (
            <li
              key={item.id}
              className={classes}
              role={item.type === 'caution' ? 'alert' : 'status'}
            >
              <span className={styles.icon} aria-hidden='true'>
                {item.type === 'caution'
                  ? <ExclamationTriangleIcon />
                  : <InfoCircledIcon />}
              </span>
              <span className={styles.message}>{item.message}</span>
              <button
                type='button'
                className={styles.close}
                onClick={() => closeToast(item.id)}
                aria-label={t('common.close')}
              >
                <Cross2Icon />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
