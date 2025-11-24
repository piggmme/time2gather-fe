import { useState } from "react";
import dayjs from "dayjs";
import Monthly from "../Monthly/Monthly";
import styles from "./CreateMeeting.module.scss";
import { navigate } from 'astro:transitions/client'
import Button from "../Button/Button";

export default function PickDates() {
  const [selectedDates, setSelectedDates] = useState<dayjs.Dayjs[]>([]);

  return (
    <div className={styles.container}>
      <h2>날짜를 선택해 주세요.</h2>
      <Monthly dates={selectedDates} setDates={setSelectedDates} />
      <Button
        buttonType='primary'
        disabled={selectedDates.length === 0}
        onClick={() => {
          if (selectedDates.length === 0) return;

          const dateStrings = selectedDates.map((date) => date.format("YYYY-MM-DD"));
          const newUrl = `/meetings/create?dates=${dateStrings.join(",")}`;
          navigate(newUrl);
        }}
      >
        다음
      </Button>
      {selectedDates.length === 0 && <span className={styles.error}>날짜를 최소 하나 이상 선택해주세요.</span>}
    </div>
  );
}

