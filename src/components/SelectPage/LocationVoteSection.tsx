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
  voters: { userId: number; username: string; profileImageUrl: string }[]
}

type LocationVoteSectionProps = {
  meetingCode: string
  locations: LocationInfo[]
  confirmedLocation: LocationInfo | null
  onSelectionsChange: (selectedIds: number[]) => void
  initialSelectedIds?: number[]
}

export default function LocationVoteSection({
  meetingCode,
  locations,
  confirmedLocation,
  onSelectionsChange,
  initialSelectedIds = [],
}: LocationVoteSectionProps) {
  const { t } = useTranslation()
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>(initialSelectedIds)
  const [isLoading, setIsLoading] = useState(true)

  // 내 장소 선택 불러오기
  useEffect(() => {
    const fetchMySelections = async () => {
      try {
        const response = await meetings.$meetingCode.locationSelections.get(meetingCode)
        if (response.success && response.data.selectedLocationIds) {
          setSelectedLocationIds(response.data.selectedLocationIds)
          onSelectionsChange(response.data.selectedLocationIds)
        }
      } catch (error) {
        console.error('Failed to fetch location selections:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMySelections()
  }, [meetingCode])

  const handleToggleLocation = (locationId: number) => {
    const newSelectedIds = selectedLocationIds.includes(locationId)
      ? selectedLocationIds.filter(id => id !== locationId)
      : [...selectedLocationIds, locationId]
    
    setSelectedLocationIds(newSelectedIds)
    onSelectionsChange(newSelectedIds)
  }

  const sortedLocations = [...locations].sort((a, b) => a.displayOrder - b.displayOrder)

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('common.loading') || 'Loading...'}</div>
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
                type="checkbox"
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
                  {location.voteCount}{t('meeting.result.people')} ({location.percentage})
                </span>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}
