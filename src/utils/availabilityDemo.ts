import type { AvailabilityDemoData } from '../marketing/availabilityDemo'

export function getDemoResults (people: AvailabilityDemoData['people'], selected: number[]) {
  const slots = Array.from({ length: 12 }, (_, slot) => {
    const available = people.filter(person => person.slots.includes(slot)).map(person => person.id as string)
    if (selected.includes(slot)) available.push('me')
    return { slot, available, count: available.length }
  })
  const maxCount = Math.max(...slots.map(slot => slot.count))
  const options: {
    key: number
    day: number
    start: number
    end: number
    available: string[]
  }[] = []
  for (let day = 0; day < 3; day++) {
    let current: (typeof options)[number] | undefined
    for (let row = 0; row < 4; row++) {
      const slot = slots[row * 3 + day]
      if (slot.count !== maxCount) {
        current = undefined
        continue
      }
      if (current && current.end === row - 1 && current.available.join('|') === slot.available.join('|')) current.end = row
      else {
        current = {
          key: slot.slot, day, start: row, end: row, available: slot.available,
        }
        options.push(current)
      }
    }
  }
  return { slots, maxCount, options }
}
