import { intlLocale } from '../../i18n'
import {
  useEffect, useRef, useState, type FormEvent, type ReactNode,
} from 'react'
import {
  CalendarIcon,
  CheckCircledIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  MagnifyingGlassIcon,
  PersonIcon,
  ReloadIcon,
} from '@radix-ui/react-icons'
import {
  admin,
  type AdminMeeting,
  type AdminPage,
  type AdminSummary,
  type AdminUser,
} from '../../services/admin'
import { useTranslation } from '../../hooks/useTranslation'
import styles from './AdminDashboard.module.scss'

const EMPTY_USERS: AdminPage<AdminUser> = {
  content: [], page: 0, size: 20, totalElements: 0, totalPages: 0,
}
const EMPTY_MEETINGS: AdminPage<AdminMeeting> = {
  content: [], page: 0, size: 20, totalElements: 0, totalPages: 0,
}

export default function AdminDashboard () {
  const { t, locale } = useTranslation()
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [summaryError, setSummaryError] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [users, setUsers] = useState<AdminPage<AdminUser>>(EMPTY_USERS)
  const [meetings, setMeetings] = useState<AdminPage<AdminMeeting>>(EMPTY_MEETINGS)
  const [userQuery, setUserQuery] = useState('')
  const [meetingQuery, setMeetingQuery] = useState('')
  const [appliedUserQuery, setAppliedUserQuery] = useState('')
  const [appliedMeetingQuery, setAppliedMeetingQuery] = useState('')
  const [confirmedOnly, setConfirmedOnly] = useState(false)
  const [userPage, setUserPage] = useState(0)
  const [meetingPage, setMeetingPage] = useState(0)
  const userCursors = useRef(new Map<number, string>())
  const meetingCursors = useRef(new Map<number, string>())
  const [usersLoading, setUsersLoading] = useState(true)
  const [meetingsLoading, setMeetingsLoading] = useState(true)
  const [usersError, setUsersError] = useState(false)
  const [meetingsError, setMeetingsError] = useState(false)
  const [summaryReloadKey, setSummaryReloadKey] = useState(0)
  const [usersReloadKey, setUsersReloadKey] = useState(0)
  const [meetingsReloadKey, setMeetingsReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setSummaryError(false)
    setSummaryLoading(true)
    admin.summary.get()
      .then(data => active && setSummary(data))
      .catch(() => active && setSummaryError(true))
      .finally(() => active && setSummaryLoading(false))
    return () => {
      active = false
    }
  }, [summaryReloadKey])

  useEffect(() => {
    let active = true
    setUsersLoading(true)
    setUsersError(false)
    if (userPage === 0) userCursors.current.clear()
    admin.users.get(appliedUserQuery, userPage, 20, appliedUserQuery ? undefined : userCursors.current.get(userPage))
      .then((data) => {
        if (!active) return
        for (const number of userCursors.current.keys()) {
          if (number > userPage) userCursors.current.delete(number)
        }
        if (data.nextCursor) userCursors.current.set(userPage + 1, data.nextCursor)
        setUsers(data)
      })
      .catch(() => active && setUsersError(true))
      .finally(() => active && setUsersLoading(false))
    return () => {
      active = false
    }
  }, [appliedUserQuery, userPage, usersReloadKey])

  useEffect(() => {
    let active = true
    setMeetingsLoading(true)
    setMeetingsError(false)
    if (meetingPage === 0) meetingCursors.current.clear()
    admin.meetings.get(appliedMeetingQuery, meetingPage, 20, appliedMeetingQuery || confirmedOnly ? undefined : meetingCursors.current.get(meetingPage), confirmedOnly)
      .then((data) => {
        if (!active) return
        for (const number of meetingCursors.current.keys()) {
          if (number > meetingPage) meetingCursors.current.delete(number)
        }
        if (data.nextCursor) meetingCursors.current.set(meetingPage + 1, data.nextCursor)
        setMeetings(data)
      })
      .catch(() => active && setMeetingsError(true))
      .finally(() => active && setMeetingsLoading(false))
    return () => {
      active = false
    }
  }, [appliedMeetingQuery, confirmedOnly, meetingPage, meetingsReloadKey])

  const submitUserSearch = (event: FormEvent) => {
    event.preventDefault()
    setUserPage(0)
    setAppliedUserQuery(userQuery.trim())
  }

  const submitMeetingSearch = (event: FormEvent) => {
    event.preventDefault()
    setMeetingPage(0)
    setAppliedMeetingQuery(meetingQuery.trim())
  }

  const formatDate = (date: string | null) => {
    if (!date) return t('admin.notAvailable')
    return new Intl.DateTimeFormat(intlLocale(locale), {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(date))
  }

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.eyebrow}>{t('admin.eyebrow')}</span>
        <h1>{t('admin.title')}</h1>
        <p>{t('admin.description')}</p>
        <nav className={styles.quickNav}>
          <a href='#admin-summary-title'>{t('admin.summaryTitle')}</a>
          <a href='#admin-users-title'>{t('admin.users.title')}</a>
          <a href='#admin-meetings-title'>{t('admin.meetings.title')}</a>
        </nav>
      </header>

      <section aria-labelledby='admin-summary-title' aria-busy={summaryLoading}>
        <div className={styles.sectionHeading}>
          <div>
            <h2 id='admin-summary-title'>{t('admin.summaryTitle')}</h2>
            <p>{t('admin.summaryDescription')}</p>
          </div>
          <button
            type='button'
            className={styles.iconButton}
            disabled={summaryLoading || usersLoading || meetingsLoading}
            onClick={() => {
              setSummaryReloadKey(key => key + 1)
              setUsersReloadKey(key => key + 1)
              setMeetingsReloadKey(key => key + 1)
            }}
            aria-label={t('admin.refresh')}
          >
            <ReloadIcon width={18} height={18} />
          </button>
        </div>
        {summaryError
          ? <ErrorState message={t('admin.loadError')} retryLabel={t('admin.retry')} onRetry={() => setSummaryReloadKey(key => key + 1)} />
          : (
              <div className={styles.summaryGrid} aria-live='polite'>
                <SummaryCard icon={<PersonIcon />} label={t('admin.stats.totalUsers')} value={summary?.users.total} />
                <SummaryCard icon={<PersonIcon />} label={t('admin.stats.registeredUsers')} value={summary?.users.registered} />
                <SummaryCard icon={<PersonIcon />} label={t('admin.stats.anonymousUsers')} value={summary?.users.anonymous} />
                <SummaryCard icon={<CalendarIcon />} label={t('admin.stats.totalMeetings')} value={summary?.meetings.total} />
                <SummaryCard icon={<CalendarIcon />} label={t('admin.stats.activeMeetings')} value={summary?.meetings.active} />
                <SummaryCard icon={<CheckCircledIcon />} label={t('admin.stats.confirmedMeetings')} value={summary?.meetings.confirmed} detail={summary ? t('admin.stats.confirmationRate', { rate: new Intl.NumberFormat(intlLocale(locale), { style: 'percent', maximumFractionDigits: 1 }).format(summary.meetings.total > 0 ? summary.meetings.confirmed / summary.meetings.total : 0) }) : undefined} />
              </div>
            )}
      </section>

      <section className={styles.panel} aria-labelledby='admin-users-title' aria-busy={usersLoading}>
        <PanelHeader
          id='admin-users-title'
          title={t('admin.users.title')}
          refreshLabel={t('admin.refresh')}
          loading={usersLoading}
          onRefresh={() => setUsersReloadKey(key => key + 1)}
          description={t('admin.users.description', { count: users.totalElements })}
          query={userQuery}
          placeholder={t('admin.users.searchPlaceholder')}
          searchLabel={t('admin.search')}
          onQueryChange={setUserQuery}
          onSubmit={submitUserSearch}
        />
        {usersError
          ? <ErrorState message={t('admin.users.loadError')} retryLabel={t('admin.retry')} onRetry={() => setUsersReloadKey(key => key + 1)} />
          : usersLoading
            ? <ListState message={t('admin.loading')} />
            : users.content.length === 0
              ? <ListState message={t('admin.users.empty')} />
              : (
                  <div className={styles.list}>
                    <div className={`${styles.listHeader} ${styles.userGrid}`} aria-hidden='true'>
                      <span>{t('admin.users.user')}</span>
                      <span>{t('admin.users.joinedAt')}</span>
                    </div>
                    {users.content.map(user => (
                      <article className={`${styles.listRow} ${styles.userGrid}`} key={user.id}>
                        <div className={styles.primaryCell}>
                          <strong>{user.username}</strong>
                          <span>{user.email || t('admin.users.noEmail')}</span>
                        </div>
                        <LabeledCell label={t('admin.users.joinedAt')}>{formatDate(user.createdAt)}</LabeledCell>
                        <div className={styles.userMeetings}>
                          <strong className={styles.userMeetingsHeading}>
                            {t('admin.users.participatedMeetings')} · {(user.participatedMeetings?.length ?? 0).toLocaleString(intlLocale(locale))}
                          </strong>
                          {user.participatedMeetings?.length
                            ? (
                                <ul className={styles.userMeetingList}>
                                  {user.participatedMeetings.map(meeting => (
                                    <li key={meeting.id}>
                                      <a href={`/meetings/${encodeURIComponent(meeting.meetingCode)}?lang=${locale}`} target='_blank' rel='noopener noreferrer' aria-label={`${meeting.title} · ${t('admin.meetings.openNewTab')}`}>
                                        <span dir='auto'>{meeting.title}</span><ExternalLinkIcon aria-hidden='true' />
                                      </a>
                                      <div className={styles.badgeGroup}>
                                        <StatusBadge tone={meeting.active ? 'success' : 'neutral'}>{t(meeting.active ? 'admin.meetings.active' : 'admin.meetings.inactive')}</StatusBadge>
                                        {meeting.confirmed && <StatusBadge tone='primary'>{t('admin.meetings.confirmed')}</StatusBadge>}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )
                            : <p>{t('admin.users.noParticipatedMeetings')}</p>}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
        <Pagination
          busy={usersLoading || usersError || users.page !== userPage}
          page={users.page}
          totalPages={users.totalPages}
          previousLabel={t('common.previous')}
          nextLabel={t('common.next')}
          pageLabel={t('admin.pageOf', { current: users.page + 1, total: Math.max(users.totalPages, 1) })}
          onChange={setUserPage}
        />
      </section>

      <section className={styles.panel} aria-labelledby='admin-meetings-title' aria-busy={meetingsLoading}>
        <PanelHeader
          id='admin-meetings-title'
          title={t('admin.meetings.title')}
          refreshLabel={t('admin.refresh')}
          loading={meetingsLoading}
          onRefresh={() => setMeetingsReloadKey(key => key + 1)}
          description={t('admin.meetings.description', { count: meetings.totalElements })}
          query={meetingQuery}
          placeholder={t('admin.meetings.searchPlaceholder')}
          searchLabel={t('admin.search')}
          onQueryChange={setMeetingQuery}
          onSubmit={submitMeetingSearch}
        />
        <label className={styles.confirmedFilter}>
          <input
            type='checkbox'
            checked={confirmedOnly}
            onChange={(event) => {
              meetingCursors.current.clear()
              setMeetingPage(0)
              setConfirmedOnly(event.target.checked)
            }}
          />
          <span>{t('admin.meetings.confirmedOnly')}</span>
        </label>
        {meetingsError
          ? <ErrorState message={t('admin.meetings.loadError')} retryLabel={t('admin.retry')} onRetry={() => setMeetingsReloadKey(key => key + 1)} />
          : meetingsLoading
            ? <ListState message={t('admin.loading')} />
            : meetings.content.length === 0
              ? <ListState message={t('admin.meetings.empty')} />
              : (
                  <div className={styles.list}>
                    <div className={`${styles.listHeader} ${styles.meetingGrid}`} aria-hidden='true'>
                      <span>{t('admin.meetings.meeting')}</span>
                      <span>{t('admin.meetings.host')}</span>
                      <span>{t('admin.meetings.status')}</span>
                      <span>{t('admin.meetings.createdAt')}</span>
                    </div>
                    {meetings.content.map(meeting => (
                      <article className={`${styles.listRow} ${styles.meetingGrid}`} key={meeting.id}>
                        <div className={styles.primaryCell}>
                          <a href={`/meetings/${encodeURIComponent(meeting.meetingCode)}?lang=${locale}`} target='_blank' rel='noopener noreferrer' aria-label={`${meeting.title} · ${t('admin.meetings.openNewTab')}`}><strong>{meeting.title}</strong> <ExternalLinkIcon aria-hidden='true' /></a>
                          <span>{meeting.meetingCode} · {t(`admin.selectionTypes.${meeting.selectionType}`)}</span>
                        </div>
                        <LabeledCell label={t('admin.meetings.host')}>{meeting.hostUsername || t('admin.meetings.unknownHost')}</LabeledCell>
                        <LabeledCell label={t('admin.meetings.status')}>
                          <div className={styles.badgeGroup}>
                            <StatusBadge tone={meeting.active ? 'success' : 'neutral'}>{t(meeting.active ? 'admin.meetings.active' : 'admin.meetings.inactive')}</StatusBadge>
                            {meeting.confirmed && <StatusBadge tone='primary'>{t('admin.meetings.confirmed')}</StatusBadge>}
                          </div>
                        </LabeledCell>
                        <LabeledCell label={t('admin.meetings.createdAt')}>{formatDate(meeting.createdAt)}</LabeledCell>
                      </article>
                    ))}
                  </div>
                )}
        <Pagination
          busy={meetingsLoading || meetingsError || meetings.page !== meetingPage}
          page={meetings.page}
          totalPages={meetings.totalPages}
          previousLabel={t('common.previous')}
          nextLabel={t('common.next')}
          pageLabel={t('admin.pageOf', { current: meetings.page + 1, total: Math.max(meetings.totalPages, 1) })}
          onChange={setMeetingPage}
        />
      </section>
    </main>
  )
}

function SummaryCard ({ icon, label, value, detail }: { icon: ReactNode, label: string, value?: number, detail?: string }) {
  const { locale } = useTranslation()
  return (
    <article className={styles.summaryCard}>
      <div className={styles.summaryIcon}>{icon}</div>
      <span>{label}</span>
      <strong>{value === undefined ? '—' : value.toLocaleString(intlLocale(locale))}</strong>
      {detail && <small>{detail}</small>}
    </article>
  )
}

function PanelHeader ({
  id, title, description, query, placeholder, searchLabel, refreshLabel, loading, onRefresh, onQueryChange, onSubmit,
}: {
  id: string
  refreshLabel: string
  loading: boolean
  onRefresh: () => void
  title: string
  description: string
  query: string
  placeholder: string
  searchLabel: string
  onQueryChange: (value: string) => void
  onSubmit: (event: FormEvent) => void
}) {
  return (
    <div className={styles.panelHeader}>
      <div>
        <h2 id={id}>{title}</h2>
        <p>{description}</p>
      </div>
      <form className={styles.searchForm} onSubmit={onSubmit} role='search'>
        <div className={styles.searchField}>
          <MagnifyingGlassIcon width={18} height={18} aria-hidden='true' />
          <input
            type='search'
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            maxLength={100}
          />
        </div>
        <button className={styles.searchButton} type='submit'>{searchLabel}</button>
        <button className={styles.iconButton} type='button' onClick={onRefresh} disabled={loading} aria-label={refreshLabel} title={refreshLabel}>
          <ReloadIcon width={18} height={18} aria-hidden='true' />
        </button>
      </form>
    </div>
  )
}

function LabeledCell ({ label, children }: { label: string, children: ReactNode }) {
  return (
    <div className={styles.dataCell}>
      <span className={styles.mobileLabel}>{label}</span>
      <div>{children}</div>
    </div>
  )
}

function StatusBadge ({ children, tone = 'neutral' }: { children: ReactNode, tone?: 'neutral' | 'primary' | 'success' }) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
}

function Pagination ({
  busy, page, totalPages, pageLabel, previousLabel, nextLabel, onChange,
}: {
  busy: boolean
  page: number
  totalPages: number
  pageLabel: string
  previousLabel: string
  nextLabel: string
  onChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <nav className={styles.pagination} aria-label={pageLabel}>
      <button type='button' onClick={() => onChange(page - 1)} disabled={busy || page === 0} aria-label={previousLabel}>
        <ChevronLeftIcon width={18} height={18} />
        <span>{previousLabel}</span>
      </button>
      <span>{pageLabel}</span>
      <button type='button' onClick={() => onChange(page + 1)} disabled={busy || page + 1 >= totalPages} aria-label={nextLabel}>
        <span>{nextLabel}</span>
        <ChevronRightIcon width={18} height={18} />
      </button>
    </nav>
  )
}

function ErrorState ({ message, retryLabel, onRetry }: { message: string, retryLabel: string, onRetry: () => void }) {
  return (
    <div className={styles.inlineState} role='alert'>
      <span>{message}</span>
      <button type='button' onClick={onRetry}><ReloadIcon width={16} height={16} />{retryLabel}</button>
    </div>
  )
}

function ListState ({ message }: { message: string }) {
  return <div className={styles.inlineState} aria-live='polite'>{message}</div>
}
