import { useSensor, useSensors, PointerSensor, TouchSensor } from "@dnd-kit/core";

/**
 * 모바일과 데스크톱 모두에서 작동하는 드래그 센서를 생성하는 커스텀 훅
 * 
 * Google Calendar 방식 적용:
 * - 데스크톱: 8px 이동 시 드래그 시작
 * - 모바일: 300ms long-press 후 드래그 시작 (스크롤과 구분)
 */
export function useDragSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 시 드래그 활성화
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms long-press 후 드래그 활성화
        tolerance: 8, // long-press 중 8px까지 이동 허용
      },
    })
  );
}

