import { useEffect } from 'react'
import { useSearchParam } from 'react-use'
import { $redirect } from '../../stores/redirect'
import { getSafeAuthRedirect } from '../../utils/authRedirect'

export default function LoginRedirect () {
  const redirect = useSearchParam('redirect')

  useEffect(() => {
    $redirect.set(getSafeAuthRedirect(redirect) ?? '')
  }, [redirect])

  return null
}
