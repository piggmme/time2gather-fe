import { Tabs as TabsRa } from 'radix-ui'
import type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps } from '@radix-ui/react-tabs'
import { useRef, useEffect, useCallback } from 'react'
import styles from './Tabs.module.scss'

const TabsRoot = (props: TabsProps) => <TabsRa.Root {...props} className={styles.Root} />
const TabsList = (props: TabsListProps) => <TabsRa.List {...props} className={styles.List} />

const TabsTrigger = (props: TabsTriggerProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null)

  const scrollIntoView = useCallback(() => {
    if (!triggerRef.current) return

    // 부모 List 요소 찾기
    let parent = triggerRef.current.parentElement
    let listElement: HTMLElement | null = null

    while (parent) {
      if (parent.classList.contains(styles.List)) {
        listElement = parent
        break
      }
      parent = parent.parentElement
    }

    if (!listElement) return

    const triggerElement = triggerRef.current
    const triggerRect = triggerElement.getBoundingClientRect()
    const listRect = listElement.getBoundingClientRect()

    // 탭이 리스트 영역 밖에 있는지 확인
    const isOutOfView
      = triggerRect.left < listRect.left
        || triggerRect.right > listRect.right

    if (isOutOfView) {
      // 탭을 보이도록 스크롤
      const triggerLeft = triggerElement.offsetLeft
      const triggerWidth = triggerElement.offsetWidth
      const listWidth = listElement.offsetWidth

      // 탭을 중앙으로 스크롤 (약간의 여백 포함)
      const targetScroll = triggerLeft - (listWidth / 2) + (triggerWidth / 2)

      listElement.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      })
    }
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // 원본 onClick 실행
    props.onClick?.(e)

    // 탭이 활성화된 후 스크롤 (약간의 지연)
    setTimeout(() => {
      scrollIntoView()
    }, 50)
  }

  // data-state가 active로 변경될 때도 스크롤 (value prop으로 변경된 경우 대응)
  useEffect(() => {
    const element = triggerRef.current
    if (!element) return

    const observer = new MutationObserver(() => {
      if (element.getAttribute('data-state') === 'active') {
        // 약간의 지연을 주어 DOM 업데이트 완료 대기
        setTimeout(() => {
          scrollIntoView()
        }, 50)
      }
    })

    observer.observe(element, {
      attributes: true,
      attributeFilter: ['data-state'],
    })

    return () => {
      observer.disconnect()
    }
  }, [scrollIntoView])

  return (
    <TabsRa.Trigger
      {...props}
      ref={triggerRef}
      onClick={handleClick}
      className={styles.Trigger}
    />
  )
}

const TabsContent = (props: TabsContentProps) => <TabsRa.Content {...props} className={styles.Content} />

export const Tabs = {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
}
