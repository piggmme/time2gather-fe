// Firebase web configuration is public. It grants no access to Firestore data.
const firebaseConfig = {
  apiKey: 'AIzaSyBw9-tItrPW8vobs3ibiMRIyGULxGHgINg',
  appId: '1:979736882063:web:74238f35e590e30726f9fa',
  projectId: 'time2gather-prod-2026',
}

const productionHosts = new Set([
  'time2gather.org',
  'www.time2gather.org',
  'time2gather-prod-2026.web.app',
  'time2gather-prod-2026.firebaseapp.com',
])

let initialization: Promise<void> | undefined

export function startPerformanceMonitoring (): Promise<void> {
  // Keep SSR, local development and preview traffic out of production metrics.
  if (!import.meta.env.PROD || typeof window === 'undefined'
    || !productionHosts.has(window.location.hostname)) {
    return Promise.resolve()
  }

  // Astro's ClientRouter can revisit the layout without a full document load.
  initialization ??= Promise.all([
    import('firebase/app'),
    import('firebase/performance'),
    import('firebase/installations'),
  ]).then(async ([
    { getApp, getApps, initializeApp },
    { getPerformance },
    { getInstallations, getToken },
  ]) => {
    const app = getApps().some(app => app.name === '[DEFAULT]')
      ? getApp()
      : initializeApp(firebaseConfig)
    // Wait for installation registration so blocked requests are caught here,
    // before Performance starts its background initialization.
    await getToken(getInstallations(app))
    getPerformance(app)
  }).catch(() => {
    // Monitoring is optional; unsupported storage or blocked SDKs must not break the app.
    console.warn('[Performance] Monitoring could not be initialized')
  })

  return initialization
}
