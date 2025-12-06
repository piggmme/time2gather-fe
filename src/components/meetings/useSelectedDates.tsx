import { useEffect, useState } from 'react'
import { useSearchParam } from 'react-use'
import dayjs from 'dayjs'

export default function useSelectedDates () {
  const [selectedDates, setSelectedDates] = useState<dayjs.Dayjs[]>([])
  const datesParam = useSearchParam('dates')

  useEffect(() => {
    if (datesParam) {
      const dateStrings = datesParam.split(',')
      const parsedDates = dateStrings
        .map(dateStr => dayjs(dateStr.trim()))
        .filter(date => date.isValid())
      setSelectedDates(parsedDates)
    } else {
      setSelectedDates([])
    }
  }, [datesParam])

  return ([selectedDates, setSelectedDates]) as const
}
