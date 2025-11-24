import api from '../utils/api';

const post_auth_oauth_$provider = async (provider: 'kakao' | 'google', authorizationCode: string) => {
  const response = await api.post(`/auth/oauth/${provider}`, { authorizationCode });
  return response.data;
};

export const auth = {
  oauth: {
    $provider: {
      post: post_auth_oauth_$provider,
    },
  }
}
