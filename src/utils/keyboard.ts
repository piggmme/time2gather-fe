// A touch keyboard is dismissed by releasing the editable element's focus.
// Keep desktop Enter and Tab navigation unchanged.
export function dismissTouchKeyboard (input: HTMLInputElement) {
  if (window.matchMedia('(pointer: coarse)').matches) input.blur()
}
