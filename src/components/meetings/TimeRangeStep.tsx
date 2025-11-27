import { useMemo, useState, useEffect } from "react";
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

// 12시간 형식 시간 슬롯 (00:00 ~ 11:30)
const twelveHourTimeSlots = Array.from({ length: 24 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

// 24시간 형식 시간 슬롯 (00:00 ~ 23:30) - 내부 로직용
const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

const amPmOptions = ['AM', 'PM'] as const;
type AmPm = typeof amPmOptions[number];

// 12시간 형식 + am/pm을 24시간 형식으로 변환
function convertTo24Hour(time: string, amPm: AmPm): string {
  const [hours, minutes] = time.split(':').map(Number);
  let hour24 = hours;
  
  if (amPm === 'AM') {
    if (hours === 12) {
      hour24 = 0;
    }
  } else { // PM
    if (hours !== 12) {
      hour24 = hours + 12;
    }
  }
  
  return `${String(hour24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// 24시간 형식을 12시간 형식 + am/pm으로 변환
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

const startTimeSlots = timeSlots.slice(0, timeSlots.length - 1);

// 시간 비교: time1이 time2보다 늦거나 동일하면 true
function isTimeAfter(time1: string, time2: string): boolean {
  // dayjs는 날짜와 함께 파싱해야 하므로 임의의 날짜를 사용
  const t1 = dayjs(`2000-01-01 ${time1}`, 'YYYY-MM-DD HH:mm');
  const t2 = dayjs(`2000-01-01 ${time2}`, 'YYYY-MM-DD HH:mm');
  return t1.isAfter(t2) || t1.isSame(t2);
}

// 시작 시간부터 종료 시간까지의 모든 시간 슬롯 배열 생성
function getTimeRangeSlots(startTime: string, endTime: string): string[] {
  const startIndex = timeSlots.findIndex((t) => t === startTime);
  const endIndex = timeSlots.findIndex((t) => t === endTime);

  if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
    return [];
  }
  return timeSlots.slice(startIndex, endIndex + 1);
}

// 날짜를 locale에 맞게 포맷팅
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

export default function TimeRangeStep() {
  const [selectedDates] = useSelectedDates()
  const [isExpanded, setIsExpanded] = useState(false);
  const [startTime, setStartTime] = useState<string>(timeSlots[20]);
  const [endTime, setEndTime] = useState<string>(timeSlots[20]);
  
  // 12시간 형식 상태 (24시간 형식에서 초기화)
  const initialStartTime12 = convertTo12Hour(timeSlots[10]);
  const initialEndTime12 = convertTo12Hour(timeSlots[10]);
  const [startTime12Value, setStartTime12Value] = useState<string>(initialStartTime12.time);
  const [startAmPm, setStartAmPm] = useState<AmPm>(initialStartTime12.amPm);
  const [endTime12Value, setEndTime12Value] = useState<string>(initialEndTime12.time);
  const [endAmPm, setEndAmPm] = useState<AmPm>(initialEndTime12.amPm);

  const [isDisabled, setIsDisabled] = useState(true);
  const title = useSearchParam('title');
  const { t } = useTranslation();
  const locale = useStore($locale);

  // Update dayjs locale when locale changes
  useEffect(() => {
    dayjs.locale(locale === 'ko' ? 'ko' : 'en');
  }, [locale]);

  // 24시간 형식이 외부에서 변경되면 (예: 시작 시간이 종료 시간보다 늦어서 자동 조정) 12시간 형식으로 동기화
  useEffect(() => {
    const converted = convertTo12Hour(startTime);
    // 현재 값과 다를 때만 업데이트 (무한 루프 방지)
    if (converted.time !== startTime12Value || converted.amPm !== startAmPm) {
      setStartTime12Value(converted.time);
      setStartAmPm(converted.amPm);
    }
  }, [startTime]);

  useEffect(() => {
    const converted = convertTo12Hour(endTime);
    // 현재 값과 다를 때만 업데이트 (무한 루프 방지)
    if (converted.time !== endTime12Value || converted.amPm !== endAmPm) {
      setEndTime12Value(converted.time);
      setEndAmPm(converted.amPm);
    }
  }, [endTime]);

  const INITIAL_COUNT = 2;
  const visibleDates = isExpanded ? selectedDates : selectedDates.slice(0, INITIAL_COUNT);
  const remainingCount = selectedDates.length - INITIAL_COUNT;

  const endTimeOptions = useMemo(() => {
    return timeSlots.filter((t) => isTimeAfter(t, startTime));
  }, [startTime]);

  return (
    <>
      <h2 className={styles.title}>{t('createMeeting.timeRangeStep.heading')}</h2>
      <div className={styles.timeRangeContainer}>
        <div className={styles.timeRangeItem}>
          <TimeRangeSelector
            text={t('createMeeting.timeRangeStep.startTime')}
            timeValue={startTime12Value}
            amPmValue={startAmPm}
            onTimeChange={(value) => {
              setIsDisabled(false);
              setStartTime12Value(value);
              const newStartTime24 = convertTo24Hour(value, startAmPm);
              setStartTime(newStartTime24);
              if (isTimeAfter(newStartTime24, endTime)) {
                const index = timeSlots.findIndex((t) => t === newStartTime24);
                const nextIndex = index + 2;
                if (nextIndex < timeSlots.length) {
                  setEndTime(timeSlots[nextIndex]);
                } else {
                  setEndTime(timeSlots[timeSlots.length - 1]);
                }
              }
            }}
            onAmPmChange={(value) => {
              setIsDisabled(false);
              setStartAmPm(value);
              const newStartTime24 = convertTo24Hour(startTime12Value, value);
              setStartTime(newStartTime24);
              if (isTimeAfter(newStartTime24, endTime)) {
                const index = timeSlots.findIndex((t) => t === newStartTime24);
                const nextIndex = index + 2;
                if (nextIndex < timeSlots.length) {
                  setEndTime(timeSlots[nextIndex]);
                } else {
                  setEndTime(timeSlots[timeSlots.length - 1]);
                }
              }
            }}
            timeOptions={twelveHourTimeSlots}
            amPmOptions={amPmOptions}
          />
        </div>
        <div className={styles.timeRangeItem}>
          <TimeRangeSelector
            text={t('createMeeting.timeRangeStep.endTime')}
            timeValue={endTime12Value}
            amPmValue={endAmPm}
            onTimeChange={(value) => {
              setIsDisabled(false);
              const newEndTime24 = convertTo24Hour(value, endAmPm);
              if (isTimeAfter(newEndTime24, startTime)) {
                setEndTime12Value(value);
                setEndTime(newEndTime24);
              }
            }}
            onAmPmChange={(value) => {
              setIsDisabled(false);
              const newEndTime24 = convertTo24Hour(endTime12Value, value);
              if (isTimeAfter(newEndTime24, startTime)) {
                setEndAmPm(value);
                setEndTime(newEndTime24);
              }
            }}
            timeOptions={twelveHourTimeSlots}
            amPmOptions={amPmOptions}
          />
        </div>
      </div>
      <div className={styles.dateBadgesContainer}>
        <p className={styles.dateBadgesTitle}>{t('createMeeting.timeRangeStep.selectedDatesCount', { count: selectedDates.length })}</p>
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
                acc[d.format("YYYY-MM-DD")] = getTimeRangeSlots(startTime, endTime);
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