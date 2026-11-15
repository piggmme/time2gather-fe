import { usePageState } from '../hooks/usePageState'
import Input from './Input/Input'
import Button from './Button/Button'
import { navigate } from '../utils/navigation'
import { useTranslation } from '../hooks/useTranslation'
import { beginMeetingCodeEntry } from '../utils/analytics'

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
        disabled={!value.trim()}
        onClick={() => {
          const input = value.trim()
          if (!input) return
          const linkedCode = input.match(/\/meetings\/([^/?#]+)/)?.[1]
          const meetingCode = linkedCode || input
          beginMeetingCodeEntry(meetingCode, linkedCode ? 'link' : 'code')
          navigate(`/meetings/${encodeURIComponent(meetingCode)}`)
        }}
      >
        {t('common.searchMeetingButton')}
      </Button>
    </>
  )
}
