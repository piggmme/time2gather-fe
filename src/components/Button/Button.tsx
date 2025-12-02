import styles from './Button.module.scss';

type ButtonType = 'primary' | 'kakao' | 'default' | 'ghost'

type ButtonProps<T extends 'button' | 'a' = 'button'> = {
  as?: T;
  buttonType?: ButtonType;
  className?: string;
} & (T extends 'a' 
  ? React.AnchorHTMLAttributes<HTMLAnchorElement>
  : React.ButtonHTMLAttributes<HTMLButtonElement>);

export default function Button<T extends 'button' | 'a' = 'button'>(
  { className, buttonType = 'default', as = 'button' as T, ...rest }: ButtonProps<T>
) {
  const classNames = `${styles.button} ${styles[buttonType]} ${className || ''}`.trim();

  if (as === 'a') {
    return (
      <a className={classNames} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)} />
    );
  }

  return (
    <button className={classNames} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)} />
  );
}