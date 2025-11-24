import Monthly from "../Monthly/Monthly";
import styles from "./CreateMeeting.module.scss";
import { navigate } from 'astro:transitions/client'
import Button from "../Button/Button";
import useSelectedDates from "./useSelectedDates";

export default function PickDates() {
  const [selectedDates, setSelectedDates] = useSelectedDates()

  return (
    <>
      <h2>날짜를 선택해 주세요.</h2>
      <Monthly dates={selectedDates} setDates={setSelectedDates} />
      <Button
        buttonType='primary'
        className={styles.button}
        disabled={selectedDates.length === 0}
        onClick={() => {
          if (selectedDates.length === 0) return;

          const dateStrings = selectedDates.map((date) => date.format("YYYY-MM-DD"));
          const newUrl = `/meetings/create?step=timeRange&dates=${dateStrings.join(",")}`;
          navigate(newUrl);
        }}
      >
        다음
      </Button>
    </>
  );
}

