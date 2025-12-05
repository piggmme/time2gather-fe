import type { get_meetings_$meetingCode_response, get_meetings_$meetingCode_report_response } from '../../services/meetings';

export default function ResultContent({
  meetingData,
  reportData,
}: {
  meetingData: get_meetings_$meetingCode_response['data'];
  reportData: get_meetings_$meetingCode_report_response['data'];
}) {
  if (reportData?.summaryText) {
    return (
      <div>
        <p>{reportData.summaryText}</p>
      </div>
    );
  }
  return (
    <div>
      <p>참여자</p>
    </div>
  );
}