import { atom } from 'nanostores';

export type User = {
  userId: number;
  username: string;
  email: string;
  profileImageUrl: string;
  provider: 'kakao' | 'google';
  isNewUser: boolean;
};

export const $me = atom<User | null>(null);

