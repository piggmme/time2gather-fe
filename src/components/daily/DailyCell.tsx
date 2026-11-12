import { useTranslation } from '../../hooks/useTranslation'
import { intlLocale } from '../../i18n/config'
import { useMemo } from 'react'
import type { MouseEvent } from 'react'
import { HiCheck } from 'react-icons/hi'
import styles from './DailyCell.module.scss'
import classNames from 'classnames'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'
import DailyParticipantsTooltip from './DailyParticipantsTooltip'

type DailyCellProps = {
  time: string
  localLabel?: string
  timezone?: string
  participants?: get_meetings_$meetingCode_response['data']['participants']
  dateKey: string
  timeIndex: number
  isSelected: boolean
  isSelectionStart?: boolean
  isSelectionEnd?: boolean
  isDragHighlighted?: boolean
  dragMode?: 'select' | 'deselect'
  count?: number
  maxCount?: number
  mode?: 'edit' | 'view'
  interactive?: boolean
  onClick: () => void
}

export default function DailyCell ({
  time,
  localLabel,
  timezone = 'UTC',
  participants,
  dateKey,
  timeIndex,
  isSelected,
  isSelectionStart = true,
  isSelectionEnd = true,
  isDragHighlighted = false,
  dragMode,
  count = 0,
  maxCount = 0,
  mode = 'edit',
  interactive = true,
  onClick,
}: DailyCellProps) {
  const { locale } = useTranslation()
  const numbers = useMemo(() => new Intl.NumberFormat(intlLocale(locale)), [locale])
  const isEditMode = mode === 'edit'
  const previewSelected = isDragHighlighted ? dragMode === 'select' : isSelected

  // 정각인지 30분인지 판단
  const isFullHour = time.endsWith(':00')

  // Keep saved attendance stable while selecting or dragging my availability.
  const totalCount = count
  const voteRatio = maxCount > 0 ? Math.min(totalCount / maxCount, 1) : 0
  const heatLevel = voteRatio >= 0.8 ? 4 : voteRatio >= 0.55 ? 3 : voteRatio >= 0.3 ? 2 : 1
  const text = totalCount > 0 ? `${numbers.format(totalCount)}/${numbers.format(maxCount)}` : ''

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    // Daily commits mouse/touch gestures once. Preserve Enter/Space and assistive activation.
    if (event.detail !== 0 && (isEditMode || 'ontouchstart' in window)) return
    onClick()
  }

  const cell = (
    <button
      type='button'
      data-date-key={dateKey}
      data-time-index={timeIndex}
      onClick={handleClick}
      disabled={!interactive}
      aria-label={`${dateKey} ${time}${localLabel ? ` · ${localLabel}` : ''}${text ? ` ${text}` : ''}`}
      aria-pressed={isEditMode ? isSelected : undefined}
      data-heat-level={totalCount > 0 && maxCount > 0 ? heatLevel : undefined}
      className={classNames(
        styles.cell,
        {
          [styles.selected]: previewSelected,
          [styles.selectionStart]: previewSelected && isSelectionStart,
          [styles.selectionEnd]: previewSelected && isSelectionEnd,
          [styles.fullHour]: isFullHour,
          [styles.halfHour]: !isFullHour,
          [styles.hasCount]: totalCount > 0,
          [styles.viewMode]: !isEditMode,
          [styles.interactive]: interactive,
          [styles.dragHighlighted]: isDragHighlighted,
          [styles.dragDeselect]: isDragHighlighted && dragMode === 'deselect',
        },
      )}
    >
      <span className={styles.cellText}><bdi>{text}</bdi>{localLabel && <small className={styles.localTime}>{localLabel}</small>}</span>
      {previewSelected && isSelectionStart && <HiCheck className={styles.selectionCheck} aria-hidden='true' />}
    </button>
  )
  if (!isEditMode && participants !== undefined) {
    return (
      <DailyParticipantsTooltip date={dateKey} time={time} timezone={timezone} participants={participants}>
        {cell}
      </DailyParticipantsTooltip>
    )
  }
  return cell
}
