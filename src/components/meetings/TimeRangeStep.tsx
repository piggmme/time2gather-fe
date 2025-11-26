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

// TODO
// 여기서 timeSlots 을 기준으로 시간을 선택하거든? 근데 이건 00:00 ~ 23:30 이라서 가독성이 떨어지는거같아.
// 00:00 ~ 11:30 am/pm 기준으로 나눠서 선택할 수 있으면 좋겠어.
// 근데 am/pm 을 또 select 컴포넌트로 따로 받아야해.
// 즉 형태는 이럴거야

// 시작 시간 [00:00 ~ 11:30 select] [am - pm select]
// 종료 시간 [00:00 ~ 11:30 select] [am - pm select]

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

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
  const [startTime, setStartTime] = useState<string>(timeSlots[0]);
  const [endTime, setEndTime] = useState<string>(timeSlots[1]);
  const [isDisabled, setIsDisabled] = useState(true);
  const title = useSearchParam('title');
  const description = useSearchParam('description');
  const { t } = useTranslation();
  const locale = useStore($locale);
  
  // Update dayjs locale when locale changes
  useEffect(() => {
    dayjs.locale(locale === 'ko' ? 'ko' : 'en');
  }, [locale]);

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
            value={startTime}
            setValue={(value) => {
              setIsDisabled(false);
              setStartTime(value)
              if (isTimeAfter(value, endTime)) {
                const index = timeSlots.findIndex((t) => t === value)
                const nextIndex = index + 2
                console.log({nextIndex})
                if (nextIndex < timeSlots.length) {
                  setEndTime(timeSlots[nextIndex])
                } else {
                  setEndTime(timeSlots[timeSlots.length - 1])
                }
              }
            }}
            options={startTimeSlots}
          />
        </div>
        <div className={styles.timeRangeItem}>
          <TimeRangeSelector
            text={t('createMeeting.timeRangeStep.endTime')}
            value={endTime}
            setValue={setEndTime}
            options={endTimeOptions}
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
            const newUrl = `/meetings/create?step=dates&dates=${selectedDates.map((d) => d.format("YYYY-MM-DD")).join(",")}&title=${title}&description=${description}`
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
              description: description as string,
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
  value: string;
  options: string[];
  setValue: (value: string) => void;
}
function TimeRangeSelector({ text, value, options, setValue }: TimeRangeSelectorProps) {
  return (
    <>
      <div className={styles.timeRangeItemLabel}>
        {text}
      </div>
      <Select text={text} options={options} value={value} setValue={setValue} />
    </>
  )
}