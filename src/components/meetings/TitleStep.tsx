import CreateFlowActions from './CreateFlowActions'
import { usePageState } from '../../hooks/usePageState'
import styles from './CreateMeeting.module.scss'
import Button from '../Button/Button'
import { navigate, navigateBack } from '../../utils/navigation'
import { useSearchParam } from 'react-use'
import Input from '../Input/Input'
import { useTranslation } from '../../hooks/useTranslation'

export default function TitleStep () {
  const titleParam = useSearchParam('title')
  const meetingTypeParam = useSearchParam('meetingType')
  const [title, setTitle] = usePageState('title', titleParam || '')
  const { t } = useTranslation()

  return (
    <>
      <h1 className={styles.title}>{t('createMeeting.titleStep.heading')}</h1>
      <div className={`${styles.inputContainer} ${styles.titleInput}`}>
        <Input
          placeholder={t('createMeeting.titleStep.placeholder')}
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      </div>
      <CreateFlowActions>
        <Button
          buttonType='ghost'
          onClick={() => {
            const newUrl = `/meetings/create?step=meetingType&meetingType=${meetingTypeParam}`
            return navigateBack(newUrl)
          }}
        >
          {t('common.previous')}
        </Button>
        <Button
          disabled={title.length === 0}
          buttonType='primary'
          onClick={() => {
            return navigate(`/meetings/create?step=dates&meetingType=${meetingTypeParam}&title=${encodeURIComponent(title ?? '')}`)
          }}
        >
          {t('common.next')}
        </Button>
      </CreateFlowActions>
    </>
  )
}
