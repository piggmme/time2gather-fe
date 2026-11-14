import { useEffect, useId, useRef } from 'react'
import { Combobox, DirectionProvider, HeadlessMantineProvider, useCombobox } from '@mantine/core'
import { CheckIcon, ChevronDownIcon } from '@radix-ui/react-icons'
import { localeMeta, type Locale } from '../../i18n/config'
import { formatTime } from '../../utils/time'
import styles from './TimePicker.module.scss'

// Accept a pasted HH:mm value or a short keyboard entry without rounding minutes.
function normalizeTime (input: string): string | undefined {
  const digits = input.normalize('NFKC').replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) % 16))
  const value = digits.trim()
  const match = /^(\d{1,2})(?::(\d{2}))?$/.exec(value)
  const compact = /^\d{3,4}$/.test(value)
  const hours = compact ? Number(value.slice(0, -2)) : Number(match?.[1])
  const minutes = compact ? Number(value.slice(-2)) : Number(match?.[2] ?? 0)
  if ((!match && !compact) || hours > 23 || minutes > 59) return undefined
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export default function TimePicker (props: {
  label: string
  value: string
  onChange: (value: string) => void
  intervalMinutes: number
  locale: Locale
  after?: string
}) {
  return (
    <HeadlessMantineProvider>
      <DirectionProvider initialDirection={localeMeta[props.locale].dir} detectDirection={false}>
        <TimePickerControl {...props} />
      </DirectionProvider>
    </HeadlessMantineProvider>
  )
}

function TimePickerControl ({
  label, value, onChange, intervalMinutes, locale, after,
}: Parameters<typeof TimePicker>[0]) {
  const id = useId()
  const list = useRef<HTMLDivElement>(null)
  const normalized = normalizeTime(value)
  const invalid = !normalized || (Number(normalized.slice(0, 2)) * 60 + Number(normalized.slice(3))) % intervalMinutes !== 0 || (!!after && normalized <= after)
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })
  const options = Array.from({ length: 1440 / intervalMinutes }, (_, index) => {
    const minutes = index * intervalMinutes
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  })

  useEffect(() => {
    if (!combobox.dropdownOpened || !list.current) return
    // Scroll this list only: opening a picker must not move the page behind it.
    const selected = list.current.querySelector<HTMLElement>(`[data-time="${normalized}"]`)
    if (selected) list.current.scrollTop = Math.max(0, selected.offsetTop - list.current.offsetTop - 96)
  }, [combobox.dropdownOpened, intervalMinutes, normalized])

  const commit = () => {
    if (normalized) onChange(normalized)
  }
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>{label}</label>
      <Combobox
        store={combobox}
        unstyled
        width='target'
        position='bottom-start'
        floatingHeight='viewport'
        offset={8}
        zIndex={1000}
        keepMounted
        returnFocus={false}
        middlewares={{ shift: { padding: 16 }, size: { padding: 16 } }}
        onOptionSubmit={(time) => {
          onChange(time)
          combobox.closeDropdown()
        }}
      >
        <Combobox.DropdownTarget>
          <div className={styles.control} data-open={combobox.dropdownOpened || undefined} data-invalid={invalid || undefined}>
            <Combobox.EventsTarget withExpandedAttribute>
              <input
                id={id}
                className={styles.input}
                type='text'
                required
                inputMode='text'
                placeholder='HH:mm'
                dir='ltr'
                aria-label={label}
                aria-invalid={invalid || undefined}
                aria-autocomplete='none'
                spellCheck={false}
                value={value}
                onFocus={event => event.currentTarget.select()}
                onChange={(event) => {
                  onChange(event.currentTarget.value)
                  combobox.resetSelectedOption()
                }}
                onBlur={() => {
                  commit()
                  combobox.closeDropdown()
                }}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) return
                  if (event.key === 'Enter' && combobox.getSelectedOptionIndex() === -1) {
                    event.preventDefault()
                    commit()
                    combobox.closeDropdown()
                  }
                  if (event.key === 'Tab') combobox.closeDropdown()
                }}
              />
            </Combobox.EventsTarget>
            <button
              type='button'
              className={styles.toggle}
              aria-label={label}
              aria-haspopup='listbox'
              aria-expanded={combobox.dropdownOpened}
              aria-controls={combobox.dropdownOpened ? combobox.listId ?? undefined : undefined}
              onClick={() => combobox.toggleDropdown('mouse')}
              onKeyDown={(event) => {
                if (event.key === 'Escape') combobox.closeDropdown('keyboard')
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                  event.preventDefault()
                  combobox.openDropdown('keyboard')
                  combobox.focusTarget()
                }
              }}
            ><ChevronDownIcon aria-hidden='true' />
            </button>
          </div>
        </Combobox.DropdownTarget>
        <Combobox.Dropdown className={styles.dropdown} dir={localeMeta[locale].dir}>
          <Combobox.Options ref={list} className={styles.options} aria-label={label}>
            {options.map(time => (
              <Combobox.Option
                key={time}
                value={time}
                data-time={time}
                active={time === normalized}
                aria-selected={time === normalized}
                disabled={!!after && time <= after}
                className={styles.option}
              >
                <bdi>{formatTime(time, locale, '')}</bdi>
                {time === normalized && <CheckIcon aria-hidden='true' />}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  )
}
