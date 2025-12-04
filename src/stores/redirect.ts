import { persistentAtom } from '@nanostores/persistent'

export const $redirect = persistentAtom<string>(
  'redirect',
  '',
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);