# Sidebar language selector — 2026-10-25

The 80px desktop navigation rail used a 72px native select with a separate globe above it. It competed with the icon-only navigation and could extend into the rail padding. The desktop control now uses a 48×48 globe trigger matching the other actions. A Radix Select portal opens beside the rail, highlights the current language, supports scrolling/typeahead/keyboard input, and respects RTL direction and viewport collisions. The existing mobile drawer keeps its native language selector.

Validation:
- 22 locales at 700×480, 1024×768, 1280×844 (66 menu states): all menus within the viewport; all 22 options present; trigger consistently 48×48; no horizontal page overflow.
- Actual Korean→English selection preserved an unfinished meeting title. Escape dismissal and Home/Enter keyboard selection exercised.
- Mobile drawer language change to Arabic checked at 390×844; drawer and native selector follow RTL direction.
- Production build, installed TypeScript no-emit, focused Header ESLint, catalog/globalization regressions and whitespace check passed.
- Local development origin has no API proxy; its anonymous-user request produces an expected local error toast. Production verification is performed separately with the real same-origin API.

Released: Cloud Build `75bee583-4a31-441c-94d1-ed5211bd120a`, image `web:language-rail-20261025-1752`, web revision `time2gather-web-00068-nol`, 100% traffic, Firebase Hosting release complete. Live Korean menu rendered correctly; selecting English updated the page and URL. No browser console errors or new-revision 5xx responses observed. Local server stopped. Production evidence: `screenshots/language-rail-production-open.jpg`.
