import { Select as SelectRa } from 'radix-ui'
import type { SelectItemProps } from '@radix-ui/react-select'
import classnames from 'classnames'
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@radix-ui/react-icons'
import styles from './Select.module.scss'

export const Select = ({ text, options, value, setValue }: { text: string, options: string[], value: string, setValue: (value: string) => void }) => (
  <SelectRa.Root value={value} onValueChange={setValue}>
    <SelectRa.Trigger className={styles.Trigger} aria-label='Food'>
      <SelectRa.Value placeholder={text} />
      <SelectRa.Icon className={styles.Icon}>
        <ChevronDownIcon />
      </SelectRa.Icon>
    </SelectRa.Trigger>
    <SelectRa.Portal>
      <SelectRa.Content className={styles.Content}>
        <SelectRa.ScrollUpButton className={styles.ScrollButton}>
          <ChevronUpIcon />
        </SelectRa.ScrollUpButton>
        <SelectRa.Viewport className={styles.Viewport}>
          <SelectRa.Group>
            <SelectRa.Label className={styles.Label}>{text}</SelectRa.Label>
            {options.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectRa.Group>
        </SelectRa.Viewport>
        <SelectRa.ScrollDownButton className={styles.ScrollButton}>
          <ChevronDownIcon />
        </SelectRa.ScrollDownButton>
      </SelectRa.Content>
    </SelectRa.Portal>
  </SelectRa.Root>
)

function SelectItem ({ children, className, ...props }: SelectItemProps) {
  return (
    <SelectRa.Item
      className={classnames(styles.Item, className)}
      {...props}
    >
      <SelectRa.ItemText>{children}</SelectRa.ItemText>
      <SelectRa.ItemIndicator className={styles.ItemIndicator}>
        <CheckIcon />
      </SelectRa.ItemIndicator>
    </SelectRa.Item>
  )
}
