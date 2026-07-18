import { useStore } from '@nanostores/react'
import { $me } from '../stores/me'
import { useEffect } from 'react'
import { navigate } from 'astro:transitions/client'
import { $redirect } from '../stores/redirect'
import { getCurrentAuthRedirect } from '../utils/authRedirect'

export default function RequireAuth () {
  const me = useStore($me)
  const isLoading = me === undefined
  const isLoggedIn = me !== null && !isLoading && me.provider !== 'ANONYMOUS'

  useEffect(() => {
    if (!isLoggedIn && !isLoading) {
      const redirect = getCurrentAuthRedirect()
      $redirect.set(redirect)
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`)
    }
  }, [isLoggedIn, isLoading])

  return null
}
