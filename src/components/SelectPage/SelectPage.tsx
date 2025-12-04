import Daily from "../daily/Daily";
import dayjs from "dayjs";
import { useTranslation } from "../../hooks/useTranslation";
import styles from './SelectPage.module.scss';
import { useEffect, useRef, useState, useMemo } from "react";
import Button from "../Button/Button";
import { meetings, type get_meetings_$meetingCode_response } from "../../services/meetings";
import { useStore } from "@nanostores/react";
import { $me } from "../../stores/me";

export default function SelectPage(
  { meetingCode, data }:
  { meetingCode: string, data: get_meetings_$meetingCode_response['data'] }
) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string>('100svh');
  const [selections, setSelections] = useState<{ [date: string]: string[] }>({});

  useEffect(() => {
    if (containerRef.current) {
      // containerRef 의 왼쪽 상단 모서리 위치 계산
      const leftTop = containerRef.current.getBoundingClientRect();
      setHeight(`calc(100svh - ${leftTop.top}px - 30px - 60px)`);
    }
  }, []);

  const me = useStore($me);
  const dates = Object.keys(data.meeting.availableDates);
  const dateList = dates.map((date) => dayjs(date)).sort((a, b) => a.diff(b));
  const availableTimes = Object.values(data.meeting.availableDates)[0] || [];

  // schedule에서 자신이 포함된 경우 count를 1 낮춤
  const schedule = useMemo(() => {
    if (!me) return undefined;

    const processedSchedule: typeof data.schedule = {};
    for (const [date, timeSlots] of Object.entries(data.schedule)) {
      processedSchedule[date] = {};
      for (const [time, slot] of Object.entries(timeSlots)) {
        const isMeIncluded = slot.participants.some(p => p.userId === me.userId);
        processedSchedule[date][time] = {
          ...slot,
          count: isMeIncluded ? Math.max(0, slot.count - 1) : slot.count,
        };
      }
    }
    return processedSchedule;
  }, [data.schedule, me]);

  return (
    <>
      <h2>{t('meeting.selectedDates', { count: dates.length })}</h2>
      <div
        className={styles.container}
        ref={containerRef}
      >
        <Daily
          dates={dateList}
          availableTimes={availableTimes}
          height={height}
          selections={selections}
          setSelections={setSelections}
          schedule={schedule}
          participantsCount={data.participants.length}
        />
      </div>
      <Button
        buttonType="primary"
        disabled={Object.entries(selections).every(([_, times]) => times.length === 0)}
        onClick={async () => {
          // selections 에서 빈배열인 날짜는 제거
          const filteredSelections = Object.fromEntries(Object.entries(selections).filter(([_, times]) => times.length > 0));
          const response = await meetings.$meetingCode.selections.put(meetingCode, {
            selections: filteredSelections
          });
        }}
      >
        {t('common.submit')}
      </Button>
    </>
  )
}