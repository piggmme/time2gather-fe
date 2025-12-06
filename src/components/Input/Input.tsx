import classnames from 'classnames'
import styles from './Input.module.scss'

export default function Input ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classnames(styles.input, className)}
    />
  )
}
