import api from '../utils/api';
import type { success_response, error_response } from "./type";


type post_auth_oauth_$provider_body = {
  authorizationCode: string;
  redirectUrl?: string;
}
type post_auth_oauth_$provider_response = success_response<{
  userId: number;
  username: string;
  email: string;
  profileImageUrl: string;
  provider: 'kakao' | 'google';
  isNewUser: boolean;
}>
const post_auth_oauth_$provider = async (provider: 'kakao' | 'google', body: post_auth_oauth_$provider_body) => {
  const response = await api.post<post_auth_oauth_$provider_response>(
    `v1/auth/oauth/${provider}`,
    body
  );
  return response.data;
};

export const auth = {
  oauth: {
    $provider: {
      post: post_auth_oauth_$provider,
    },
  }
}
