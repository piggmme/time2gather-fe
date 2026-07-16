# Feature: UI polish and responsive interaction pass

## Overview

Improve the app's shared layout, typography, cards, controls, and step navigation so Korean and English content reads naturally and interactive elements remain clear on mobile and desktop.

## Acceptance Criteria

- [x] Home hero title and description avoid orphaned short final lines from 320px through 1440px.
- [x] Home uses the maintained brand SVG and remains scroll-safe on short mobile viewports.
- [x] Meeting type cards have balanced internal spacing, a clear selected state, and no clipped or crowded label.
- [x] Previous and next actions both look like buttons, use a clear secondary/primary hierarchy, and avoid decorative arrow glyphs.
- [x] Shared buttons keep at least a 44px target, readable horizontal padding, clear focus, hover, active, and disabled states.
- [x] Desktop navigation no longer overlaps content at 700–1024px and its icon targets remain at least 44px.
- [x] Calendar month controls and selectable calendar/time cells are keyboard-visible and have practical touch targets where layout allows.
- [x] Existing create-flow parameters, including `meetingType` when navigating back from time range, are preserved.
- [x] CI and Docker use the repository-pinned pnpm version that is compatible with Node 20 instead of resolving `pnpm@latest`.
- [x] No horizontal overflow or clipped labels at 320, 390, 768, 1024, and 1440px.
- [x] Available dates, unavailable dates, today, and selected dates remain visually distinct across single- and multi-month votes.
- [x] Authenticated and anonymous all-day votes reveal participants on date click, and anonymous date/time flows save location votes safely.
- [x] Kakao and Open Graph previews use the new 1200x630 Time2Gather brand share image.

## Test Cases

- [x] At 320px and 390px, home copy wraps by meaningful Korean word groups without a one-word orphan.
- [x] At 768px and 1024px, main content begins outside the desktop navigation rail.
- [x] Meeting type labels fit in Korean and English and selection is exposed through `aria-pressed`.
- [x] Back and next buttons remain visible and usable when next is disabled, without decorative pseudo-element arrows.
- [x] Month navigation controls expose accessible labels and a minimum 44px target.
- [x] Time-range Back returns to Dates with `meetingType=TIME` intact.
- [x] Corepack resolves pnpm 10.23.0 from `package.json`, frozen-lockfile install succeeds, and the production build completes on the Node 20-compatible toolchain.
- [x] Astro production build succeeds and changed files pass focused lint/type checks where the existing baseline allows.
- [x] Kakao payloads and home/meeting/result OG metadata reference the new PNG with explicit 1200x630 dimensions.

## Technical Approach

- Reuse the existing design tokens and SVG assets; add no dependencies.
- Fix shared `Button` variants and states first, then update create/select step actions.
- Replace conflicting fixed height/padding combinations in meeting cards with content-driven minimum sizing.
- Apply balanced wrapping and responsive max-widths to the home hero.
- Align the desktop rail width with the layout offset and enlarge navigation/calendar hit areas.
- Prefer semantic/ARIA improvements in touched interactive controls without redesigning business logic.
- Add a single `packageManager` pin for pnpm 10.23.0 and remove Docker's `pnpm@latest` override so CI and container builds share the same toolchain.
- Verify rendered screenshots and DOM overflow metrics at representative mobile and desktop widths.

## Dependencies

- Existing Astro, React, SCSS, and react-icons packages only.
- Deprecated `public/og-image.*` and `public/time2gather-icon.svg` assets are replaced by the maintained `favicon.svg` and `time2gather-share.png` assets.
