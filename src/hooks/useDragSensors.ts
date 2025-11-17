import { useSensor, useSensors, PointerSensor, TouchSensor } from "@dnd-kit/core";

/**
 * 모바일과 데스크톱 모두에서 작동하는 드래그 센서를 생성하는 커스텀 훅
 */
export function useDragSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );
}

