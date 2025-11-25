import { useState } from "react";
import dayjs from "dayjs";
import styles from "./CreateMeeting.module.scss";
import Button from "../Button/Button";
import { navigate } from "astro:transitions/client";
import useSelectedDates from "./useSelectedDates";
import { Select } from "../Select/Select";
import Badge from "../Badge/Badge";

export default function PickDates() {
  const [selectedDates] = useSelectedDates()

  return (
    <>
      <h2>시간대를 선택해 주세요.</h2>
      <div>
        <p className={styles.dateBadgesTitle}>선택된 날짜는 총 {selectedDates.length}개에요.</p>
        <div className={styles.dateBadges}>
          {selectedDates.map((d) => (
            <Badge key={d.format("YYYY-MM-DD")} text={d.format("YYYY-MM-DD")} type="default" />
          ))}
        </div>
      </div>
      <div className={styles.timeRangeContainer}>
        <div className={styles.timeRangeItem}>
          <TimeRangeSelector text="시작 시간" />
        </div>
        <div className={styles.timeRangeItem}>
          <TimeRangeSelector text="종료 시간" />
        </div>
      </div>
      <div className={styles.buttonContainer}>
        <Button buttonType="ghost" onClick={() => {
          const newUrl = `/meetings/create?dates=${selectedDates.map((d) => d.format("YYYY-MM-DD")).join(",")}`
          navigate(newUrl);
        }}>이전</Button>
        <Button buttonType="primary" onClick={() => {}}>약속 만들기</Button>
      </div>
    </>
  );
}

const timeSlots = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
});

function TimeRangeSelector({ text }: { text: string }) {
  const [value, setValue] = useState<string>(timeSlots[0]);

  return (
    <>
      <div className={styles.timeRangeItemLabel}>
        {text}
      </div>
      <Select text={text} options={timeSlots} value={value} setValue={setValue} />
    </>
  )
}