import Daily from "../daily/Daily";
import dayjs from "dayjs";
import { useTranslation } from "../../hooks/useTranslation";

export default function SelectPage({ dates, availableTimes }: { dates: string[], availableTimes: string[] }) {
  const { t } = useTranslation();
    return (
    <div>
      <h2>{t('meeting.selectedDates', { count: dates.length })}</h2>
      <Daily
        dates={dates.map((date) => dayjs(date))}
        availableTimes={availableTimes}
      />
    </div>
  )
}