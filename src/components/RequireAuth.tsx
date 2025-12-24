import { useStore } from '@nanostores/react'
import { $me } from '../stores/me'
import { useEffect } from 'react'
import { navigate } from 'astro:transitions/client'
import { $redirect } from '../stores/redirect'
import { useLocation } from 'react-use'

export default function RequireAuth () {
  const location = useLocation()
  const me = useStore($me)
  const isLoading = me === undefined
  const isLoggedIn = me !== null && !isLoading && me.provider !== 'ANONYMOUS'

  useEffect(() => {
    if (!isLoggedIn && !isLoading) {
      navigate('/login')
      if (location.pathname) $redirect.set(location.pathname)
    }
  }, [location.pathname, isLoggedIn, isLoading])

  return null
}
