import { usePageState } from '../hooks/usePageState'
import Input from './Input/Input'
import Button from './Button/Button'
import { navigate } from '../utils/navigation'
import { useTranslation } from '../hooks/useTranslation'

export default function SearchMeeting () {
  const { t } = useTranslation()
  const [value, setvalue] = usePageState('meetingSearch', '')

  return (
    <>
      <Input
        placeholder={t('common.searchMeetingPlaceholder')}
        value={value}
        onChange={e => setvalue(e.target.value)}
      />
      <Button
        buttonType='primary'
        disabled={!value}
        onClick={() => {
          const meetingCode = value.match(/\/meetings\/([^/?#]+)/)?.[1] || value
          navigate(`/meetings/${meetingCode}`)
        }}
      >
        {t('common.searchMeetingButton')}
      </Button>
    </>
  )
}
