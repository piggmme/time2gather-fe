import { Dialog } from '../Dialog/Dialog'
import { useTranslation } from '../../hooks/useTranslation'
import { navigate } from 'astro:transitions/client'
import styles from './LoginDialog.module.scss'

type LoginDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  meetingCode: string
  selectionType: string
}

export default function LoginDialog({
  isOpen,
  onOpenChange,
  meetingCode,
  selectionType,
}: LoginDialogProps) {
  const { t } = useTranslation()
  const selectPath = `/meetings/${meetingCode}/select/${selectionType.toLowerCase()}`

  const loginOptions = [
    {
      key: 'anonymous',
      label: t('meeting.anonymous.dialog.anonymousLogin'),
      className: styles.anonymousButton,
      onClick: () => navigate(`${selectPath}?anonymous=true`),
    },
    {
      key: 'login',
      label: t('meeting.anonymous.dialog.loginButton'),
      className: styles.loginButton,
      onClick: () => navigate(`/login?redirect=${selectPath}`),
    },
  ]

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Content>
        <Dialog.Title>{t('meeting.anonymous.dialog.title')}</Dialog.Title>
        <Dialog.Description>{t('meeting.anonymous.dialog.description')}</Dialog.Description>
        <div className={styles.buttonGroup}>
          {loginOptions.map((option) => (
            <Dialog.Action
              key={option.key}
              className={option.className}
              onClick={option.onClick}
            >
              {option.label}
            </Dialog.Action>
          ))}
        </div>
      </Dialog.Content>
    </Dialog.Root>
  )
}
