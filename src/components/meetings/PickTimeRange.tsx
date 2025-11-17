import { useState, useEffect, useRef } from "react";
import { useSearchParam } from "react-use";
import dayjs from "dayjs";
import styles from "./CreateMeeting.module.scss";

export default function PickDates() {
  const datesParam = useSearchParam("dates");
  const [selectedDates, setSelectedDates] = useState<dayjs.Dayjs[]>([]);

  // URL에서 dates 파라미터 파싱
  useEffect(() => {
    if (datesParam) {
      const dateStrings = datesParam.split(",");
      const parsedDates = dateStrings
        .map((dateStr) => dayjs(dateStr.trim()))
        .filter((date) => date.isValid());
      setSelectedDates(parsedDates);
    } else {
      setSelectedDates([]);
    }
  }, [datesParam]);

  return (
    <div>
      <h2>시간대를 선택해 주세요.</h2>
      <div>
        <p>선택된 날짜: {selectedDates.map((d) => d.format("YYYY-MM-DD")).join(", ")}</p>
      </div>
    </div>
  );
}

