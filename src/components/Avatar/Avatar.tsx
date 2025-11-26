import { Avatar as AvatarRa } from 'radix-ui';
import styles from './Avatar.module.scss';

export default function Avatar({ src, name }: { src: string, name: string }) {
  return (
    <AvatarRa.Root className={styles.Root}>
      <AvatarRa.Image
        className={styles.Image}
        src={src}
        alt={name}
      />
      <AvatarRa.Fallback className={styles.Fallback} delayMs={600}>
        {name}
      </AvatarRa.Fallback>
    </AvatarRa.Root>
  )
}