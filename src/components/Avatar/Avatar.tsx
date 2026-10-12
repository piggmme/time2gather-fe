import { Avatar as AvatarRa } from 'radix-ui'
import { PersonIcon } from '@radix-ui/react-icons'
import styles from './Avatar.module.scss'

export default function Avatar ({ src, name, size = 36 }: { src?: string | null, name: string, size?: number }) {
  return (
    <AvatarRa.Root className={styles.Root} style={{ width: size, height: size }}>
      {src && (
        <AvatarRa.Image
          className={styles.Image}
          src={src}
          alt={name}
        />
      )}
      <AvatarRa.Fallback className={styles.Fallback}>
        <PersonIcon aria-hidden='true' />
      </AvatarRa.Fallback>
    </AvatarRa.Root>
  )
}
