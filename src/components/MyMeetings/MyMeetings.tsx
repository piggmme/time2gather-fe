import { Tabs } from '../Tabs/Tabs'
import { useTranslation } from '../../hooks/useTranslation'
import styles from './MyMeetings.module.scss'
import Avatar from '../Avatar/Avatar'
import { useStore } from '@nanostores/react'
import { $me } from '../../stores/me'
import { HiChevronRight } from 'react-icons/hi'
import { CalendarIcon } from '@radix-ui/react-icons'
import Button from '../Button/Button'
import { localeMeta } from '../../i18n'
import { usePageState, usePageScrollRestoration } from '../../hooks/usePageState'

export default function MyMeetings () {
  const { t, locale } = useTranslation()
  const me = useStore($me)
  const [activeTab, setActiveTab] = usePageState('myMeetingsTab', 'myMeetings')
  usePageScrollRestoration(Boolean(me))

  const emptyState = (participated = false) => (
    <div className={styles.emptyState}>
      <span className={styles.emptyIcon} aria-hidden='true'>
        <CalendarIcon width={24} height={24} />
      </span>
      <h2>{t(participated ? 'my.noParticipatedMeetings' : 'my.noMeetings')}</h2>
      <div className={styles.emptyActions}>
        <Button as='a' buttonType='primary' href={participated ? '/meetings/search' : '/meetings/create'}>
          {t(participated ? 'common.searchMeetingButton' : 'common.createMeeting')}
        </Button>
        {!participated && (
          <Button as='a' buttonType='utility' href='/meetings/search'>
            {t('common.searchMeetingButton')}
          </Button>
        )}
      </div>
    </div>
  )

  if (me === undefined) {
    return <div className={styles.loading} role='status'>{t('common.loading')}</div>
  }

  if (!me) return emptyState()

  return (
    <>
      <div className={styles.myInfo}>
        <Avatar
          src={me.profileImageUrl}
          name={me.username}
        />
        <bdi className={styles.username}>{me.username}</bdi>
      </div>
      <div className={styles.meetingsTabs}>
        <Tabs.Root value={activeTab} onValueChange={setActiveTab} dir={localeMeta[locale].dir}>
          <Tabs.List>
            <Tabs.Trigger value='myMeetings'>
              {t('my.tabs.myMeetings')}
            </Tabs.Trigger>
            <Tabs.Trigger value='participatedMeetings'>
              {t('my.tabs.participatedMeetings')}
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value='myMeetings'>
            {
              me.createdMeetings && me.createdMeetings?.length > 0
                ? (
                    <>
                      <div className={styles.detail}>
                        {t('my.myMeetingsDetails', { count: me.createdMeetings.length })}
                      </div>
                      <ul className={styles.List}>
                        {
                          me.createdMeetings.map(meeting => (
                            <li key={meeting.id}>
                              <a href={`/meetings/${meeting.code}`}>
                                <span className={styles.title}>
                                  {meeting.title}
                                </span>
                                <HiChevronRight size={16} />
                              </a>
                            </li>
                          ))
                        }
                      </ul>
                    </>
                  )
                : (
                    emptyState()
                  )
            }
          </Tabs.Content>
          <Tabs.Content value='participatedMeetings'>
            {
              me.participatedMeetings && me.participatedMeetings?.length > 0
                ? (
                    <>
                      <div className={styles.detail}>
                        {t('my.participatedMeetingsDetails', { count: me.participatedMeetings.length })}
                      </div>
                      <ul className={styles.List}>
                        {
                          me.participatedMeetings.map(meeting => (
                            <li key={meeting.id}>
                              <a href={`/meetings/${meeting.code}`}>
                                <span className={styles.title}>
                                  {meeting.title}
                                </span>
                                <HiChevronRight size={16} />
                              </a>
                            </li>
                          ))
                        }
                      </ul>
                    </>
                  )
                : (
                    emptyState(true)
                  )
            }
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </>
  )
}
