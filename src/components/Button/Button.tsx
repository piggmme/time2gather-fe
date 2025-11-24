import styles from './Button.module.scss';

type ButtonType = 'primary' | 'kakao' | 'default'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { buttonType: ButtonType }

export default function Button(
  { className, buttonType = 'default', ...rest }: ButtonProps
) {
  return (
    <button className={`${styles.button} ${styles[buttonType]} ${className}`} {...rest} />
  )
}