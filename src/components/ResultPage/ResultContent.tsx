import * as React from "react";
import { Tabs } from "radix-ui";
import type { get_meetings_$meetingCode_response, get_meetings_$meetingCode_report_response } from '../../services/meetings';
import Daily from '../daily/Daily';
import Avatar from '../Avatar/Avatar';
import dayjs from 'dayjs';
import styles from './ResultContent.module.scss';
import { formatDate } from '../../utils/time';
import { useStore } from "@nanostores/react";
import { $locale } from "../../stores/locale";
import { HiChevronDown, HiChevronRight } from "react-icons/hi";

export default function ResultContent({
  meetingData,
  reportData,
}: {
  meetingData: get_meetings_$meetingCode_response['data'];
  reportData: get_meetings_$meetingCode_report_response['data'];
}) {
  const locale = useStore($locale);
  const [expandedSlots, setExpandedSlots] = React.useState<Set<string>>(new Set());

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

  // 같은 날짜의 시간 슬롯들을 그룹화하고 범위로 변환
  const groupedBestSlots = React.useMemo(() => {
    if (meetingData.summary.bestSlots.length === 0) return [];

    // 날짜별로 그룹화
    const groupedByDate = meetingData.summary.bestSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = [];
      }
      acc[slot.date].push(slot);
      return acc;
    }, {} as Record<string, typeof meetingData.summary.bestSlots>);

    // 각 날짜별로 시간 범위 생성
    return Object.entries(groupedByDate).map(([date, slots]) => {
      // 시간으로 정렬
      const sortedSlots = [...slots].sort((a, b) => a.time.localeCompare(b.time));

      // 연속된 시간들을 범위로 묶기
      const timeRanges: Array<{ start: string; end: string; count: number; percentage: number }> = [];
      let currentRange: { start: string; end: string; count: number; percentage: number } | null = null;

      sortedSlots.forEach((slot) => {
        if (!currentRange) {
          currentRange = {
            start: slot.time,
            end: slot.time,
            count: slot.count,
            percentage: slot.percentage,
          };
        } else {
          // 현재 시간이 이전 시간의 30분 후인지 확인
          const prevTime = dayjs(`2000-01-01 ${currentRange.end}`, 'YYYY-MM-DD HH:mm');
          const currentTime = dayjs(`2000-01-01 ${slot.time}`, 'YYYY-MM-DD HH:mm');
          const diffMinutes = currentTime.diff(prevTime, 'minute');

          if (diffMinutes === 30 && slot.count === currentRange.count && slot.percentage === currentRange.percentage) {
            // 연속된 시간이고 같은 참여자 수/비율이면 범위 확장
            currentRange.end = slot.time;
          } else {
            // 연속되지 않거나 다른 참여자 수/비율이면 새 범위 시작
            timeRanges.push(currentRange);
            currentRange = {
              start: slot.time,
              end: slot.time,
              count: slot.count,
              percentage: slot.percentage,
            };
          }
        }
      });

      if (currentRange) {
        timeRanges.push(currentRange);
      }

      return {
        date,
        timeRanges,
      };
    });
  }, [meetingData.summary.bestSlots]);

  // 특정 날짜와 시간 범위에 참여한 사람들 가져오기
  const getParticipantsForTimeRange = React.useCallback((date: string, timeRange: { start: string; end: string }) => {
    const participantsMap = new Map<number, typeof meetingData.participants[0]>();
    const scheduleForDate = meetingData.schedule[date];

    if (!scheduleForDate) return [];

    // 시간 범위 내의 모든 시간 슬롯에 참여한 사람들 수집
    const startTime = dayjs(`2000-01-01 ${timeRange.start}`, 'YYYY-MM-DD HH:mm');
    const endTime = dayjs(`2000-01-01 ${timeRange.end}`, 'YYYY-MM-DD HH:mm');

    Object.keys(scheduleForDate).forEach((time) => {
      const currentTime = dayjs(`2000-01-01 ${time}`, 'YYYY-MM-DD HH:mm');
      if ((currentTime.isAfter(startTime) || currentTime.isSame(startTime)) && 
          (currentTime.isBefore(endTime) || currentTime.isSame(endTime))) {
        const slotData = scheduleForDate[time];
        if (slotData && slotData.participants) {
          slotData.participants.forEach((participant) => {
            participantsMap.set(participant.userId, participant);
          });
        }
      }
    });

    return Array.from(participantsMap.values());
  }, [meetingData.schedule, meetingData.participants]);

  // 그룹의 모든 시간 범위에 참여한 사람들 가져오기
  const getParticipantsForGroup = React.useCallback((group: { date: string; timeRanges: Array<{ start: string; end: string }> }) => {
    const participantsMap = new Map<number, typeof meetingData.participants[0]>();

    group.timeRanges.forEach((range) => {
      const participants = getParticipantsForTimeRange(group.date, range);
      participants.forEach((participant) => {
        participantsMap.set(participant.userId, participant);
      });
    });

    return Array.from(participantsMap.values());
  }, [getParticipantsForTimeRange]);

  const toggleSlot = (groupIndex: number) => {
    setExpandedSlots((prev) => {
      const newSet = new Set(prev);
      const key = `group-${groupIndex}`;
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

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
          {groupedBestSlots.length > 0 && (
            <div className={styles.BestSlots}>
            <p className={styles.BestSlotsTitle}>가장 많은 참여자들이 가능한 시간:</p>
            <ul className={styles.BestSlotsList}>
              {groupedBestSlots.map((group, groupIndex) => {
                const isExpanded = expandedSlots.has(`group-${groupIndex}`);
                const participants = getParticipantsForGroup(group);

                return (
                  <li key={groupIndex} className={styles.BestSlotItem}>
                    <div
                      className={styles.BestSlotHeader}
                      onClick={() => toggleSlot(groupIndex)}
                    >
                      <span className={styles.BestSlotDate}>{formatDate(dayjs(group.date), locale)}</span>
                      <span className={styles.BestSlotTime}>
                        {group.timeRanges.map((range, rangeIndex) => (
                          <span key={rangeIndex}>
                            {range.start === range.end
                              ? range.start
                              : `${range.start}~${range.end}`}
                            {rangeIndex < group.timeRanges.length - 1 && ', '}
                          </span>
                        ))}
                      </span>
                      <span className={styles.BestSlotCount}>
                        {group.timeRanges[0].count}명 ({group.timeRanges[0].percentage}%)
                      </span>
                      <span className={styles.BestSlotExpandIcon}>
                        {
                          isExpanded
                          ? <HiChevronDown />
                          : <HiChevronRight />
                        }
                      </span>
                    </div>
                    {isExpanded && participants.length > 0 && (
                      <div className={styles.BestSlotParticipants}>
                        <ul className={styles.BestSlotParticipantsList}>
                          {participants.map((participant) => (
                            <li key={participant.userId} className={styles.BestSlotParticipantItem}>
                              <Avatar
                                src={participant.profileImageUrl}
                                name={participant.username}
                              />
                              <span className={styles.BestSlotParticipantName}>{participant.username}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
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
