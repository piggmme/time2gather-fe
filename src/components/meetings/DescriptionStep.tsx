import { useState } from "react";
import styles from "./CreateMeeting.module.scss";
import Button from "../Button/Button";
import { navigate } from "astro:transitions/client";
import { useSearchParam } from "react-use";
import Input from "../Input/Input";

export default function DescriptionStep() {
  const titleParam = useSearchParam('title');
  const descriptionParam = useSearchParam('description');
  const [description, setDescription] = useState(descriptionParam || '');

  return (
    <>
      <h2 className={styles.title}>어떤 약속인가요?</h2>
      <div className={styles.inputContainer}>
        <Input
          placeholder="얘들아 강남에서 모이자!"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className={styles.buttonContainer}>
        <Button
          buttonType="ghost"
          onClick={() => {
            navigate(`/meetings/create?step=title&title=${titleParam}`);
          }}
        >
          이전
        </Button>
        <Button
          disabled={description.length === 0}
          buttonType="primary"
          onClick={ () => {
            navigate(`/meetings/create?step=dates&title=${titleParam}&description=${description}`);
          }}
        >
          다음
        </Button>
      </div>
    </>
  )
}