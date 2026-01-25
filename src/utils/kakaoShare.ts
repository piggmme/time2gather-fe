declare global {
  interface Window {
    Kakao: {
      isInitialized: () => boolean;
      init: (appKey: string) => void;
      Share: {
        sendDefault: (settings: KakaoShareSettings) => void;
      };
    };
  }
}

interface KakaoShareLink {
  webUrl: string;
  mobileWebUrl: string;
}

interface KakaoShareContent {
  title: string;
  description: string;
  imageUrl: string;
  link: KakaoShareLink;
}

interface KakaoShareButton {
  title: string;
  link: KakaoShareLink;
}

interface KakaoShareSettings {
  objectType: 'feed';
  content: KakaoShareContent;
  buttons: KakaoShareButton[];
}

export interface ShareToKakaoParams {
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
  buttonTitle?: string;
}

/**
 * 카카오톡으로 공유하기
 * @param params 공유할 콘텐츠 정보
 * @returns 공유 성공 여부
 */
export function shareToKakao(params: ShareToKakaoParams): boolean {
  const { title, description, imageUrl, url, buttonTitle = '투표하러 가기' } = params;

  if (typeof window === 'undefined') {
    console.warn('shareToKakao: window is undefined (SSR context)');
    return false;
  }

  const Kakao = window.Kakao;

  if (typeof Kakao === 'undefined') {
    console.warn('shareToKakao: Kakao SDK is not loaded');
    return false;
  }

  if (!Kakao.isInitialized()) {
    console.warn('shareToKakao: Kakao SDK is not initialized');
    return false;
  }

  const defaultImageUrl = `${window.location.origin}/og-image.png`;

  try {
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        imageUrl: imageUrl || defaultImageUrl,
        link: {
          webUrl: url,
          mobileWebUrl: url,
        },
      },
      buttons: [
        {
          title: buttonTitle,
          link: {
            webUrl: url,
            mobileWebUrl: url,
          },
        },
      ],
    });
    return true;
  } catch (error) {
    console.error('shareToKakao: Failed to share', error);
    return false;
  }
}

/**
 * 카카오 SDK 사용 가능 여부 확인
 * @returns SDK 사용 가능 여부
 */
export function isKakaoAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const Kakao = window.Kakao;
  return typeof Kakao !== 'undefined' && Kakao.isInitialized();
}
