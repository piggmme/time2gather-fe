import { useState, useEffect } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { meetings } from '../../services/meetings'
import styles from './LocationVoteSection.module.scss'

type LocationInfo = {
  id: number
  name: string
  displayOrder: number
  voteCount: number
  percentage: string
  voters: { userId: number, username: string, profileImageUrl: string }[]
}

type LocationVoteSectionProps = {
  meetingCode: string
  locations: LocationInfo[]
  confirmedLocation: LocationInfo | null
  onSelectionsChange: (selectedIds: number[]) => void
  onStatusChange: (status: LocationSelectionStatus) => void
  initialSelectedIds?: number[]
}

export type LocationSelectionStatus = 'loading' | 'ready' | 'error'

export default function LocationVoteSection ({
  meetingCode,
  locations,
  confirmedLocation,
  onSelectionsChange,
  onStatusChange,
  initialSelectedIds = [],
}: LocationVoteSectionProps) {
  const { t } = useTranslation()
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>(initialSelectedIds)
  const [status, setStatus] = useState<LocationSelectionStatus>('loading')
  const [loadAttempt, setLoadAttempt] = useState(0)

  // 내 장소 선택 불러오기
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    onStatusChange('loading')

    const fetchMySelections = async () => {
      try {
        const response = await meetings.$meetingCode.locationSelections.get(meetingCode)
        if (cancelled) return
        if (!response.success || !Array.isArray(response.data.locationIds)) throw new Error('Invalid location selection response')
        setSelectedLocationIds(response.data.locationIds)
        onSelectionsChange(response.data.locationIds)
        setStatus('ready')
        onStatusChange('ready')
      } catch (error) {
        console.error('Failed to fetch location selections:', error)
        if (!cancelled) {
          setStatus('error')
          onStatusChange('error')
        }
      }
    }
    fetchMySelections()

    return () => {
      cancelled = true
    }
  }, [loadAttempt, meetingCode, onSelectionsChange, onStatusChange])

  const handleToggleLocation = (locationId: number) => {
    const newSelectedIds = selectedLocationIds.includes(locationId)
      ? selectedLocationIds.filter(id => id !== locationId)
      : [...selectedLocationIds, locationId]

    setSelectedLocationIds(newSelectedIds)
    onSelectionsChange(newSelectedIds)
  }

  const handleRetry = () => {
    setStatus('loading')
    onStatusChange('loading')
    setLoadAttempt(attempt => attempt + 1)
  }

  const sortedLocations = [...locations].sort((a, b) => a.displayOrder - b.displayOrder)

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.loading')}</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={styles.container}>
        <div className={styles.errorState} role='alert'>
          <span>{t('locationVote.loadError')}</span>
          <button type='button' onClick={handleRetry}>
            {t('locationVote.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{t('locationVote.title')}</h3>
      <p className={styles.description}>{t('locationVote.description')}</p>

      {confirmedLocation && (
        <div className={styles.confirmedBanner}>
          {t('locationVote.confirmedLocation')}: <strong>{confirmedLocation.name}</strong>
        </div>
      )}

      <div className={styles.locationList}>
        {sortedLocations.map((location) => {
          const isSelected = selectedLocationIds.includes(location.id)
          const isConfirmed = confirmedLocation?.id === location.id

          return (
            <label
              key={location.id}
              className={`${styles.locationItem} ${isSelected ? styles.selected : ''} ${isConfirmed ? styles.confirmed : ''}`}
            >
              <input
                type='checkbox'
                checked={isSelected}
                onChange={() => handleToggleLocation(location.id)}
                className={styles.checkbox}
              />
              <div className={styles.locationInfo}>
                <span className={styles.locationName}>
                  {location.name}
                  {isConfirmed && <span className={styles.confirmedBadge}>{t('locationVote.confirmed')}</span>}
                </span>
                <span className={styles.voteInfo}>
                  {t('meeting.result.voteCount', {
                    count: location.voteCount,
                    percentage: location.percentage,
                  })}
                </span>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
