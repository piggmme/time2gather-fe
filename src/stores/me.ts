import { atom, onMount, task } from 'nanostores';
import { auth, type Meeting } from '../services/auth';

export type User = {
  userId: number;
  username: string;
  email: string;
  profileImageUrl: string;
  provider: 'kakao' | 'google';
  createdAt?: string;
  createdMeetings?: Meeting[];
  participatedMeetings?: Meeting[];
};

export const $me = atom<User | null | undefined>(undefined);

onMount($me, () => {
  task(async () => {
    try {
      const response = await auth.me.get();
      $me.set(response.data || null);
    } catch (error) {
      $me.set(null);
    }
  })
});