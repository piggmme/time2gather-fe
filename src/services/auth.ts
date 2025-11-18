import api from '../utils/api';

const post_auth_oauth_$provider = async (provider: 'kakao' | 'google') => {
  const response = await api.post(`/auth/oauth/${provider}`);
  return response.data;
};

export const auth = {
  oauth: {
    $provider: post_auth_oauth_$provider,
  }
}
