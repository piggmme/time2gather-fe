import { useAsync, useSearchParam } from 'react-use'
import { auth } from '../../services/auth'
import { navigate } from 'astro:transitions/client'
import { $me } from '../../stores/me'

export default function Oauth () {
  const code = useSearchParam('code')

  useAsync(async () => {
    if (!code) return

    try {
      const response = await auth.oauth.$provider.post('kakao', {
        authorizationCode: code,
        redirectUrl: import.meta.env.DEV ?
          'https://localhost:3000/login/oauth2/code/kakao' :
          'https://time2gather.org/login/oauth2/code/kakao'
      })
      $me.set(response.data)
      navigate('/meetings/create')
    } catch (error) {
      console.error(error)
    }
  }, [code])

  return null
}