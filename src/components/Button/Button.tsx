import { useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const classNames = `${styles.button} ${styles[buttonType]} ${className || ''}`.trim();

  if (as === 'a') {
    return (
      <a className={classNames} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)} />
    );
  }

  const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
  const { onClick, disabled, ...otherButtonProps } = buttonProps;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!onClick || disabled || isLoading) {
      return;
    }

    const result = onClick(e);

    // onClick이 Promise를 반환하는 경우 (void가 아닌 경우만 체크)
    if (result !== undefined && result !== null && typeof result === 'object' && 'then' in result && typeof (result as any).then === 'function') {
      setIsLoading(true);
      try {
        await result;
      } catch (error) {
        // 에러는 상위로 전파
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={classNames}
      onClick={handleClick}
      disabled={isDisabled}
      {...otherButtonProps}
    />
  );
}