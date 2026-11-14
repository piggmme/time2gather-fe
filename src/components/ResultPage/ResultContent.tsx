import DecisionSummary from './DecisionSummary'
import ConfirmedPlan from './ConfirmedPlan'
import CalendarParticipantFilter from './CalendarParticipantFilter'
import { getCalendarAvailability } from '../../utils/calendarAvailability'
import { Dialog as ParticipantDialog } from 'radix-ui'
import { useDialogReturnFocus } from '../../hooks/useDialogReturnFocus'
import {
  useMemo, useState, useEffect, type ReactNode,
} from 'react'
import { type get_meetings_$meetingCode_response } from '../../services/meetings'
import Daily from '../daily/Daily'
import Avatar from '../Avatar/Avatar'
import LocationVoters from '../LocationVoters/LocationVoters'
import dayjs from 'dayjs'
import styles from './ResultContent.module.scss'
import { formatDate, formatTime } from '../../utils/time'
import { useDisplayTimeZone } from '../../hooks/useDisplayTimeZone'
import { projectResultTimeZone } from '../../utils/resultTimeZone'
import { inspectWallTime } from '../../utils/timezone'
import TimeZoneSelect from '../Timezone/TimeZoneSelect'
import { useStore } from '@nanostores/react'
import { $locale } from '../../stores/locale'
import {
  HiX, HiOutlineLocationMarker, HiOutlinePencil,
} from 'react-icons/hi'
import { localeMeta } from '../../i18n/config'
import { useTranslation } from '../../hooks/useTranslation'
import { $me } from '../../stores/me'
import { Tabs } from '../Tabs/Tabs'
import { usePageState, usePageScrollRestoration } from '../../hooks/usePageState'
import Monthly from '../Monthly/Monthly'
import { hasUserScheduleSelection, getConfirmedAvailabilityTime } from '../../utils/meetingSelection'

export default function ResultContent ({
  meetingData,
  onMeetingUpdated,
  actions,
  comments,
  commentShortcut,
  onTabChange,
}: {
  meetingData: get_meetings_$meetingCode_response['data']
  onMeetingUpdated?: () => void
  actions?: ReactNode
  comments?: ReactNode
  commentShortcut?: ReactNode
  onTabChange?: (tab: string) => void
}) {
  const { t, locale } = useTranslation()
  const [activeTab, setActiveTab] = usePageState('resultTab', 'summary')
  usePageScrollRestoration()
  useEffect(() => {
    onTabChange?.(activeTab)
  }, [activeTab, onTabChange])
  const me = useStore($me)
  const myResponse = meetingData.participants.find(person => person.userId === me?.userId)?.availabilityResponse
  const [displayZone, setDisplayZone] = useDisplayTimeZone(meetingData.meeting.timezone)
  const projection = useMemo(() => meetingData.meeting.selectionType === 'TIME'
    ? projectResultTimeZone(meetingData, displayZone)
    : undefined, [meetingData, displayZone])
  const resultZone = projection || meetingData.meeting.selectionType === 'ALL_DAY' ? displayZone : meetingData.meeting.timezone
  const zoneOffsets = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en', { timeZone: resultZone, timeZoneName: 'shortOffset' })
    return [...new Set(Object.entries(meetingData.meeting.availableDates).flatMap(([date, times]) => times.flatMap((time) => {
      const { instant } = inspectWallTime(date, time, meetingData.meeting.timezone)
      return instant === undefined ? [] : [formatter.formatToParts(instant).find(part => part.type === 'timeZoneName')?.value.replace('GMT', 'UTC') ?? '']
    })))].filter(Boolean).join(' / ')
  }, [meetingData.meeting.availableDates, meetingData.meeting.timezone, resultZone])
  const displayedMeetingData = useMemo(() => projection
    ? {
        ...meetingData,
        meeting: { ...meetingData.meeting, timezone: resultZone, availableDates: projection.availableDates },
        schedule: projection.schedule,
        summary: { ...meetingData.summary, bestSlots: projection.bestSlots },
      }
    : meetingData, [meetingData, projection, resultZone])
  const isConfirmed = !!displayedMeetingData.meeting.confirmedDate

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

  return (
    <Tabs.Root
      value={activeTab}
      onValueChange={(tab) => {
        setActiveTab(tab)
        onTabChange?.(tab)
      }}
      dir={localeMeta[locale].dir}
    >
      <div className={styles.ResultLayout} data-calendar-view={activeTab === 'calendar' && meetingData.meeting.selectionType === 'TIME'} data-has-actions={Boolean(actions)} data-confirmed={isConfirmed}>
        <div className={styles.ResultHeader}>
          {meetingData.meeting.selectionType === 'TIME' && (
            <div className={styles.ResultTimezone}>
              <TimeZoneSelect value={resultZone} onChange={setDisplayZone} label={t('timezone.display')} valueSuffix={zoneOffsets} />
              {!projection && displayZone !== resultZone && <p role='status'>{t('timezone.overlap')}</p>}
            </div>
          )}
          <Tabs.List aria-label={t('meeting.result.tabs.summary')} trailing={activeTab === 'summary' ? commentShortcut : undefined}>
            <Tabs.Trigger value='summary'>
              {t(isConfirmed ? 'meeting.result.tabs.confirmed' : 'meeting.result.tabs.summary')}
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
        </div>
        {actions && (
          <div className={styles.ResultActions}>
            {myResponse && !isConfirmed && (
              <p className={styles.ResponseStatus} role='status'>
                {t(meetingData.meeting.selectionType === 'TIME' ? 'meeting.unavailable.times' : 'meeting.unavailable.dates')}
              </p>
            )}
            {actions}
          </div>
        )}
        <div className={styles.ResultPanels}>
          <SummaryContent
            meetingData={meetingData}
            resultZone={resultZone}
            onMeetingUpdated={onMeetingUpdated}
          />
          <CalendarContent
            key={meetingData.meeting.code}
            meetingData={displayedMeetingData}
            dates={dates}
            availableTimes={availableTimes}
            voteAction={!isConfirmed && <AvailabilityAction meetingData={meetingData} className={styles.CalendarVoteAction} />}
          />
          {displayedMeetingData.locationVote?.enabled && (
            <LocationContent locationVote={displayedMeetingData.locationVote} />
          )}
          <ParticipantsContent meetingData={meetingData} />
        </div>
        {comments && <div className={styles.ResultComments} hidden={activeTab !== 'summary'}>{comments}</div>}
      </div>
    </Tabs.Root>
  )
}

// 요약 탭 컴포넌트
function SummaryContent ({
  meetingData,
  resultZone,
  onMeetingUpdated,
}: {
  meetingData: get_meetings_$meetingCode_response['data']
  resultZone: string
  onMeetingUpdated?: () => void
}) {
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

  const confirmedDate = meetingData.meeting.confirmedDate
  const confirmedAvailabilityTime = getConfirmedAvailabilityTime(meetingData.meeting)
  const confirmedBestSlot = confirmedDate
    ? meetingData.summary.bestSlots.find((slot) => {
        const [slotStart] = slot.time.split(' ~ ')
        return slot.date === confirmedDate && slotStart === confirmedAvailabilityTime
      })
    : undefined
  const confirmedSchedule = confirmedDate
    ? meetingData.schedule[confirmedDate]?.[confirmedAvailabilityTime]
    : undefined
  const confirmedParticipants = confirmedBestSlot?.participants ?? confirmedSchedule?.participants ?? []

  return (
    <Tabs.Content value='summary'>
      <div className={styles.AISummaryContainer}>
        {meetingData.meeting.confirmedDate && (
          <ConfirmedPlan data={meetingData} resultZone={resultZone} availableCount={confirmedParticipants.length} onMeetingUpdated={onMeetingUpdated}>
            <AttendanceGroups participants={meetingData.participants} selected={confirmedParticipants} />
          </ConfirmedPlan>
        )}

        {!meetingData.meeting.confirmedDate && (
          <div className={styles.DecisionContainer}>
            <DecisionSummary data={meetingData} displayZone={resultZone} onMeetingUpdated={onMeetingUpdated} />
            <AvailabilityAction meetingData={meetingData} />
          </div>
        )}

        {/* 장소 투표 카드 (enabled인 경우만) */}
        {!meetingData.meeting.confirmedDate && locationVote?.enabled && sortedLocations.length > 0 && (
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
                          {t('meeting.result.voteCount', {
                            count: location.voteCount,
                            percentage: location.percentage,
                          })}
                        </span>
                      </div>
                      <LocationVoters voters={location.voters} />
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
  allParticipants,
  confirmed,
}: {
  isOpen: boolean
  onClose: () => void
  date: string
  time?: string
  participants: get_meetings_$meetingCode_response['data']['participants']
  allParticipants: Participants
  confirmed: boolean
}) {
  const locale = useStore($locale)
  const { t } = useTranslation()

  const returnFocus = useDialogReturnFocus()

  const formattedDate = date ? formatDate(date, locale) : ''

  return (
    <ParticipantDialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <ParticipantDialog.Portal>
        <ParticipantDialog.Overlay className={styles.ModalOverlay} />
        <ParticipantDialog.Content className={styles.ModalContent} aria-describedby={undefined} {...returnFocus}>
          <div className={styles.ModalHeader}>
            <ParticipantDialog.Title className={styles.ModalTitle}>
              <span>{formattedDate}</span>
              {time && <span className={styles.ModalTime}>{time}</span>}
            </ParticipantDialog.Title>
            <button type='button' className={styles.ModalCloseButton} onClick={onClose} aria-label={t('common.close')}>
              <HiX />
            </button>
          </div>
          <div className={styles.ModalBody}>
            <AttendanceGroups participants={allParticipants} selected={participants} confirmed={confirmed} />
            {allParticipants.length === 0 && <p className={styles.ModalEmptyText}>{t('meeting.participantsEmpty')}</p>}
          </div>
        </ParticipantDialog.Content>
      </ParticipantDialog.Portal>
    </ParticipantDialog.Root>
  )
}

function AvailabilityAction ({ meetingData, className = '' }: {
  meetingData: get_meetings_$meetingCode_response['data']
  className?: string
}) {
  const me = useStore($me)
  const { t } = useTranslation()
  const hasSelection = hasUserScheduleSelection(meetingData.schedule, me?.userId) || Boolean(me && meetingData.participants.find(person => person.userId === me.userId)?.availabilityResponse)

  return (
    <a href={`/meetings/${meetingData.meeting.code}/select/${meetingData.meeting.selectionType.toLowerCase()}`} className={`${styles.SummaryVoteAction} ${className}`} data-appearance={hasSelection ? 'edit' : 'primary'}>
      <HiOutlinePencil aria-hidden='true' />
      {t(`meeting.result.buttons.${hasSelection ? 'editAvailability' : 'enterAvailability'}`)}
    </a>
  )
}

// The filter belongs to the calendar tab; summaries and saved votes use the full roster.
function CalendarContent ({ meetingData, dates, availableTimes, voteAction }: {
  meetingData: get_meetings_$meetingCode_response['data']
  dates: dayjs.Dayjs[]
  availableTimes: string[]
  voteAction: ReactNode
}) {
  // Exclusions keep existing choices through live updates and select new participants by default.
  const [excludedIds, setExcludedIds] = useState<Set<number>>(() => new Set())
  const selectedParticipants = useMemo(() => meetingData.participants.filter(person => !excludedIds.has(person.userId)), [meetingData.participants, excludedIds])
  const selectedIds = useMemo(() => new Set(selectedParticipants.map(person => person.userId)), [selectedParticipants])
  const filteredSchedule = useMemo(() => getCalendarAvailability(meetingData.schedule, meetingData.meeting.availableDates, selectedIds, meetingData.meeting.selectionType), [meetingData.schedule, meetingData.meeting.availableDates, selectedIds, meetingData.meeting.selectionType])

  return (
    <Tabs.Content value='calendar' forceMount>
      <div className={styles.Calendar}>
        {meetingData.meeting.selectionType === 'TIME'
          ? <DailyCalendarContent meetingData={meetingData} dates={dates} availableTimes={availableTimes} filteredSchedule={filteredSchedule} selectedParticipants={selectedParticipants} />
          : <MonthlyCalendarContent meetingData={meetingData} dates={dates} filteredSchedule={filteredSchedule} selectedParticipants={selectedParticipants} />}
        {voteAction}
        <CalendarParticipantFilter
          participants={meetingData.participants}
          selectedIds={selectedIds}
          hasAvailability={Object.keys(filteredSchedule).length > 0}
          onToggle={userId => setExcludedIds((previous) => {
            const next = new Set(previous)
            if (next.has(userId)) next.delete(userId)
            else next.add(userId)
            return next
          })}
          onSelectAll={checked => setExcludedIds(new Set(checked ? [] : meetingData.participants.map(person => person.userId)))}
        />
      </div>
    </Tabs.Content>
  )
}

// 달력 탭 컴포넌트
function MonthlyCalendarContent ({
  meetingData,
  dates,
  filteredSchedule,
  selectedParticipants,
}: {
  meetingData: get_meetings_$meetingCode_response['data']
  dates: dayjs.Dayjs[]
  filteredSchedule: get_meetings_$meetingCode_response['data']['schedule']
  selectedParticipants: Participants
}) {
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
    return slotData?.participants.filter(person => selectedParticipants.some(selected => selected.userId === person.userId)) || []
  }, [modalState, meetingData.schedule, selectedParticipants])

  const dateSchedule = useMemo(() => Object.fromEntries(
    Object.entries(filteredSchedule).flatMap(([date, slots]) => slots.ALL_DAY ? [[date, slots.ALL_DAY]] : []),
  ), [filteredSchedule])

  return (
    <>
      <div className={styles.CalendarHeading}>
        <p className={styles.Title}>{t('meeting.result.calendarTitle')}</p>
      </div>
      <Monthly
        mode='view'
        dates={[]}
        availableDates={dates}
        dateSchedule={dateSchedule}
        participantsCount={selectedParticipants.length}
        onDateClick={selectedParticipants.length > 0
          ? (date) => {
              setModalState({
                isOpen: true,
                date: date.format('YYYY-MM-DD'),
              })
            }
          : undefined}
      />
      <ParticipantsModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        date={modalState.date}
        participants={participants}
        allParticipants={selectedParticipants}
        confirmed={Boolean(meetingData.meeting.confirmedDate)}
      />
    </>
  )
}

function DailyCalendarContent ({
  meetingData,
  dates,
  filteredSchedule,
  selectedParticipants,
  availableTimes,
}: {
  meetingData: get_meetings_$meetingCode_response['data']
  dates: dayjs.Dayjs[]
  filteredSchedule: get_meetings_$meetingCode_response['data']['schedule']
  selectedParticipants: Participants
  availableTimes: string[]
}) {
  const { t, locale } = useTranslation()
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
    return slotData?.participants.filter(person => selectedParticipants.some(selected => selected.userId === person.userId)) || []
  }, [modalState, meetingData.schedule, selectedParticipants])

  return (
    <>
      <Daily
        heading={t('meeting.result.calendarTitle')}
        timezone={meetingData.meeting.timezone}
        intervalMinutes={meetingData.meeting.intervalMinutes}
        availableDates={meetingData.meeting.availableDates}
        dates={dates}
        availableTimes={availableTimes}
        selections={{}}
        schedule={filteredSchedule}
        participantsCount={selectedParticipants.length}
        mode='view'
        onCellClick={selectedParticipants.length > 0 ? handleCellClick : undefined}
      />
      <ParticipantsModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        date={modalState.date}
        time={modalState.time ? formatTime(modalState.time, locale, '') : ''}
        participants={participants}
        allParticipants={selectedParticipants}
        confirmed={Boolean(meetingData.meeting.confirmedDate)}
      />
    </>
  )
}

type Participants = get_meetings_$meetingCode_response['data']['participants']

function ParticipantGroup ({ label, participants, status, compact = false }: { label: string, participants: Participants, status: string, compact?: boolean }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  if (participants.length === 0) return null
  const visible = expanded ? participants : participants.slice(0, 6)
  return (
    <section className={styles.ResponseGroup} data-response-group={status} aria-label={compact ? label : undefined}>
      {!compact && <h3 className={styles.ResponseGroupHeading}>{label}<span>{t('meeting.result.participantsCount', { count: participants.length })}</span></h3>}
      <ul className={styles.ResponsePeople}>
        {visible.map(person => (
          <li key={person.userId} className={styles.ParticipantItem}>
            <Avatar src={person.profileImageUrl} name={person.username} size={32} />
            <bdi className={styles.ParticipantName}>{person.username}</bdi>
          </li>
        ))}
      </ul>
      {participants.length > 6 && (
        <button type='button' className={styles.ResponseLink} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
          {t(expanded ? 'meeting.unavailable.lessPeople' : 'meeting.unavailable.morePeople', { count: participants.length - 6 })}
        </button>
      )}
    </section>
  )
}

function AttendanceGroups ({ participants, selected, confirmed = false, compact = false }: { participants: Participants, selected: Participants, confirmed?: boolean, compact?: boolean }) {
  const { t } = useTranslation()
  const selectedIds = new Set(selected.map(person => person.userId))
  const others = participants.filter(person => !selectedIds.has(person.userId))
  return (
    <div className={styles.ResponseGroups}>
      <ParticipantGroup status='available' label={t(confirmed ? 'meeting.result.attendance.available' : 'meeting.unavailable.picked')} participants={selected} compact={compact} />
      {confirmed
        ? <ParticipantGroup status='unavailable' label={t('meeting.result.attendance.unavailable')} participants={others} />
        : (
            <>
              <ParticipantGroup status='other' label={t('meeting.unavailable.otherSelection')} participants={others.filter(person => !person.availabilityResponse)} />
              <ParticipantGroup status='none' label={t('meeting.unavailable.noneStatus')} participants={others.filter(person => person.availabilityResponse === 'NONE')} />
              <ParticipantGroup status='pending' label={t('meeting.unavailable.pending')} participants={others.filter(person => person.availabilityResponse === 'NEEDS_RESPONSE')} />
            </>
          )}
    </div>
  )
}

function ParticipantsContent ({ meetingData }: { meetingData: get_meetings_$meetingCode_response['data'] }) {
  const { t } = useTranslation()
  const { participants, meeting } = meetingData
  const confirmed = Boolean(meeting.confirmedDate)
  const confirmedTime = getConfirmedAvailabilityTime(meeting)
  const confirmedParticipants = meeting.confirmedDate
    ? meetingData.summary.bestSlots.find(slot => slot.date === meeting.confirmedDate && slot.time.split(' ~ ')[0] === confirmedTime)?.participants
    ?? meetingData.schedule[meeting.confirmedDate]?.[confirmedTime]?.participants ?? []
    : []
  return (
    <Tabs.Content value='participants'>
      <div className={styles.Card}>
        <div className={styles.Summary}>
          <div className={styles.ParticipantsHeading}>
            <p className={styles.Title}>{t('meeting.unavailable.respondents')}</p>
            <p className={styles.DetailText}>{t('meeting.result.participantsCount', { count: participants.length })}</p>
          </div>
          {confirmed && <p className={styles.ResponseBasis}>{t('meeting.unavailable.basis')}</p>}
          {participants.length === 0 && <p className={styles.DetailText}>{t('meeting.participantsEmpty')}</p>}
          {confirmed
            ? <AttendanceGroups participants={participants} selected={confirmedParticipants} confirmed />
            : (
                <div className={styles.ResponseGroups}>
                  <ParticipantGroup status='selected' label={t('meeting.unavailable.selected')} participants={participants.filter(person => !person.availabilityResponse)} />
                  <ParticipantGroup status='none' label={t('meeting.unavailable.noneStatus')} participants={participants.filter(person => person.availabilityResponse)} />
                </div>
              )}
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
                      {t('meeting.result.voteCount', {
                        count: location.voteCount,
                        percentage: location.percentage,
                      })}
                    </span>
                  </div>

                  <LocationVoters voters={location.voters} />
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </Tabs.Content>
  )
}
