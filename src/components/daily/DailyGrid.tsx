import DailyCell from './DailyCell'
import dayjs from 'dayjs'
import styles from './DailyGrid.module.scss'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'

type CellPosition = {
  dateKey: string
  timeIndex: number
}

type DailyGridProps = {
  date: dayjs.Dayjs
  dateKey: string
  availableTimes: string[]
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
  dateKey,
  availableTimes,
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

  // 마우스 클릭 (데스크톱)
  const handleCellClick = (time: string) => {
    if ('ontouchstart' in window) return
    if (onCellClick) {
      onCellClick(date.format('YYYY-MM-DD'), time)
    }
  }

  // 해당 셀이 드래그 범위에 포함되는지 확인
  const isCellDragged = (timeIndex: number): boolean => {
    return draggedCells.some(cell => cell.dateKey === dateKey && cell.timeIndex === timeIndex)
  }

  return (
    <div 
      className={`${styles.gridWrapper} ${!isEditMode ? styles.viewMode : ''} ${isDragMode ? styles.dragging : ''}`}
    >
      <div className={styles.grid}>
        {availableTimes.map((time, index) => {
          const count = schedule?.[time]?.count || 0
          const isDragHighlighted = isDragMode && isCellDragged(index)
          return (
            <DailyCell
              key={time}
              time={time}
              dateKey={dateKey}
              timeIndex={index}
              isSelected={selectedTimeSlots.includes(time)}
              isDragHighlighted={isDragHighlighted}
              dragMode={isDragHighlighted ? dragAction : undefined}
              count={count}
              maxCount={participantsCount}
              mode={mode}
              onClick={() => handleCellClick(time)}
            />
          )
        })}
      </div>
    </div>
  )
}
