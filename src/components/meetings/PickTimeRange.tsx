import { useState, useEffect, useRef } from "react";
import { useSearchParam } from "react-use";
import dayjs from "dayjs";
import styles from "./CreateMeeting.module.scss";
import Button from "../Button/Button";
import { navigate } from "astro:transitions/client";
import useSelectedDates from "./useSelectedDates";

export default function PickDates() {
  const [selectedDates, setSelectedDates] = useSelectedDates()

  return (
    <>
      <h2>시간대를 선택해 주세요.</h2>
      <div>
        <p>선택된 날짜: {selectedDates.map((d) => d.format("YYYY-MM-DD")).join(", ")}</p>
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

