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
import { timeSlots12, amPmOptions, isTime12After, convertTo24Hour, getTimeRangeSlots } from "../../utils/time";
import type { AmPm } from "../../utils/time";
import { showDefaultToast } from "../../stores/toast";

export default function TimeRangeStep() {
  const [selectedDates] = useSelectedDates()
  const [startTime12, setStartTime12] = useState<string>(timeSlots12[20]);
  const [endTime12, setEndTime12] = useState<string>(timeSlots12[10]);
  const [startAmPm, setStartAmPm] = useState<AmPm>('AM');
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
                acc[d.format("YYYY-MM-DD")] = getTimeRangeSlots(startTime24, endTime24);
                return acc;
              }, {} as { [date: string]: string[] }),
            })
            if (response.success) {
              navigate(`/meetings/${response.data.meetingCode}`);
              navigator.clipboard.writeText(window.location.pathname + `/meetings/${response.data.meetingCode}`);
              showDefaultToast({
                message: t('meeting.shareSuccess'),
                duration: 3000,
              });
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
