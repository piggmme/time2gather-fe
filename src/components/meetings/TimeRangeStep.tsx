import { useState, useEffect } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko";
import "dayjs/locale/en";
import styles from "./CreateMeeting.module.scss";
import Button from "../Button/Button";
import { navigate } from "astro:transitions/client";
import useSelectedDates from "./useSelectedDates";
import { Select } from "../Select/Select";
import { meetings } from "../../services/meetings";
import { useSearchParam } from "react-use";
import { useTranslation } from "../../hooks/useTranslation";
import { useStore } from "@nanostores/react";
import { $locale } from "../../stores/locale";
import SelectedDates from "./SelectedDates";

const amPmOptions = ['AM', 'PM'] as const;
type AmPm = typeof amPmOptions[number];

// 12시간 형식 시간 슬롯 (00:00 ~ 11:30)
const timeSlots12 = Array.from({ length: 24 }, (_, i) => {
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

  const [endTimeSlots12, setEndTimeSlots12] = useState<string[]>(timeSlots12);
  const [endAmPmOptions, setEndAmPmOptions] = useState<readonly AmPm[]>(amPmOptions);

  const [isDisabled, setIsDisabled] = useState(true);
  const title = useSearchParam('title');
  const { t } = useTranslation();
  const locale = useStore($locale);

  // Update dayjs locale when locale changes
  useEffect(() => {
    dayjs.locale(locale === 'ko' ? 'ko' : 'en');
  }, [locale]);

  useEffect(() => {
    if (
      // 시작시간이 종료시간보다 이후인 경우
      isTime12After(
        { time12: startTime12, amPm: startAmPm },
        { time12: endTime12, amPm: endAmPm }
      )
    ) {
      // 종료시간을 시작시간으로 설정
      setEndTime12(startTime12);
      setEndAmPm(startAmPm);
      // 종료시간 옵션을 시작시간이후 시간으로 설정
      setEndTimeSlots12(timeSlots12.slice(timeSlots12.indexOf(startTime12)));
      setEndAmPmOptions(amPmOptions.slice(amPmOptions.indexOf(startAmPm)));
    } else if (startAmPm !== endAmPm) {
      // 시작은 오전이고 종료는 오후일 때
      // 종료시간 옵션을 전체 시간으로 설정
      setEndTimeSlots12(timeSlots12);
      setEndAmPmOptions(amPmOptions);
    } else if (startAmPm == endAmPm) {
      // 시작과 종료 시간이 같은 오전/오후일 때
      // 종료시간 옵션을 시작시간이후 시간으로 설정
      setEndTimeSlots12(timeSlots12.slice(timeSlots12.indexOf(startTime12)));
      setEndAmPmOptions(amPmOptions.slice(amPmOptions.indexOf(startAmPm)));
    }
  }, [startTime12, startAmPm, endAmPm])

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
            timeOptions={endTimeSlots12}
            amPmOptions={endAmPmOptions}
          />
        </div>
      </div>

      <div className={styles.dateBadgesContainer}>
        <p className={styles.dateBadgesTitle}>{t('createMeeting.timeRangeStep.selectedDates')}</p>
        <SelectedDates dates={selectedDates} locale={locale} />
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
          disabled={isDisabled || isTime12After({ time12: startTime12, amPm: startAmPm }, { time12: endTime12, amPm: endAmPm })}
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
  onAmPmChange,
}: TimeRangeSelectorProps) {
  return (
    <>
      <div className={styles.timeRangeItemLabel}>
        {text}
      </div>
      <div className={styles.timeRangeSelects}>
        <Select
          text={text}
          options={[...amPmOptions]}
          value={amPmValue}
          setValue={(value) => onAmPmChange(value as AmPm)}
        />
        <Select
          text={text}
          options={timeOptions}
          value={timeValue}
          setValue={onTimeChange}
        />
      </div>
    </>
  )
}

function isTime24After(time1: string, time2: string): boolean {
  const t1 = dayjs(`2000-01-01 ${time1}`, 'YYYY-MM-DD HH:mm');
  const t2 = dayjs(`2000-01-01 ${time2}`, 'YYYY-MM-DD HH:mm');
  return t1.isAfter(t2) || t1.isSame(t2);
}

function isTime12After(time1: { time12: string, amPm: AmPm }, time2: { time12: string, amPm: AmPm }): boolean {
  const t1 = convertTo24Hour(time1.time12, time1.amPm);
  const t2 = convertTo24Hour(time2.time12, time2.amPm);
  return isTime24After(t1, t2);
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