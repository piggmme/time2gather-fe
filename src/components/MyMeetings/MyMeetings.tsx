import { Tabs } from "../Tabs/Tabs";
import { useTranslation } from "../../hooks/useTranslation";
import styles from './MyMeetings.module.scss';
import Avatar from "../Avatar/Avatar";
import { useStore } from "@nanostores/react";
import { $me } from "../../stores/me";
import { HiChevronRight } from "react-icons/hi";

export default function MyMeetings() {
  const { t } = useTranslation();
  const me = useStore($me);

  if (!me) return null;

  return (
    <>
      <div className={styles.myInfo}>
        <Avatar
          src={me.profileImageUrl}
          name={me.username}
        />
        <span>{me.username}</span>
      </div>
      <Tabs.Root defaultValue="myMeetings">
        <Tabs.List>
          <Tabs.Trigger value="myMeetings">
            {t('my.tabs.myMeetings')}
          </Tabs.Trigger>
          <Tabs.Trigger value="participatedMeetings">
            {t('my.tabs.participatedMeetings')}
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="myMeetings">
          {
            me.createdMeetings && me.createdMeetings?.length > 0 ? (
              <>
                <div className={styles.detail}>
                  {t('my.myMeetingsDetails', { count: me.createdMeetings.length })}
                </div>
                <ul className={styles.List}>
                  {
                    me.createdMeetings.map((meeting) => (
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
            ) : (
              <div className={styles.detail}>
                {t('my.noMeetings')}
              </div>
            )
          }
        </Tabs.Content>
        <Tabs.Content value="participatedMeetings">
          {
            me.participatedMeetings && me.participatedMeetings?.length > 0 ? (
              <>
                <div className={styles.detail}>
                  {t('my.participatedMeetingsDetails', { count: me.participatedMeetings.length })}
                </div>
                <ul className={styles.List}>
                  {
                    me.participatedMeetings.map((meeting) => (
                      <li key={meeting.id}>
                        <a href={`/meetings/${meeting.code}`}>
                          <span className={styles.Title}>
                            {meeting.title}
                          </span>
                          <HiChevronRight size={16} />
                        </a>
                      </li>
                    ))
                    }
                </ul>
              </>
            ) : (
              <div className={styles.detail}>
                {t('my.noParticipatedMeetings')}
              </div>
            )
          }
        </Tabs.Content>
      </Tabs.Root>
    </>
  )
}