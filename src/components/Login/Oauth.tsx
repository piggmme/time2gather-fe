import { useAsync, useSearchParam } from 'react-use'
import { auth } from '../../services/auth'
import { navigate } from 'astro:transitions/client'

export default function Oauth () {
  const code = useSearchParam('code')

  useAsync(async () => {
    if (!code) return

    const response = await auth.oauth.$provider.post('kakao', code)
    console.log({response})
    navigate('/meetings/create')
  }, [code])

  return null
}