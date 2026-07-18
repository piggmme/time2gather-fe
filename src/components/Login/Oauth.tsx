import { useAsync, useSearchParam } from 'react-use'
import { auth } from '../../services/auth'
import { navigate } from 'astro:transitions/client'
import { $me } from '../../stores/me'
import { $redirect } from '../../stores/redirect'
import { getAuthRedirectOrDefault } from '../../utils/authRedirect'

export default function Oauth () {
  const code = useSearchParam('code')

  useAsync(async () => {
    if (!code) return

    $me.set(undefined)
    try {
      await auth.oauth.$provider.post('kakao', {
        authorizationCode: code,
        redirectUrl: import.meta.env.DEV
          ? 'https://localhost:3000/login/oauth2/code/kakao'
          : 'https://time2gather.org/login/oauth2/code/kakao',
      })
      const response = await auth.me.get()
      if (response.data) {
        $me.set(response.data)
      }
      const redirect = getAuthRedirectOrDefault($redirect.get())
      $redirect.set('')
      navigate(redirect)
    } catch (error) {
      console.error(error)
    }
  }, [code])

  return null
}
