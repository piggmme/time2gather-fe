import classnames from 'classnames'
import styles from './Input.module.scss'
import { dismissTouchKeyboard } from '../../utils/keyboard'

export default function Input ({ className, onKeyDown, enterKeyHint = 'done', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      enterKeyHint={enterKeyHint}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.key !== 'Enter' || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
        const input = event.currentTarget
        if (!input.validity.valid || input.getAttribute('aria-invalid') === 'true') return
        dismissTouchKeyboard(input)
      }}
      className={classnames(styles.input, className)}
    />
  )
}
