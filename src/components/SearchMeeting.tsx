import { useState } from "react";
import Input from "./Input/Input";
import Button from "./Button/Button";
import { navigate } from "astro:transitions/client";

export default function SearchMeeting() {
  const [value, setvalue] = useState('');

  return (
    <>
      <Input
        placeholder="약속 코드"
        value={value}
        onChange={(e) => setvalue(e.target.value)}
      />
      <Button
        buttonType="primary"
        disabled={!value}
        onClick={() => {
          const meetingCode = value.match(/\/meetings\/([^\/\?#]+)/)?.[1] || value;
          navigate(`/meetings/${meetingCode}`);
        }}
      >
        약속 찾기
      </Button>
    </>
  )
}