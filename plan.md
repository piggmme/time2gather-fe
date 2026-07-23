# Feature: Time2Gather Admin Dashboard

## Overview

Add a server-enforced `ADMIN` role and a responsive admin dashboard that shows user and meeting status, summary counts, and simple paginated search.

## Acceptance Criteria

- [x] Persist `USER` and `ADMIN` roles on users; migrate every existing user to `USER` by default.
- [x] Include the role in JWT authentication, OAuth responses, and `/api/v1/auth/me`.
- [x] Return `401` for unauthenticated admin API requests and `403` for authenticated non-admin users.
- [x] Expose an admin summary with total/registered/anonymous/admin user counts and total/active/confirmed meeting counts.
- [x] Expose paginated user search by username or email with bounded page size.
- [x] Expose paginated meeting search by title or meeting code, including host information.
- [x] Add a noindex `/admin` page that redirects signed-out users to login and shows access denied to non-admin users.
- [x] Show the admin navigation item only to users with the `ADMIN` role.
- [x] Present responsive summary cards, searchable user/meeting panels, loading, empty, error, and pagination states in Korean and English.
- [x] Do not add destructive admin actions or role-management UI in this first version.
- [x] Keep the pending Korean login label fix separate from the admin feature.

## Test Cases (TDD)

### Backend

- [x] Existing and newly created users default to `USER`.
- [x] JWT preserves an `ADMIN` role and treats role-less legacy tokens as `USER`.
- [x] Admin endpoints reject unauthenticated and normal users.
- [x] Admin endpoints return summary counts for an admin user.
- [x] User search matches username/email and respects page-size bounds.
- [x] Meeting search matches title/code and returns host information.
- [x] Empty search results return a valid empty page.

### Frontend

- [x] Signed-out `/admin` access uses the existing validated return-to-action flow.
- [x] A normal user sees access denied and no admin data.
- [x] An admin receives localized counts, users, meetings, search, and pagination UI.
- [x] Korean and English admin locale trees have no mixed or missing keys.
- [ ] 390px and desktop browser screenshots/DOM overflow metrics (browser runtime unavailable; responsive CSS and production build verified).

## Technical Approach

### Backend (`time2gather-be`)

- Add a Flyway migration for `users.role VARCHAR(20) NOT NULL DEFAULT 'USER'`.
- Add `UserRole`, expose role in auth DTOs, and add a signed JWT role claim with a legacy-token fallback to `USER`.
- Give `JwtAuthentication` and `CustomUserPrincipal` Spring Security authorities.
- Protect `/api/v1/admin/**` with `hasRole('ADMIN')` before controller execution.
- Add read-only admin summary, user search, and meeting search services/controllers with `page >= 0` and `1 <= size <= 50`.
- Reuse Spring Data paging and parameterized derived queries; add no dependencies.

### Frontend (`time2gather-fe`)

- Extend the current-user type with `role`.
- Add a small admin API service and a client-side admin access gate.
- Add `/admin`, a responsive dashboard component, module styles, localized copy, and an admin-only header item.
- Keep the backend as the security boundary; frontend checks only prevent confusing navigation and unnecessary requests.

## Dependencies

- Existing Spring Security, Spring Data JPA, Flyway, Astro, React, Axios, and Radix Icons only.
- One existing user ID or email must be explicitly selected for promotion after the role migration.

## Verification

- Backend: targeted authorization/service/controller tests, full Gradle test and build.
- Frontend: locale parity, TypeScript, focused ESLint, production build, mocked admin API browser tests, mobile/desktop screenshots and DOM overflow metrics.
- Security: verify `401/403/200` boundaries directly against admin endpoints.

## Open Decision

- Which existing user should receive `ADMIN`: provide a user ID or login email. Recommendation: perform one explicit database update after deployment; do not hardcode personal email in a migration or source file.
