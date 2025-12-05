import * as React from "react";
import { Tabs } from "radix-ui";
import type { get_meetings_$meetingCode_response, get_meetings_$meetingCode_report_response } from '../../services/meetings';
import Daily from '../daily/Daily';
import Avatar from '../Avatar/Avatar';
import dayjs from 'dayjs';
import styles from './ResultContent.module.scss';

const TABS = ["요약", "달력", "참여자"] as const;
type Tab = (typeof TABS)[number];

export default function ResultContent({
  meetingData,
  reportData,
}: {
  meetingData: get_meetings_$meetingCode_response['data'];
  reportData: get_meetings_$meetingCode_report_response['data'];
}) {
  // availableDates에서 모든 날짜를 dayjs 객체로 변환
  const dates = React.useMemo(() => {
    return Object.keys(meetingData.meeting.availableDates)
      .sort()
      .map(date => dayjs(date));
  }, [meetingData.meeting.availableDates]);

  // availableDates에서 모든 시간 슬롯을 추출하여 정렬
  const availableTimes = React.useMemo(() => {
    const timeSet = new Set<string>();
    Object.values(meetingData.meeting.availableDates).forEach(times => {
      times.forEach(time => timeSet.add(time));
    });
    return Array.from(timeSet).sort();
  }, [meetingData.meeting.availableDates]);

  return (
    <Tabs.Root className={styles.Root} defaultValue="요약">
      <Tabs.List className={styles.List} aria-label="결과 보기">
        {
          reportData?.summaryText && (
            <Tabs.Trigger className={styles.Trigger} value="AI 요약">
              AI 요악
            </Tabs.Trigger>
          )
        }
        <Tabs.Trigger className={styles.Trigger} value="요약">
          요약
        </Tabs.Trigger>
        <Tabs.Trigger className={styles.Trigger} value="달력">
          달력
        </Tabs.Trigger>
        <Tabs.Trigger className={styles.Trigger} value="참여자">
          참여자 {meetingData.participants.length > 0 ? `(${meetingData.participants.length})` : ''}
        </Tabs.Trigger>
      </Tabs.List>
      {reportData?.summaryText && (
        <Tabs.Content className={styles.Content} value="AI 요약">
          <div className={styles.Summary}>
            <p className={styles.SummaryText}>{reportData?.summaryText}</p>
          </div>
        </Tabs.Content>
      )}
      <Tabs.Content className={styles.Content} value="요약">
        <div className={styles.Summary}>
          <p className={styles.Title}>약속 요약</p>
          <p className={styles.DetailText}>
            총 {meetingData.summary.totalParticipants}명이 참여했어요!
          </p>
          {meetingData.summary.bestSlots.length > 0 && (
            <div className={styles.BestSlots}>
            <p className={styles.BestSlotsTitle}>가장 많은 참여자들이 가능한 시간:</p>
            <ul className={styles.BestSlotsList}>
              {meetingData.summary.bestSlots.map((slot, index) => (
                <li key={index} className={styles.BestSlotItem}>
                  <span className={styles.BestSlotDate}>{slot.date}</span>
                  <span className={styles.BestSlotTime}>{slot.time}</span>
                  <span className={styles.BestSlotCount}>
                    {slot.count}명 ({slot.percentage}%)
                  </span>
                </li>
              ))}
              </ul>
            </div>
          )}
        </div>
      </Tabs.Content>
      <Tabs.Content className={styles.Content} value="달력">
        <div className={styles.Calendar}>
          <p className={styles.Title}>약속 달력</p>
          <p className={styles.DetailText}>
            총 {meetingData.summary.totalParticipants}명이 참여했어요!
          </p>
          <Daily
            dates={dates}
            availableTimes={availableTimes}
            height="600px"
            selections={{}}
            setSelections={() => {}}
            schedule={meetingData.schedule}
            participantsCount={meetingData.summary.totalParticipants}
          />
        </div>
      </Tabs.Content>
      <Tabs.Content className={styles.Content} value="참여자">
        <div className={styles.Participants}>
          <p className={styles.ParticipantsCount}>
            총 {meetingData.participants.length}명
          </p>
          <ul className={styles.ParticipantsList}>
            {meetingData.participants.map((participant) => (
              <li key={participant.userId} className={styles.ParticipantItem}>
                <Avatar
                  src={participant.profileImageUrl}
                  name={participant.username}
                />
                <span className={styles.ParticipantName}>{participant.username}</span>
              </li>
            ))}
          </ul>
        </div>
      </Tabs.Content>
    </Tabs.Root>
  );
}
