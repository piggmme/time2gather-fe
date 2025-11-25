import styles from './Badge.module.scss';
import classnames from 'classnames';

type BadgeType = 'default' | 'primary' | 'ghost';

export default function Badge({ text, type = 'default' }: { text: string, type?: BadgeType }) {
  return <div className={classnames(styles.badge, styles[type])}>{text}</div>;
}