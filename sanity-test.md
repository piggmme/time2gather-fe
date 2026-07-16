# Sanity Test: UI polish and responsive interaction pass

## Automated checks

- [x] `pnpm exec tsc --noEmit`
- [x] Focused ESLint on changed TypeScript/TSX files
- [x] `pnpm build`
- [x] Fresh Node 20.20.2 + Corepack install resolves pnpm 10.23.0
- [x] Fresh `corepack pnpm install --frozen-lockfile`
- [x] Fresh Node 20 production build
- [x] `git diff --check`

## Visual checks

- [x] Home at 320, 390, 768, 1024, and 1440px
- [x] Meeting type step at 320, 390, 768, 1024, and 1440px
- [x] Title step at 320, 390, 768, 1024, and 1440px
- [x] No horizontal overflow at any verified width
- [x] Mobile meeting cards render at 112px minimum height
- [x] Desktop meeting cards render at 148px minimum height
- [x] Previous and next buttons remain visually distinct when next is disabled
- [x] Previous and next buttons render without decorative pseudo-element arrows
- [x] Desktop home title remains on one line from 1024px
- [x] Date availability, multi-month discovery, participant details, and location voting fit at verified mobile/desktop widths
- [x] The 1200x630 share card remains legible in a 390px Kakao-style preview

## Interaction and accessibility checks

- [x] Meeting type cards expose `aria-pressed`
- [x] Calendar month controls have 44px targets and localized accessible names
- [x] Calendar and time cells are semantic buttons with visible keyboard focus
- [x] View-mode time cells accept short mobile taps without intercepting scroll gestures
- [x] Time-range Back preserves the selected `meetingType`
- [x] Authenticated and anonymous date/time votes save the expected location IDs
- [x] Location loading blocks submit and load failure does not overwrite existing location selections
- [x] Kakao share payload contains the new image URL and explicit dimensions

## Notes

- The repository-wide lint baseline contains generated/pre-existing findings, so lint verification is scoped to changed TypeScript/TSX files.
- Docker image execution was not run because no local Docker daemon was available; the Dockerfile now uses the same package-manager pin proven in the fresh Node 20 build.
