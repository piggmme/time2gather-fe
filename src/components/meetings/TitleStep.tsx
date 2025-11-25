import { useState } from "react";
import styles from "./CreateMeeting.module.scss";
import Button from "../Button/Button";
import { navigate } from "astro:transitions/client";
import { useSearchParam } from "react-use";
import Input from "../Input/Input";

export default function TitleStep() {
  const titleParam = useSearchParam('title');
  const [title, setTitle] = useState(titleParam || '');

  return (
    <>
      <h2 className={styles.title}>제목을 입력해 주세요.</h2>
      <div className={styles.inputContainer}>
        <Input
          placeholder="우리의 연말 약속! 🍔🍗🍣🍴"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className={styles.buttonContainer}>
        <Button
          buttonType="ghost"
          onClick={() => {
            window.history.back();
          }}
        >
          이전
        </Button>
        <Button
          disabled={title.length === 0}
          buttonType="primary"
          onClick={ () => {
            navigate(`/meetings/create?step=description&title=${title}`);
          }}
        >
          다음
        </Button>
      </div>
    </>
  )
}