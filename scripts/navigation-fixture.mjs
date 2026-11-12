import http from 'node:http'

// Local, in-memory API for navigation tests. No production requests or writes.
export function createNavigationFixture ({ transformMeeting = data => data } = {}) {
  const person = { userId: 1, username: 'Alex', profileImageUrl: '' }
  const dates = ['2026-11-15', '2026-11-16']
  const mutations = []
  const dataFor = (code) => {
    const time = code.includes('time')
    const times = time ? ['09:00', '10:00'] : ['ALL_DAY']
    return {
      meeting: {
        id: 1, code, title: 'Weekend gathering', description: 'Navigation preview', host: { id: 1, ...person }, timezone: 'Asia/Seoul', selectionType: time ? 'TIME' : 'ALL_DAY', intervalMinutes: 60, availableDates: Object.fromEntries(dates.map(date => [date, times])),
      },
      participants: [person], schedule: Object.fromEntries(dates.map(date => [date, Object.fromEntries(times.map(time => [time, { count: 1, participants: [person] }]))])),
      summary: {
        totalParticipants: 1, bestSlots: dates.map(date => ({
          date, time: times[0], startSlotIndex: time ? 9 : -1, endSlotIndex: time ? 9 : -1, count: 1, percentage: '100%', participants: [person],
        })),
      },
      locationVote: code.includes('location')
        ? {
            enabled: true, locations: ['Seoul', 'Busan'].map((name, i) => ({
              id: String(i), name, displayOrder: i, voteCount: 0, percentage: '0%', voters: [],
            })), confirmedLocation: null,
          }
        : null,
    }
  }
  const server = http.createServer(async (request, response) => {
    response.setHeader('Access-Control-Allow-Origin', request.headers.origin ?? '*')
    response.setHeader('Access-Control-Allow-Credentials', 'true')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept-Language')
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    if (request.method === 'OPTIONS') {
      response.end()
      return
    }
    const url = new URL(request.url, 'http://localhost')
    let body = ''
    for await (const chunk of request) body += chunk
    if (request.method !== 'GET') mutations.push({ path: url.pathname, body: body && JSON.parse(body) })
    const code = url.pathname.split('/')[4] ?? 'nav-day'
    let data = null
    if (url.pathname.endsWith('/auth/me')) data = {
      ...person, provider: 'ANONYMOUS', role: 'USER', createdMeetings: [], participatedMeetings: [],
    }
    else if (url.pathname.endsWith('/profile')) data = { username: person.username }
    else if (url.pathname.endsWith('/comments/summary')) data = { version: 1, count: 0, viewerId: '1', writable: true }
    else if (url.pathname.endsWith('/comments')) data = { items: [], nextCursor: null }
    else if (url.pathname.endsWith('/comments/people')) data = []
    else if (url.pathname.endsWith('/comments/activity')) data = []
    else if (url.pathname.endsWith('/location-selections')) data = { locationIds: [] }
    else if (url.pathname.endsWith('/selections')) data = { selections: Object.fromEntries(dates.map(date => [date, code.includes('time') ? ['09:00'] : ['ALL_DAY']])) }
    else if (/\/meetings\/[^/]+$/.test(url.pathname)) data = transformMeeting(dataFor(code), code)
    else if (url.pathname.endsWith('/meetings')) data = { meetingCode: 'nav-created' }
    response.setHeader('Content-Type', 'application/json')
    response.end(JSON.stringify({ success: true, data }))
  })
  return { server, mutations }
}

if (process.argv[1]?.endsWith('/navigation-fixture.mjs')) {
  createNavigationFixture().server.listen(18481, '127.0.0.1')
}
