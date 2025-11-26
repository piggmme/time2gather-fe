import type { get_meetings_$meetingCode_response } from "../../services/meetings";
import Monthly from "../Monthly/Monthly";
import dayjs from "dayjs";

export default function MonthlySelection({ data }: { data: get_meetings_$meetingCode_response['data'] }) {
  return (
    <>
      <Monthly
        dates={Object.keys(data.meeting.availableDates).map((date) => dayjs(date))}
        mode="view"
      />
    </>
  );
}