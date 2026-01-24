import { useState, useEffect } from 'react'
import DailyCell from './DailyCell'
import dayjs from 'dayjs'
import styles from './DailyGrid.module.scss'
import type { get_meetings_$meetingCode_response } from '../../services/meetings'

type DailyGridProps = {
  date: dayjs.Dayjs
  availableTimes: string[]
  schedule?: get_meetings_$meetingCode_response['data']['schedule'][string]
  participantsCount: number
  initialSelectedTimeSlots?: string[]
  onSelectionsChange?: (selectedTimeSlots: string[]) => void
  mode?: 'edit' | 'view'
  onCellClick?: (date: string, time: string) => void
}

export default function DailyGrid ({
  date,
  availableTimes,
  schedule,
  participantsCount,
  initialSelectedTimeSlots,
  onSelectionsChange,
  mode = 'edit',
  onCellClick,
}: DailyGridProps) {
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([])

  useEffect(() => {
    if (initialSelectedTimeSlots) {
      setSelectedTimeSlots(initialSelectedTimeSlots)
    }
  }, [initialSelectedTimeSlots])

  useEffect(() => {
    onSelectionsChange?.(selectedTimeSlots)
  }, [selectedTimeSlots])

  // 단일 셀 토글 (탭-투-토글)
  const toggleTimeSlot = (time: string) => {
    if (!availableTimes.includes(time)) return

    setSelectedTimeSlots(prev => {
      if (prev.includes(time)) {
        // 이미 선택됨 → 제거
        return prev.filter(slot => slot !== time)
      } else {
        // 선택 안됨 → 추가
        return [...prev, time]
      }
    })
  }

  const isEditMode = mode === 'edit'

  const handleCellClick = (time: string) => {
    if (isEditMode) {
      toggleTimeSlot(time)
    } else if (onCellClick) {
      onCellClick(date.format('YYYY-MM-DD'), time)
    }
  }

  return (
    <div className={`${styles.gridWrapper} ${!isEditMode ? styles.viewMode : ''}`}>
      <div className={styles.grid}>
        {availableTimes.map((time) => {
          const count = schedule?.[time]?.count || 0
          return (
            <DailyCell
              key={time}
              time={time}
              isSelected={selectedTimeSlots.includes(time)}
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
