import { useAsync, useSearchParam } from 'react-use'
import { auth } from '../../services/auth'
import { navigate } from 'astro:transitions/client'

export default function Oauth () {
  const code = useSearchParam('code')

  useAsync(async () => {
    if (!code) return

    const response = await auth.oauth.$provider.post('kakao', {
      authorizationCode: code,
      ...(
        import.meta.env.DEV
        ?
          {
            redirectUrl: 'http://localhost:3000/login/oauth2/code/kakao'
          }
        : null
      )
    })

    navigate('/meetings/create')
  }, [code])

  return null
}