// Delegation keeps native header menus usable after Astro page transitions.
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Node)) return
  document.querySelectorAll<HTMLDetailsElement>('.t2g-site-header details[open]').forEach((menu) => {
    if (!menu.contains(event.target as Node)) menu.open = false
  })
})
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return
  document.querySelectorAll<HTMLDetailsElement>('.t2g-site-header details[open]').forEach((menu) => {
    menu.open = false
    menu.querySelector<HTMLElement>('summary')?.focus()
  })
})
