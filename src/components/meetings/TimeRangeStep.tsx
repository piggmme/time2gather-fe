import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import "dayjs/locale/en";
import styles from "./CreateMeeting.module.scss";
import Button from "../Button/Button";
import { navigate } from "astro:transitions/client";
import useSelectedDates from "./useSelectedDates";
import { Select } from "../Select/Select";
import Badge from "../Badge/Badge";
import { meetings } from "../../services/meetings";
import { useSearchParam } from "react-use";
import { useTranslation } from "../../hooks/useTranslation";
import { useStore } from "@nanostores/react";
import { $locale } from "../../stores/locale";

const amPmOptions = ['AM', 'PM'] as const;
type AmPm = typeof amPmOptions[number];

// 12시간 형식 시간 슬롯 (00:00 ~ 11:30)
const timeSlots12 = Array.from({ length: 24 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

// 24시간 형식 시간 슬롯 (00:00 ~ 23:30) - 내부 로직용
const timeSlots24 = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

export default function TimeRangeStep() {
  const [selectedDates] = useSelectedDates()
  const [startTime12, setStartTime12] = useState<string>(timeSlots12[10]);
  const [endTime12, setEndTime12] = useState<string>(timeSlots12[10]);
  const [startAmPm, setStartAmPm] = useState<AmPm>('PM');
  const [endAmPm, setEndAmPm] = useState<AmPm>('PM');

  const [isDisabled, setIsDisabled] = useState(true);
  const title = useSearchParam('title');
  const { t } = useTranslation();
  const locale = useStore($locale);

  // Update dayjs locale when locale changes
  useEffect(() => {
    dayjs.locale(locale === 'ko' ? 'ko' : 'en');
  }, [locale]);

  return (
    <>
      <h2 className={styles.title}>{t('createMeeting.timeRangeStep.heading')}</h2>
      <div className={styles.timeRangeContainer}>
        <div className={styles.timeRangeItem}>
          <TimeRangeSelector
            text={t('createMeeting.timeRangeStep.startTime')}
            timeValue={startTime12}
            amPmValue={startAmPm}
            onTimeChange={(value) => {
              setIsDisabled(false);
              setStartTime12(value);
            }}
            onAmPmChange={(value) => {
              setIsDisabled(false);
              setStartAmPm(value);
            }}
            timeOptions={timeSlots12}
            amPmOptions={amPmOptions}
          />
        </div>
        <div className={styles.timeRangeItem}>
          <TimeRangeSelector
            text={t('createMeeting.timeRangeStep.endTime')}
            timeValue={endTime12}
            amPmValue={endAmPm}
            onTimeChange={(value) => {
              setIsDisabled(false);
              setEndTime12(value);
            }}
            onAmPmChange={(value) => {
              setIsDisabled(false);
              setEndAmPm(value);
            }}
            timeOptions={timeSlots12}
            amPmOptions={amPmOptions}
          />
        </div>
      </div>

      <SelectedDates dates={selectedDates} locale={locale} />

      <div className={styles.buttonContainer}>
        <Button
          buttonType="ghost"
          onClick={() => {
            const newUrl = `/meetings/create?step=dates&dates=${selectedDates.map((d) => d.format("YYYY-MM-DD")).join(",")}&title=${title}`
            navigate(newUrl);
          }}
        >
          {t('common.previous')}
        </Button>
        <Button
          disabled={isDisabled}
          buttonType="primary"
          onClick={async () => {
            const response = await meetings.post({
              title: title as string,
              timezone: 'Asia/Seoul',
              availableDates: selectedDates.reduce((acc, d) => {
                const startTime24 = convertTo24Hour(startTime12, startAmPm);
                const endTime24 = convertTo24Hour(endTime12, endAmPm);
                acc[d.format("YYYY-MM-DD")] = [startTime24, endTime24];
                return acc;
              }, {} as { [date: string]: string[] }),
            })
            if (response.success) {
              navigate(`/meetings/${response.data.meetingCode}`);
            } else {
              console.error(response.message);
            }
          }}
        >
          {t('createMeeting.timeRangeStep.createButton')}
        </Button>
      </div>
    </>
  );
}

function SelectedDates ({ dates, locale }: { dates: dayjs.Dayjs[], locale: 'ko' | 'en' }) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const INITIAL_COUNT = 2;
  const visibleDates = isExpanded ? dates : dates.slice(0, INITIAL_COUNT);
  const remainingCount = dates.length - INITIAL_COUNT;

  return (
    <div className={styles.dateBadgesContainer}>
      <p className={styles.dateBadgesTitle}>{t('createMeeting.timeRangeStep.selectedDatesCount', { count: dates.length })}</p>
      <div className={styles.dateBadges}>
        {visibleDates.map((d) => (
          <Badge key={d.format("YYYY-MM-DD")} text={formatDate(d, locale)} type="primary" />
        ))}
        {!isExpanded && remainingCount > 0 && (
          <button
            className={styles.moreButton}
            onClick={() => setIsExpanded(true)}
          >
            +{remainingCount}
          </button>
        )}
      </div>
    </div>
  )
}

type TimeRangeSelectorProps = {
  text: string;
  timeValue: string;
  amPmValue: AmPm;
  timeOptions: string[];
  amPmOptions: readonly AmPm[];
  onTimeChange: (value: string) => void;
  onAmPmChange: (value: AmPm) => void;
}
function TimeRangeSelector({ 
  text, 
  timeValue, 
  amPmValue, 
  timeOptions, 
  amPmOptions,
  onTimeChange,
  onAmPmChange 
}: TimeRangeSelectorProps) {
  return (
    <>
      <div className={styles.timeRangeItemLabel}>
        {text}
      </div>
      <div className={styles.timeRangeSelects}>
        <Select text={text} options={timeOptions} value={timeValue} setValue={onTimeChange} />
        <Select 
          text={text} 
          options={[...amPmOptions]} 
          value={amPmValue} 
          setValue={(value) => onAmPmChange(value as AmPm)} 
        />
      </div>
    </>
  )
}

function isTimeAfter(time1: string, time2: string): boolean {
  const t1 = dayjs(`2000-01-01 ${time1}`, 'YYYY-MM-DD HH:mm');
  const t2 = dayjs(`2000-01-01 ${time2}`, 'YYYY-MM-DD HH:mm');
  return t1.isAfter(t2) || t1.isSame(t2);
}

function formatDate(date: dayjs.Dayjs, locale: 'ko' | 'en'): string {
  const now = dayjs();
  const isSameYear = date.year() === now.year();
  const weekday = date.format("ddd");

  if (locale === 'ko') {
    if (isSameYear) {
      return `${date.format('M월 D일')} (${weekday})`;
    } else {
      return `${date.format('YYYY년 M월 D일')} (${weekday})`;
    }
  } else {
    if (isSameYear) {
      return `${date.format('MMM D')} (${weekday})`;
    } else {
      return `${date.format('MMM D, YYYY')} (${weekday})`;
    }
  }
}

function convertTo24Hour (time12: string, amPm: AmPm): string {
  const [hours, minutes] = time12.split(':').map(Number);
  return `${String(amPm == 'AM' ? hours : hours + 12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function convertTo12Hour(time24: string): { time: string; amPm: AmPm } {
  const [hours, minutes] = time24.split(':').map(Number);
  let hour12 = hours;
  let amPm: AmPm = 'AM';

  if (hours === 0) {
    hour12 = 12;
    amPm = 'AM';
  } else if (hours === 12) {
    hour12 = 12;
    amPm = 'PM';
  } else if (hours > 12) {
    hour12 = hours - 12;
    amPm = 'PM';
  } else {
    hour12 = hours;
    amPm = 'AM';
  }

  return {
    time: `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    amPm
  };
}