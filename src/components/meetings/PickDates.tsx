import { useState, useEffect } from "react";
import dayjs from "dayjs";
import Monthly from "../Monthly/Monthly";
import styles from "./CreateMeeting.module.scss";
import { navigate } from 'astro:transitions/client'

export default function PickDates() {
  const [selectedDates, setSelectedDates] = useState<dayjs.Dayjs[]>([]);

  return (
    <div>
      <h2>날짜를 선택해 주세요.</h2>
      <Monthly dates={selectedDates} setDates={setSelectedDates} />
      <button
        className={styles.nextButton}
        disabled={selectedDates.length === 0}
        onClick={() => {
          if (selectedDates.length === 0) return;

          const dateStrings = selectedDates.map((date) => date.format("YYYY-MM-DD"));
          const newUrl = `/meetings/create?dates=${dateStrings.join(",")}`;
          navigate(newUrl);
        }}
      >
        다음
      </button>
      {selectedDates.length === 0 && <span className={styles.error}>날짜를 최소 하나 이상 선택해주세요.</span>}
    </div>
  );
}

