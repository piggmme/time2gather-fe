import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useStore } from '@nanostores/react'
import {
  CalendarIcon,
  CheckCircledIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  PersonIcon,
  ReloadIcon,
} from '@radix-ui/react-icons'
import { $me } from '../../stores/me'
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
  const me = useStore($me)
  const { t, locale } = useTranslation()
  const isAdmin = me?.provider !== 'ANONYMOUS' && me?.role === 'ADMIN'
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [summaryError, setSummaryError] = useState(false)
  const [users, setUsers] = useState<AdminPage<AdminUser>>(EMPTY_USERS)
  const [meetings, setMeetings] = useState<AdminPage<AdminMeeting>>(EMPTY_MEETINGS)
  const [userQuery, setUserQuery] = useState('')
  const [meetingQuery, setMeetingQuery] = useState('')
  const [appliedUserQuery, setAppliedUserQuery] = useState('')
  const [appliedMeetingQuery, setAppliedMeetingQuery] = useState('')
  const [userPage, setUserPage] = useState(0)
  const [meetingPage, setMeetingPage] = useState(0)
  const [usersLoading, setUsersLoading] = useState(false)
  const [meetingsLoading, setMeetingsLoading] = useState(false)
  const [usersError, setUsersError] = useState(false)
  const [meetingsError, setMeetingsError] = useState(false)
  const [summaryReloadKey, setSummaryReloadKey] = useState(0)
  const [usersReloadKey, setUsersReloadKey] = useState(0)
  const [meetingsReloadKey, setMeetingsReloadKey] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    setSummaryError(false)
    admin.summary.get()
      .then(data => active && setSummary(data))
      .catch(() => active && setSummaryError(true))
    return () => {
      active = false
    }
  }, [isAdmin, summaryReloadKey])

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    setUsersLoading(true)
    setUsersError(false)
    admin.users.get(appliedUserQuery, userPage)
      .then(data => active && setUsers(data))
      .catch(() => active && setUsersError(true))
      .finally(() => active && setUsersLoading(false))
    return () => {
      active = false
    }
  }, [isAdmin, appliedUserQuery, userPage, usersReloadKey])

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    setMeetingsLoading(true)
    setMeetingsError(false)
    admin.meetings.get(appliedMeetingQuery, meetingPage)
      .then(data => active && setMeetings(data))
      .catch(() => active && setMeetingsError(true))
      .finally(() => active && setMeetingsLoading(false))
    return () => {
      active = false
    }
  }, [isAdmin, appliedMeetingQuery, meetingPage, meetingsReloadKey])

  if (me === undefined || me === null || me.provider === 'ANONYMOUS') {
    return <PageState title={t('admin.loading')} description={t('admin.loadingDescription')} />
  }

  if (!isAdmin) {
    return (
      <PageState
        icon={<LockClosedIcon width={28} height={28} />}
        title={t('admin.accessDeniedTitle')}
        description={t('admin.accessDeniedDescription')}
        action={<a className={styles.primaryAction} href='/'>{t('common.home')}</a>}
      />
    )
  }

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
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(date))
  }

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <span className={styles.eyebrow}>{t('admin.eyebrow')}</span>
        <h1>{t('admin.title')}</h1>
        <p>{t('admin.description')}</p>
      </header>

      <section aria-labelledby='admin-summary-title'>
        <div className={styles.sectionHeading}>
          <div>
            <h2 id='admin-summary-title'>{t('admin.summaryTitle')}</h2>
            <p>{t('admin.summaryDescription')}</p>
          </div>
          <button
            type='button'
            className={styles.iconButton}
            onClick={() => setSummaryReloadKey(key => key + 1)}
            aria-label={t('admin.refresh')}
          >
            <ReloadIcon width={18} height={18} />
          </button>
        </div>
        {summaryError
          ? <ErrorState message={t('admin.loadError')} retryLabel={t('admin.retry')} onRetry={() => setSummaryReloadKey(key => key + 1)} />
          : (
              <div className={styles.summaryGrid} aria-live='polite'>
                <SummaryCard icon={<PersonIcon />} label={t('admin.stats.totalUsers')} value={summary?.users.total} detail={t('admin.stats.adminUsers', { count: summary?.users.admins ?? 0 })} />
                <SummaryCard icon={<PersonIcon />} label={t('admin.stats.registeredUsers')} value={summary?.users.registered} />
                <SummaryCard icon={<PersonIcon />} label={t('admin.stats.anonymousUsers')} value={summary?.users.anonymous} />
                <SummaryCard icon={<CalendarIcon />} label={t('admin.stats.totalMeetings')} value={summary?.meetings.total} />
                <SummaryCard icon={<CalendarIcon />} label={t('admin.stats.activeMeetings')} value={summary?.meetings.active} />
                <SummaryCard icon={<CheckCircledIcon />} label={t('admin.stats.confirmedMeetings')} value={summary?.meetings.confirmed} />
              </div>
            )}
      </section>

      <section className={styles.panel} aria-labelledby='admin-users-title'>
        <PanelHeader
          title={t('admin.users.title')}
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
                      <span>{t('admin.users.provider')}</span>
                      <span>{t('admin.users.role')}</span>
                      <span>{t('admin.users.joinedAt')}</span>
                    </div>
                    {users.content.map(user => (
                      <article className={`${styles.listRow} ${styles.userGrid}`} key={user.id}>
                        <div className={styles.primaryCell}>
                          <strong>{user.username}</strong>
                          <span>{user.email || t('admin.users.noEmail')}</span>
                        </div>
                        <LabeledCell label={t('admin.users.provider')}><StatusBadge>{t(`admin.providers.${user.provider}`)}</StatusBadge></LabeledCell>
                        <LabeledCell label={t('admin.users.role')}><StatusBadge tone={user.role === 'ADMIN' ? 'primary' : 'neutral'}>{t(`admin.roles.${user.role}`)}</StatusBadge></LabeledCell>
                        <LabeledCell label={t('admin.users.joinedAt')}>{formatDate(user.createdAt)}</LabeledCell>
                      </article>
                    ))}
                  </div>
                )}
        <Pagination
          page={users.page}
          totalPages={users.totalPages}
          previousLabel={t('common.previous')}
          nextLabel={t('common.next')}
          pageLabel={t('admin.pageOf', { current: users.page + 1, total: Math.max(users.totalPages, 1) })}
          onChange={setUserPage}
        />
      </section>

      <section className={styles.panel} aria-labelledby='admin-meetings-title'>
        <PanelHeader
          title={t('admin.meetings.title')}
          description={t('admin.meetings.description', { count: meetings.totalElements })}
          query={meetingQuery}
          placeholder={t('admin.meetings.searchPlaceholder')}
          searchLabel={t('admin.search')}
          onQueryChange={setMeetingQuery}
          onSubmit={submitMeetingSearch}
        />
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
                          <a href={`/meetings/${meeting.meetingCode}`}><strong>{meeting.title}</strong></a>
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
  return (
    <article className={styles.summaryCard}>
      <div className={styles.summaryIcon}>{icon}</div>
      <span>{label}</span>
      <strong>{value === undefined ? '—' : value.toLocaleString()}</strong>
      {detail && <small>{detail}</small>}
    </article>
  )
}

function PanelHeader ({
  title, description, query, placeholder, searchLabel, onQueryChange, onSubmit,
}: {
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
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <form className={styles.searchForm} onSubmit={onSubmit} role='search'>
        <MagnifyingGlassIcon width={18} height={18} aria-hidden='true' />
        <input
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          maxLength={100}
        />
        <button type='submit'>{searchLabel}</button>
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
  page, totalPages, pageLabel, previousLabel, nextLabel, onChange,
}: {
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
      <button type='button' onClick={() => onChange(page - 1)} disabled={page === 0} aria-label={previousLabel}>
        <ChevronLeftIcon width={18} height={18} />
        <span>{previousLabel}</span>
      </button>
      <span>{pageLabel}</span>
      <button type='button' onClick={() => onChange(page + 1)} disabled={page + 1 >= totalPages} aria-label={nextLabel}>
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

function PageState ({ icon, title, description, action }: { icon?: ReactNode, title: string, description: string, action?: ReactNode }) {
  return (
    <main className={styles.pageState}>
      {icon && <div className={styles.pageStateIcon}>{icon}</div>}
      <h1>{title}</h1>
      <p>{description}</p>
      {action}
    </main>
  )
}
