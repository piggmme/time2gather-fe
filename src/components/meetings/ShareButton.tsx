import { VisuallyHidden } from "radix-ui";
import { useTranslation } from "../../hooks/useTranslation";
import { Share2Icon } from "@radix-ui/react-icons";
import styles from './ShareButton.module.scss';
import { showDefaultToast } from "../../stores/toast";

export default function ShareButton() {
  const { t } = useTranslation();

  return (
    <button
      className={styles.shareButton}
      onClick={() => {
        navigator.clipboard.writeText(window.location.href);
        showDefaultToast({
          message: t('meeting.shareSuccess'),
          duration: 3000,
        });
      }}
    >
      <VisuallyHidden.Root>
        {t('meeting.shareMeeting')}
      </VisuallyHidden.Root>
      <Share2Icon width={27} height={27} />
      <span className={styles.shareButtonText}>
        {t('common.share')}
      </span>
    </button>
  )
}