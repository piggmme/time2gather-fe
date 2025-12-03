import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * 드래그 중일 때 스크롤을 방지하는 커스텀 훅
 * @param isDragging - 드래그 중인지 여부
 * @param containerRef - 드래그 컨테이너의 ref
 */
export function useDragScrollPrevention<T extends HTMLElement = HTMLElement>(
  isDragging: boolean,
  containerRef: RefObject<T | null>
) {
  useEffect(() => {
    if (!isDragging) return;

    // 드래그 중일 때 body 스크롤 방지
    const originalBodyOverflow = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    // 부모 스크롤 컨테이너 찾기 및 스크롤 방지
    const scrollContainers: Array<{ element: HTMLElement; originalOverflow: string }> = [];

    if (containerRef.current) {
      let parent = containerRef.current.parentElement;
      while (parent) {
        const computedStyle = window.getComputedStyle(parent);
        if (
          computedStyle.overflow === "auto" ||
          computedStyle.overflow === "scroll" ||
          computedStyle.overflowY === "auto" ||
          computedStyle.overflowY === "scroll" ||
          computedStyle.overflowX === "auto" ||
          computedStyle.overflowX === "scroll"
        ) {
          scrollContainers.push({
            element: parent,
            originalOverflow: parent.style.overflow || "",
          });
          parent.style.overflow = "hidden";
        }
        parent = parent.parentElement;
      }
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      scrollContainers.forEach(({ element, originalOverflow }) => {
        element.style.overflow = originalOverflow;
      });
    };
  }, [isDragging, containerRef]);
}

