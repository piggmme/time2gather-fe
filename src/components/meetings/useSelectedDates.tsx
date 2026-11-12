import { useMemo, type SetStateAction } from 'react'
import { useSearchParam } from 'react-use'
import dayjs from 'dayjs'
import { usePageState } from '../../hooks/usePageState'

export default function useSelectedDates () {
  const datesParam = useSearchParam('dates')
  const [dateKeys, setDateKeys] = usePageState<string[]>('selectedDates', datesParam?.split(',') ?? [])
  const selectedDates = useMemo(() => dateKeys.map(key => dayjs(key.trim())).filter(date => date.isValid()), [dateKeys])
  const setSelectedDates = (next: SetStateAction<dayjs.Dayjs[]>) => {
    const dates = typeof next === 'function' ? next(selectedDates) : next
    setDateKeys(dates.map(date => date.format('YYYY-MM-DD')))
  }

  return ([selectedDates, setSelectedDates]) as const
}
