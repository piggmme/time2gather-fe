import { useMemo, useState, useCallback, useEffect } from 'react'
import { meetings, type get_meetings_$meetingCode_response, type get_meetings_$meetingCode_report_response } from '../../services/meetings'
import Daily from '../daily/Daily'
import Avatar from '../Avatar/Avatar'
import dayjs from 'dayjs'
import styles from './ResultContent.module.scss'
import { formatDate } from '../../utils/time'
import { useStore } from '@nanostores/react'
import { $locale } from '../../stores/locale'
import { HiChevronDown, HiChevronRight, HiX, HiOutlineLocationMarker } from 'react-icons/hi'
import { useTranslation } from '../../hooks/useTranslation'
import { $me } from '../../stores/me'
import { Tabs } from '../Tabs/Tabs'
import Monthly from '../Monthly/Monthly'

export default function ResultContent ({
  meetingData,
}: {
  meetingData: get_meetings_$meetingCode_response['data']
  reportData?: get_meetings_$meetingCode_report_response['data'] // Keep for backwards compatibility
}) {
  const { t } = useTranslation()
  const me = useStore($me)
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set())
  const [anonymousMeetingData, setAnonymousMeetingData] = useState<typeof meetingData | null>(null)

  useEffect(() => {
    const isCurrentAnonymous = me?.provider === 'ANONYMOUS' && me.anonymousMeetingCode === meetingData.meeting.code
    if (!isCurrentAnonymous) {
      setAnonymousMeetingData(null)
      return
    }

    let cancelled = false
    meetings.$meetingCode.get(meetingData.meeting.code)
      .then((response) => {
        if (!cancelled) setAnonymousMeetingData(response.data)
      })
      .catch(() => {
        // Keep the server-rendered public response available when a refresh fails.
      })

    return () => {
      cancelled = true
    }
  }, [me, meetingData.meeting.code])

  const displayedMeetingData = anonymousMeetingData ?? meetingData

  // availableDates에서 모든 날짜를 dayjs 객체로 변환
  const dates = useMemo(() => {
    return Object.keys(displayedMeetingData.meeting.availableDates)
      .sort()
      .map(date => dayjs(date))
  }, [displayedMeetingData.meeting.availableDates])

  // availableDates에서 모든 시간 슬롯을 추출하여 정렬
  const availableTimes = useMemo(() => {
    const timeSet = new Set<string>()
    Object.values(displayedMeetingData.meeting.availableDates).forEach((times) => {
      times.forEach(time => timeSet.add(time))
    })
    return Array.from(timeSet).sort()
  }, [displayedMeetingData.meeting.availableDates])

  // 같은 날짜의 시간 슬롯들을 그룹화하고 범위로 변환
  const groupedBestSlots = useMemo(() => {
    if (displayedMeetingData.summary.bestSlots.length === 0) return []

    // 날짜별로 그룹화
    const groupedByDate = displayedMeetingData.summary.bestSlots.reduce((acc, slot) => {
      if (!acc[slot.date]) {
        acc[slot.date] = []
      }
      acc[slot.date].push(slot)
      return acc
    }, {} as Record<string, typeof displayedMeetingData.summary.bestSlots>)

    // 각 날짜별로 시간 범위 생성
    return Object.entries(groupedByDate).map(([date, slots]) => {
      return {
        date,
        timeRanges: [...slots]
          .sort((a, b) => a.startSlotIndex - b.startSlotIndex)
          .map((slot) => {
            const [start, end = start] = slot.time.split(' ~ ')
            return {
              start,
              end,
              count: slot.count,
              percentage: slot.percentage,
              participants: slot.participants,
            }
          }),
      }
    })
  }, [displayedMeetingData.summary.bestSlots])

  // 그룹의 모든 시간 범위에 참여한 사람들 가져오기
  const getParticipantsForGroup = useCallback((group: GroupedBestSlot) => {
    const participantsMap = new Map<number, typeof displayedMeetingData.participants[0]>()

    group.timeRanges.forEach((range) => {
      range.participants.forEach((participant) => {
        participantsMap.set(participant.userId, participant)
      })
    })

    return Array.from(participantsMap.values())
  }, [])

  const toggleSlot = (groupIndex: number) => {
    setExpandedSlots((prev) => {
      const newSet = new Set(prev)
      const key = `group-${groupIndex}`
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  return (
    <Tabs.Root defaultValue='summary'>
      <Tabs.List aria-label={t('meeting.result.tabs.summary')}>
        <Tabs.Trigger value='summary'>
          {t('meeting.result.tabs.summary')}
        </Tabs.Trigger>
        <Tabs.Trigger value='calendar'>
          {t('meeting.result.tabs.calendar')}
        </Tabs.Trigger>
        {displayedMeetingData.locationVote?.enabled && (
          <Tabs.Trigger value='location'>
            {t('meeting.result.tabs.location')}
          </Tabs.Trigger>
        )}
        <Tabs.Trigger value='participants'>
          {t('meeting.result.tabs.participants')} {displayedMeetingData.participants.length > 0 ? `(${displayedMeetingData.participants.length})` : ''}
        </Tabs.Trigger>
      </Tabs.List>

      <SummaryContent
        meetingData={displayedMeetingData}
        groupedBestSlots={groupedBestSlots}
        expandedSlots={expandedSlots}
        toggleSlot={toggleSlot}
        getParticipantsForGroup={getParticipantsForGroup}
      />
      {
        displayedMeetingData.meeting.selectionType === 'TIME'
          ? (
              <DailyCalendarContent
                meetingData={displayedMeetingData}
                dates={dates}
                availableTimes={availableTimes}
              />
            )
          : (
              <MonthlyCalendarContent
                meetingData={displayedMeetingData}
                dates={dates}
              />
            )
      }
      {displayedMeetingData.locationVote?.enabled && (
        <LocationContent locationVote={displayedMeetingData.locationVote} />
      )}
      <ParticipantsContent participants={displayedMeetingData.participants} />
    </Tabs.Root>
  )
}

type GroupedBestSlot = {
  date: string
  timeRanges: Array<{
    start: string
    end: string
    count: number
    percentage: string
    participants: get_meetings_$meetingCode_response['data']['participants']
  }>
}

// 요약 탭 컴포넌트
function SummaryContent ({
  meetingData,
  groupedBestSlots,
  expandedSlots,
  toggleSlot,
  getParticipantsForGroup,
}: {
  meetingData: get_meetings_$meetingCode_response['data']
  groupedBestSlots: GroupedBestSlot[]
  expandedSlots: Set<string>
  toggleSlot: (groupIndex: number) => void
  getParticipantsForGroup: (group: GroupedBestSlot) => typeof meetingData.participants
}) {
  const locale = useStore($locale)
  const { t } = useTranslation()

  const locationVote = meetingData.locationVote
  const sortedLocations = locationVote?.locations
    ? [...locationVote.locations].sort((a, b) => b.voteCount - a.voteCount)
    : []

  const getRankBadgeClass = (index: number) => {
    if (index === 0) return styles.AISummaryRankBadgeFirst
    if (index === 1) return styles.AISummaryRankBadgeSecond
    if (index === 2) return styles.AISummaryRankBadgeThird
    return ''
  }

  return (
    <Tabs.Content value='summary'>
      <div className={styles.AISummaryContainer}>
        {/* 시간 요약 카드 */}
        <div className={`${styles.Summary} ${styles.Card}`} style={{ padding: '24px' }}>
          <div>
            <p className={styles.Title}>{t('meeting.result.summaryTitle')}</p>
            <p className={styles.DetailText}>
              {t('meeting.result.totalParticipants', { count: meetingData.summary.totalParticipants })}
            </p>
          </div>

          {groupedBestSlots.length > 0 && (
            <div className={styles.BestSlots}>
              <p className={styles.BestSlotsTitle}>{t('meeting.result.bestSlotsTitle')}</p>
              <ul className={styles.BestSlotsList}>
                {groupedBestSlots.map((group, groupIndex) => {
                  const isExpanded = expandedSlots.has(`group-${groupIndex}`)
                  const participants = getParticipantsForGroup(group)

                  return (
                    <li key={groupIndex} className={styles.BestSlotItem}>
                      <div
                        className={styles.BestSlotHeader}
                        onClick={() => toggleSlot(groupIndex)}
                      >
                        <span className={styles.BestSlotDate}>{formatDate(group.date, locale)}</span>
                        <span className={styles.BestSlotTime}>
                          {group.timeRanges.map((range, rangeIndex) => (
                            range.start === 'ALL_DAY'
                              ? null
                              : (
                                  <span key={rangeIndex}>
                                    {range.start === range.end
                                      ? range.start
                                      : `${range.start}~${range.end}`}
                                    {rangeIndex < group.timeRanges.length - 1 && ', '}
                                  </span>
                                )
                          ))}
                        </span>
                        <span className={styles.BestSlotCount}>
                          {group.timeRanges[0].count}{t('meeting.result.people')} ({group.timeRanges[0].percentage})
                        </span>
                        <span className={styles.BestSlotExpandIcon}>
                          {isExpanded ? <HiChevronDown /> : <HiChevronRight />}
                        </span>
                      </div>
                      {isExpanded && participants.length > 0 && (
                        <div className={styles.BestSlotParticipants}>
                          <ul className={styles.BestSlotParticipantsList}>
                            {participants.map(participant => (
                              <li key={participant.userId} className={styles.BestSlotParticipantItem}>
                                <Avatar
                                  src={participant.profileImageUrl}
                                  name={participant.username}
                                  size={24}
                                />
                                <span className={styles.BestSlotParticipantName}>{participant.username}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        {/* 장소 투표 카드 (enabled인 경우만) */}
        {locationVote?.enabled && sortedLocations.length > 0 && (
          <div className={styles.AISummaryLocationCard}>
            <div className={styles.AISummaryCardHeader}>
              <span className={`${styles.AISummaryCardIcon} ${styles.CardIconLocation}`}>
                <HiOutlineLocationMarker />
              </span>
              <span className={styles.AISummaryCardTitle}>{t('locationVote.title')}</span>
            </div>
            <div className={styles.AISummaryLocationContent}>
              {locationVote.confirmedLocation && (
                <div className={styles.AISummaryConfirmedBanner}>
                  <span>{t('locationVote.confirmedLocation')}: <strong>{locationVote.confirmedLocation.name}</strong></span>
                </div>
              )}
              <ul className={styles.AISummaryLocationList}>
                {sortedLocations.map((location, index) => {
                  const isConfirmed = locationVote.confirmedLocation?.id === location.id

                  return (
                    <li
                      key={location.id}
                      className={`${styles.AISummaryLocationItem} ${isConfirmed ? styles.AISummaryLocationItemConfirmed : ''}`}
                    >
                      <div className={styles.AISummaryLocationRank}>
                        <span className={`${styles.AISummaryRankBadge} ${getRankBadgeClass(index)}`}>
                          {index + 1}
                        </span>
                        <span className={styles.AISummaryLocationName}>{location.name}</span>
                        {isConfirmed && (
                          <span className={styles.AISummaryConfirmedBadge}>{t('locationVote.confirmed')}</span>
                        )}
                      </div>
                      <div className={styles.AISummaryLocationMeta}>
                        <span className={styles.AISummaryVoteCount}>
                          {location.voteCount}{t('meeting.result.people')} ({location.percentage})
                        </span>
                      </div>
                      {location.voters.length > 0 && (
                        <div className={styles.AISummaryVoters}>
                          {location.voters.map(voter => (
                            <div key={voter.userId} className={styles.AISummaryVoterChip}>
                              <Avatar
                                src={voter.profileImageUrl}
                                name={voter.username}
                                size={20}
                              />
                              <span>{voter.username}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Tabs.Content>
  )
}

// 참여자 모달 컴포넌트
function ParticipantsModal ({
  isOpen,
  onClose,
  date,
  time,
  participants,
}: {
  isOpen: boolean
  onClose: () => void
  date: string
  time?: string
  participants: get_meetings_$meetingCode_response['data']['participants']
}) {
  const locale = useStore($locale)
  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const formattedDate = formatDate(date, locale)

  return (
    <div className={styles.ModalOverlay} onClick={onClose}>
      <div className={styles.ModalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.ModalHeader}>
          <h3 className={styles.ModalTitle}>
            {formattedDate} {time ? time : ''}
          </h3>
          <button className={styles.ModalCloseButton} onClick={onClose} aria-label={t('common.close')}>
            <HiX />
          </button>
        </div>
        <div className={styles.ModalBody}>
          {participants.length > 0
            ? (
                <>
                  <p className={styles.ModalParticipantsCount}>
                    {participants.length}{t('meeting.result.people')}
                  </p>
                  <ul className={styles.ModalParticipantsList}>
                    {participants.map(participant => (
                      <li key={participant.userId} className={styles.ModalParticipantItem}>
                        <Avatar
                          src={participant.profileImageUrl}
                          name={participant.username}
                        />
                        <span className={styles.ModalParticipantName}>{participant.username}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )
            : (
                <p className={styles.ModalEmptyText}>{t('meeting.result.noParticipants')}</p>
              )}
        </div>
      </div>
    </div>
  )
}

// 달력 탭 컴포넌트
function MonthlyCalendarContent ({
  meetingData,
  dates,
}: {
  meetingData: get_meetings_$meetingCode_response['data']
  dates: dayjs.Dayjs[]
}) {
  const me = useStore($me)
  const { t } = useTranslation()
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    date: string
  }>({
    isOpen: false,
    date: '',
  })

  const closeModal = () => {
    setModalState({
      isOpen: false,
      date: '',
    })
  }

  const participants = useMemo(() => {
    if (!modalState.isOpen || !modalState.date) return []
    const scheduleForDate = meetingData.schedule[modalState.date]
    if (!scheduleForDate) return []
    const slotData = scheduleForDate['ALL_DAY']
    return slotData?.participants || []
  }, [modalState, meetingData.schedule])

  const mySelections: dayjs.Dayjs[] = useMemo(function initializeSelections () {
    if (!me) return []
    const mySelectedDates: dayjs.Dayjs[] = []
    for (const [date, timeSlots] of Object.entries(meetingData.schedule)) {
      const allDaySlot = timeSlots['ALL_DAY']
      if (allDaySlot && allDaySlot.participants.some(p => p.userId === me.userId)) {
        mySelectedDates.push(dayjs(date))
      }
    }
    return mySelectedDates
  }, [me, meetingData.schedule])

  // ALL_DAY 타입의 schedule을 dateSchedule 형태로 변환
  // 자신이 포함된 경우 count를 1 낮춤 (Daily와 동일한 로직)
  const dateSchedule = useMemo(() => {
    const schedule: { [date: string]: { count: number, participants: typeof meetingData.participants } } = {}
    for (const [date, timeSlots] of Object.entries(meetingData.schedule)) {
      const allDaySlot = timeSlots['ALL_DAY']
      if (allDaySlot) {
        const isMeIncluded = me ? allDaySlot.participants.some(p => p.userId === me.userId) : false
        schedule[date] = {
          count: isMeIncluded ? Math.max(0, allDaySlot.count - 1) : allDaySlot.count,
          participants: allDaySlot.participants,
        }
      }
    }
    return schedule
  }, [meetingData.schedule, me])

  return (
    <Tabs.Content value='calendar'>
      <div className={styles.Calendar}>
        <p className={styles.Title}>{t('meeting.result.calendarTitle')}</p>
        <p className={styles.DetailText}>
          {t('meeting.result.totalParticipants', { count: meetingData.summary.totalParticipants })}
        </p>
        <Monthly
          mode='view'
          dates={mySelections}
          availableDates={dates}
          dateSchedule={dateSchedule}
          participantsCount={meetingData.summary.totalParticipants}
          onDateClick={(date) => {
            setModalState({
              isOpen: true,
              date: date.format('YYYY-MM-DD'),
            })
          }}
        />
        <ParticipantsModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          date={modalState.date}
          participants={participants}
        />
      </div>
    </Tabs.Content>
  )
}

function DailyCalendarContent ({
  meetingData,
  dates,
  availableTimes,
}: {
  meetingData: get_meetings_$meetingCode_response['data']
  dates: dayjs.Dayjs[]
  availableTimes: string[]
}) {
  const me = useStore($me)
  const { t } = useTranslation()
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    date: string
    time: string
  }>({
    isOpen: false,
    date: '',
    time: '',
  })

  const handleCellClick = (date: string, time: string) => {
    setModalState({
      isOpen: true,
      date,
      time,
    })
  }

  const closeModal = () => {
    setModalState({
      isOpen: false,
      date: '',
      time: '',
    })
  }

  const participants = useMemo(() => {
    if (!modalState.isOpen || !modalState.date || !modalState.time) return []
    const scheduleForDate = meetingData.schedule[modalState.date]
    if (!scheduleForDate) return []
    const slotData = scheduleForDate[modalState.time]
    return slotData?.participants || []
  }, [modalState, meetingData.schedule])

  const mySelections = useMemo(function initializeSelections () {
    if (!me) return ({})

    const initialSelections: { [date: string]: string[] } = {}

    for (const [date, timeSlots] of Object.entries(meetingData.schedule)) {
      const selectedTimes: string[] = []

      for (const [time, slot] of Object.entries(timeSlots)) {
        const isMeIncluded = slot.participants.some(p => p.userId === me.userId)
        if (isMeIncluded) {
          selectedTimes.push(time)
        }
      }

      if (selectedTimes.length > 0) {
        initialSelections[date] = selectedTimes
      }
    }

    return initialSelections
  }, [me, meetingData.schedule])

  // schedule에서 자신이 포함된 경우 count를 1 낮춤
  const schedule = useMemo(() => {
    if (!me) return meetingData.schedule
    const processedSchedule: typeof meetingData.schedule = {}
    for (const [date, timeSlots] of Object.entries(meetingData.schedule)) {
      processedSchedule[date] = {}
      for (const [time, slot] of Object.entries(timeSlots)) {
        const isMeIncluded = slot.participants.some(p => p.userId === me.userId)
        processedSchedule[date][time] = {
          ...slot,
          count: isMeIncluded ? Math.max(0, slot.count - 1) : slot.count,
        }
      }
    }
    return processedSchedule
  }, [meetingData.schedule, me])

  return (
    <Tabs.Content value='calendar'>
      <div className={styles.Calendar}>
        <p className={styles.Title}>{t('meeting.result.calendarTitle')}</p>
        <p className={styles.DetailText}>
          {t('meeting.result.totalParticipants', { count: meetingData.summary.totalParticipants })}
        </p>
        <Daily
          dates={dates}
          availableTimes={availableTimes}
          selections={mySelections}
          schedule={schedule}
          participantsCount={meetingData.summary.totalParticipants}
          mode='view'
          onCellClick={handleCellClick}
        />
        <ParticipantsModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          date={modalState.date}
          time={modalState.time}
          participants={participants}
        />
      </div>
    </Tabs.Content>
  )
}

// 참여자 탭 컴포넌트
function ParticipantsContent ({
  participants,
}: {
  participants: get_meetings_$meetingCode_response['data']['participants']
}) {
  const { t } = useTranslation()

  return (
    <Tabs.Content value='participants'>
      <div className={styles.Card}> {/* Card 클래스 적용 */}
        <div className={styles.Summary}>
          <p className={styles.Title}>{t('meeting.result.tabs.participants')}</p>
          <p className={styles.DetailText}>
            {t('meeting.result.participantsCount', { count: participants.length })}
          </p>
          <ul className={styles.ParticipantsList}>
            {participants.map(participant => (
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
      </div>
    </Tabs.Content>
  )
}

// 장소 투표 탭 컴포넌트
function LocationContent ({
  locationVote,
}: {
  locationVote: NonNullable<get_meetings_$meetingCode_response['data']['locationVote']>
}) {
  const { t } = useTranslation()

  const sortedLocations = [...locationVote.locations].sort((a, b) => b.voteCount - a.voteCount)

  const getRankBadgeClass = (index: number) => {
    if (index === 0) return styles.LocationRankFirst
    if (index === 1) return styles.LocationRankSecond
    if (index === 2) return styles.LocationRankThird
    return ''
  }

  return (
    <Tabs.Content value='location'>
      <div className={styles.Card}> {/* Card 클래스 적용 */}
        <div className={styles.Summary}>
          <p className={styles.Title}>{t('locationVote.title')}</p>

          {locationVote.confirmedLocation && (
            <div className={styles.ConfirmedLocationBanner}>
              {t('locationVote.confirmedLocation')}: <strong>{locationVote.confirmedLocation.name}</strong>
            </div>
          )}

          <ul className={styles.LocationList}>
            {sortedLocations.map((location, index) => {
              const isConfirmed = locationVote.confirmedLocation?.id === location.id

              return (
                <li
                  key={location.id}
                  className={`${styles.LocationItem} ${isConfirmed ? styles.LocationItemConfirmed : ''}`}
                >
                  <div className={styles.LocationHeader}>
                    <div className={styles.LocationInfo}>
                      <span className={`${styles.LocationRank} ${getRankBadgeClass(index)}`}>
                        {index + 1}
                      </span>
                      <span className={styles.LocationName}>
                        {location.name}
                        {isConfirmed && (
                          <span className={styles.ConfirmedBadge}>{t('locationVote.confirmed')}</span>
                        )}
                      </span>
                    </div>
                    <span className={styles.LocationVoteCount}>
                      {location.voteCount}{t('meeting.result.people')} ({location.percentage})
                    </span>
                  </div>

                  {location.voters.length > 0 && (
                    <div className={styles.LocationVoters}>
                      {location.voters.map(voter => (
                        <div key={voter.userId} className={styles.LocationVoterWrapper}>
                          <Avatar
                            src={voter.profileImageUrl}
                            name={voter.username}
                            size={24}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </Tabs.Content>
  )
}
