import { createNavigationFixture } from './navigation-fixture.mjs'

// Disposable local API for creation and legacy/hourly vote regression checks.
const fixture = createNavigationFixture({
  transformMeeting (data, code) {
    const times = code === 'half-time' ? ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'] : ['09:00', '10:00', '11:00']
    data.meeting.intervalMinutes = code === 'half-time' ? 30 : 60
    data.meeting.availableDates = Object.fromEntries(['2026-11-15', '2026-11-16'].map(date => [date, times]))
    data.schedule = {}
    data.participants = []
    data.summary = { totalParticipants: 0, bestSlots: [] }
    return data
  },
})
fixture.server.listen(18485, '127.0.0.1')
