import { atom, onMount, task } from 'nanostores';
import { auth } from '../services/auth';

export type User = {
  userId: number;
  username: string;
  email: string;
  profileImageUrl: string;
  provider: 'kakao' | 'google';
  createdAt?: string;
};

export const $me = atom<User | null>(null);

onMount($me, () => {
  task(async () => {
    const response = await auth.me.get();
    $me.set(response.data);
  })
});