import {
  useEffect, useId, useMemo, useRef, useState,
} from 'react'
import { Dialog, Popover } from 'radix-ui'
import { CheckIcon, ChevronDownIcon, ClockIcon, Cross2Icon } from '@radix-ui/react-icons'
import { useTranslation } from '../../hooks/useTranslation'
import { localeMeta } from '../../i18n/config'
import { getDeviceTimeZone } from '../../utils/timezone'
import { getTimeZoneOptions, searchTimeZones } from '../../utils/timezoneSearch'
import styles from './Timezone.module.scss'

export default function TimeZoneSelect ({
  value, onChange, label, description, valueSuffix, field = false,
}: {
  value: string
  onChange: (zone: string) => void
  label?: string
  description?: string
  field?: boolean
  valueSuffix?: string
}) {
  const { t, locale } = useTranslation()
  const id = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const options = useMemo(() => getTimeZoneOptions(value, locale), [value, locale])
  const results = useMemo(() => searchTimeZones(options, query, value), [options, query, value])
  const selectedOption = options.find(option => option.zone === value)
  const title = label ?? t('timezone.title')
  const city = (value.startsWith('Etc/') ? value : value.split('/').at(-1) ?? value).replaceAll('_', ' ')

  useEffect(() => {
    const media = window.matchMedia('(max-width: 699px)')
    const update = () => setMobile(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const container = list.current
    const option = container?.children[activeIndex]
    if (!container || !option) return
    // Only move the options list, never the calendar/page behind the picker.
    const bounds = container.getBoundingClientRect()
    const item = option.getBoundingClientRect()
    if (item.top < bounds.top) container.scrollTop += item.top - bounds.top
    else if (item.bottom > bounds.bottom) container.scrollTop += item.bottom - bounds.bottom
  }, [activeIndex])

  const onOpenChange = (next: boolean) => {
    if (next) {
      setQuery('')
      setActiveIndex(-1)
    }
    setOpen(next)
  }
  const selectZone = (zone: string) => {
    onChange(zone)
    setOpen(false)
  }
  const onOpenAutoFocus = (event: Event) => {
    event.preventDefault()
    // Mobile opens with its keyboard closed until the user chooses to search.
    if (mobile) heading.current?.focus({ preventScroll: true })
    else input.current?.focus({ preventScroll: true })
  }
  const onCloseAutoFocus = (event: Event) => {
    event.preventDefault()
    trigger.current?.focus({ preventScroll: true })
  }
  const triggerButton = (
    <button
      ref={trigger}
      type='button'
      className={`${styles.trigger} ${field ? styles.fieldTrigger : ''}`}
      aria-label={`${title}: ${value.replaceAll('_', ' ')}${valueSuffix ? ` · ${valueSuffix}` : ''}`}
      title={`${value.replaceAll('_', ' ')} · ${selectedOption?.description ?? ''}`}
    >
      {!field && <ClockIcon aria-hidden='true' />}
      {!field && <span className={styles.triggerLabel}>{title}</span>}
      <bdi className={styles.triggerValue}>{city}</bdi>
      {valueSuffix && <bdi className={styles.triggerOffset}>{valueSuffix}</bdi>}
      <ChevronDownIcon className={styles.chevron} aria-hidden='true' />
    </button>
  )
  const titleElement = <h2 id={`${id}-title`} ref={heading} tabIndex={-1} className={styles.pickerTitle}>{title}</h2>
  const contents = (
    <>
      <div className={styles.pickerHeader}>
        {mobile ? <Dialog.Title ref={heading} tabIndex={-1} className={styles.pickerTitle}>{title}</Dialog.Title> : titleElement}
        <button className={styles.closeButton} type='button' onClick={() => setOpen(false)} aria-label={t('common.close')}><Cross2Icon aria-hidden='true' /></button>
      </div>
      <p className={styles.selectedZone}><bdi>{value.replaceAll('_', ' ')}</bdi><span>{selectedOption?.description}</span></p>
      <input
        ref={input}
        id={id}
        type='text'
        role='combobox'
        autoComplete='off'
        spellCheck={false}
        aria-label={t('timezone.search')}
        aria-autocomplete='list'
        aria-expanded={open}
        aria-controls={`${id}-results`}
        aria-activedescendant={activeIndex >= 0 && results[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
        aria-describedby={description ? `${id}-hint` : undefined}
        placeholder={t('timezone.search')}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActiveIndex(-1)
          if (list.current) list.current.scrollTop = 0
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            if (!results.length) return
            setActiveIndex(index => event.key === 'ArrowDown'
              ? (index + 1) % results.length
              : (index <= 0 ? results.length : index) - 1)
          } else if (event.key === 'Enter') {
            event.preventDefault()
            const option = results[activeIndex] ?? (results.length === 1 ? results[0] : undefined)
            if (option) selectZone(option.zone)
          }
        }}
      />
      <ul ref={list} id={`${id}-results`} className={styles.results} role='listbox' aria-label={title}>
        {results.map((option, index) => (
          <li
            key={option.zone}
            id={`${id}-option-${index}`}
            role='option'
            aria-selected={option.zone === value}
            className={index === activeIndex ? styles.active : undefined}
            onMouseDown={event => event.preventDefault()}
            onClick={() => selectZone(option.zone)}
          >
            <span><bdi>{option.label}</bdi><small>{option.description}</small></span>
            {option.zone === value && <CheckIcon aria-hidden='true' />}
          </li>
        ))}
      </ul>
      {!results.length && <p role='status'>{t('timezone.noResults')}</p>}
      <button className={styles.deviceButton} type='button' onClick={() => selectZone(getDeviceTimeZone())}>{t('timezone.useDevice')}</button>
      {description && <p id={`${id}-hint`}>{description}</p>}
    </>
  )

  return (
    <div className={`${styles.selector} ${field ? styles.fieldSelector : ''}`}>
      {mobile
        ? (
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
              <Dialog.Trigger asChild>{triggerButton}</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className={styles.overlay} />
                <Dialog.Content
                  className={`${styles.controls} ${styles.sheet}`}
                  dir={localeMeta[locale].dir}
                  aria-describedby={description ? `${id}-hint` : undefined}
                  onOpenAutoFocus={onOpenAutoFocus}
                  onCloseAutoFocus={onCloseAutoFocus}
                >
                  {contents}
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          )
        : (
            <Popover.Root open={open} onOpenChange={onOpenChange} modal>
              <Popover.Trigger asChild>{triggerButton}</Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className={`${styles.controls} ${styles.popover}`}
                  dir={localeMeta[locale].dir}
                  side='bottom'
                  align={localeMeta[locale].dir === 'rtl' ? 'end' : 'start'}
                  sideOffset={8}
                  collisionPadding={16}
                  aria-labelledby={`${id}-title`}
                  aria-describedby={description ? `${id}-hint` : undefined}
                  onOpenAutoFocus={onOpenAutoFocus}
                  onCloseAutoFocus={onCloseAutoFocus}
                >
                  {contents}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}
    </div>
  )
}
