import { AlertDialog } from 'radix-ui'
import styles from './Dialog.module.scss'
import type {
  AlertDialogProps, AlertDialogTriggerProps, AlertDialogContentProps, AlertDialogTitleProps, AlertDialogDescriptionProps, AlertDialogCancelProps, AlertDialogActionProps,
} from '@radix-ui/react-alert-dialog'
import classnames from 'classnames'

const DialogRoot = (props: AlertDialogProps) => <AlertDialog.Root {...props} />
const DialogTrigger = (props: AlertDialogTriggerProps) => <AlertDialog.Trigger {...props} className={styles.Trigger} />
const DialogContent = (props: AlertDialogContentProps) => (
  <AlertDialog.Portal>
    <AlertDialog.Overlay className={styles.Overlay} />
    <AlertDialog.Content className={classnames(styles.Content, props.className)}>
      {props.children}
    </AlertDialog.Content>
  </AlertDialog.Portal>
)
const DialogTitle = (props: AlertDialogTitleProps) => <AlertDialog.Title {...props} className={classnames(styles.Title, props.className)} />
const DialogDescription = (props: AlertDialogDescriptionProps) => <AlertDialog.Description {...props} className={classnames(styles.Description, props.className)} />
const DialogCancel = (props: AlertDialogCancelProps) => <AlertDialog.Cancel {...props} className={classnames(styles.Button, styles.Cancel, props.className)} />
const DialogAction = (props: AlertDialogActionProps) => <AlertDialog.Action {...props} className={classnames(styles.Button, styles.Action, props.className)} />

export const Dialog = {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Cancel: DialogCancel,
  Action: DialogAction,
}
