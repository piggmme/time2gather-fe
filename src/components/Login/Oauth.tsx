import { useAsync, useSearchParam } from 'react-use'

export default function Oauth () {
  const code = useSearchParam('code')

  useAsync(async () => {
    if (!code) return

    console.log({code})
  }, [code])

  return null
}