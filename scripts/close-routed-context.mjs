export async function closeRoutedContext (context) {
  // Call after assertions: the browser can have cancelled an in-flight request
  // before its proxy callback finishes. Errors during the scenario still fail.
  await context.unrouteAll({ behavior: 'ignoreErrors' })
  await context.close()
}
