import { Avatar as AvatarRa } from 'radix-ui'
import styles from './Avatar.module.scss'

export default function Avatar ({ src, name, size = 36 }: { src: string, name: string, size?: number }) {
  return (
    <AvatarRa.Root className={styles.Root} style={{ width: size, height: size }}>
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
