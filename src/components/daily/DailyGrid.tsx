import DailyCell from './DailyCell'
import dayjs from 'dayjs'
import styles from './DailyGrid.module.scss'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'

type CellPosition = {
  dateKey: string
  timeIndex: number
}

type DailyGridProps = {
  timezone: string
  date: dayjs.Dayjs
  dateKey: string
  availableTimes: string[]
  allowedTimes?: string[]
  schedule?: get_meetings_$meetingCode_response['data']['schedule'][string]
  participantsCount: number
  selectedTimeSlots: string[]
  isDragMode: boolean
  dragAction: 'select' | 'deselect'
  draggedCells: CellPosition[]
  mode?: 'edit' | 'view'
  onCellClick?: (date: string, time: string) => void
}

export default function DailyGrid ({
  date,
  timezone,
  dateKey,
  availableTimes,
  allowedTimes,
  schedule,
  participantsCount,
  selectedTimeSlots,
  isDragMode,
  dragAction,
  draggedCells,
  mode = 'edit',
  onCellClick,
}: DailyGridProps) {
  const isEditMode = mode === 'edit'

  // Pointer selection is handled by Daily; native button activation handles keyboards.
  const handleCellClick = (time: string) => {
    if (onCellClick) {
      onCellClick(date.format('YYYY-MM-DD'), time)
    }
  }

  const selectedTimes = new Set(selectedTimeSlots)
  const allowed = allowedTimes ? new Set(allowedTimes) : undefined
  const dragged = new Set(isDragMode ? draggedCells.filter(cell => cell.dateKey === dateKey).map(cell => cell.timeIndex) : [])
  const previewSelected = availableTimes.map((time, index) => (!allowed || allowed.has(time))
    && (dragged.has(index) ? dragAction === 'select' : selectedTimes.has(time)))
  const minutes = availableTimes.map(time => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5)))
  // Local offsets may shift the clock labels. Never bridge an unavailable or missing time slot.
  const interval = Math.min(60, ...minutes.slice(1).map((minute, index) => minute - minutes[index]).filter(gap => gap > 0))
  const joinsPrevious = (index: number) => index > 0 && previewSelected[index - 1]
    && minutes[index] - minutes[index - 1] === interval
  const joinsNext = (index: number) => index + 1 < minutes.length && previewSelected[index + 1]
    && minutes[index + 1] - minutes[index] === interval

  return (
    <div
      className={`${styles.gridWrapper} ${!isEditMode ? styles.viewMode : ''} ${isDragMode ? styles.dragging : ''}`}
    >
      <div className={styles.grid}>
        {availableTimes.map((time, index) => {
          const count = schedule?.[time]?.count || 0
          const isDragHighlighted = dragged.has(index) && (!allowed || allowed.has(time))
          return (
            <DailyCell
              key={time}
              time={time}
              timezone={timezone}
              participants={!isEditMode ? schedule?.[time]?.participants : undefined}
              dateKey={dateKey}
              timeIndex={index}
              isSelected={selectedTimes.has(time)}
              isSelectionStart={previewSelected[index] && !joinsPrevious(index)}
              isSelectionEnd={previewSelected[index] && !joinsNext(index)}
              isDragHighlighted={isDragHighlighted}
              dragMode={isDragHighlighted ? dragAction : undefined}
              count={count}
              maxCount={participantsCount}
              mode={mode}
              interactive={(!allowedTimes || allowedTimes.includes(time)) && (isEditMode || Boolean(onCellClick))}
              onClick={() => handleCellClick(time)}
            />
          )
        })}
      </div>
    </div>
  )
}
