# PalSU-iManage Upgrade Plan

## Goal

Modernize the application UI and UX while keeping the existing role-based inventory workflow intact. This plan includes design, interaction, and workflow improvements requested for the app.

## Phase 1: Branding and App Identity

- [x] Rename the app to `PalSU-iManage` everywhere it appears
- [x] Use the branding assets from the local `public/palsu-imanage/` folder as the primary source for logo and visual identity
- [x] Review the provided PalSU logo files and decide whether to remove the white background for better integration on dark/light surfaces
- [x] Use the `palsu-imanage-branding.png` in the app shell/nav/header when appropriate for a cleaner branded header
- [x] Create a modern app logo treatment that aligns with the provided branding style and can work as both a compact icon and a full wordmark
- [x] Match the visual style to the PalSU branding direction with a warm yellow/orange palette and a clean, modern type treatment
- [x] Update browser tab title and document metadata to show `PalSU-iManage`
- [x] Ensure brand text appears consistently across login, dashboard, layout, sidebar, header, and modal states
- [x] Add a modern branded splash/loading screen on initial app load
- [x] Keep the branding consistent across desktop and mobile layouts without breaking readability or contrast

## Phase 2: Design System and Visual Refresh

- [x] Apply a modern, uniform color palette with yellow/orange accents
- [x] Add a dark-mode toggle with consistent theme styling across all screens
- [x] Improve hierarchy and spacing across all pages and components
- [x] Standardize card, table, button, badge, modal, and form styling
- [x] Make the design more mobile-friendly for all layouts
- [x] Add skeleton/loading states for major page sections and list views
- [x] Add smooth transitions for page switching, menu open/close, modal open/close, and tab changes
- [x] Improve responsive behavior for desktop, tablet, and mobile views

## Phase 3: App Layout and Navigation

- [x] Add modern responsive sidebar / hamburger navigation behavior
- [x] Ensure the mobile navigation drawer background uses a warm orange-toned color close to the PalSU logo branding instead of a neutral or white background
- [x] Ensure menu animations and transitions work smoothly on all screen sizes
- [x] Apply consistent hierarchy in navigation, headers, and page actions
- [x] Remove equipment and supplies navigation from staff login views
- [x] Ensure dashboard navigation and route structure match role requirements
- [x] Add a consistent topbar/action area for profile, theme toggle, notifications, and logout

## Phase 4: Authentication and Account Creation

- [x] Add confirm password input during admin-managed account creation and password changes; public registration remains disabled
- [x] Improve login screen styling to match the new app theme
- [x] Add a branded loading or splash state during authentication checks
- [x] Keep role-based login flows consistent after UI changes

## Phase 5: Notifications System

- [x] Make notification items clickable and open the relevant detail or page
- [x] Create a dedicated notifications page that lists all notifications
- [x] Add pagination or infinite scrolling for notification history
- [x] On desktop, display notifications in a floating modal/dropdown
- [x] On mobile, open notifications as a full page view
- [x] Add opt-in notification sound behavior for new notifications
- [x] Deliver notification changes over authenticated per-user realtime channels, with polling as a fallback
- [x] Ensure unread/read state styling is clear and modern
- [x] Keep notification access consistent across roles

## Phase 6: Request Workflows

- [x] Allow users to select multiple equipment items before finalizing a request
- [x] Allow users to select multiple supply items before finalizing a request
- [x] Improve final request summary and confirmation flow before submit
- [x] Ensure request creation works with multi-item selection in both frontend and backend validation
- [x] Update request details UI to show item breakdown clearly

## Phase 7: Approval, Release, and Return Flow

- [x] Add confirmation dialogs before approval, decline, release, return, edit, add, and logout actions
- [x] Add visual confirmation feedback after successful actions
- [x] Show who approved a request in request details and transaction reporting
- [x] Show who released the item in request details and transaction reporting
- [x] Add the release and return feature for admin users as well as staff users when appropriate
- [x] Ensure role access stays aligned with business rules

## Phase 8: Reports and Request Details

- [x] Update request details screens to display approver and releaser information
- [x] Improve transaction report presentation with clear actor attribution
- [x] Review all report sections for readability and consistent styling
- [x] Ensure report data is accurate with the new actor metadata

## Phase 9: UX and Accessibility Improvements

- [x] Add focus states for buttons, inputs, links, and menus
- [x] Improve keyboard navigation and accessibility labels
- [x] Ensure all modals and drawers are usable on touch devices
- [x] Keep transitions subtle and consistent, not distracting
- [x] Provide clear visual hierarchy for primary vs secondary actions

## Phase 10: Validation and QA

- [x] Verify responsive behavior across mobile, tablet, and desktop
- [x] Test dark mode across all major pages
- [x] Test all request flows with multi-item selection
- [x] Test notifications modal/page behavior and sound triggers
- [x] Validate all confirmation dialogs and user actions
- [x] Verify role restrictions after UI and nav adjustments
- [x] Run frontend lint/build checks after implementation
- [x] Run relevant backend tests if API contracts or workflow endpoints change

## Implementation Notes

- Keep feature changes scoped to the existing layered architecture.
- Respect the repo split between Laravel API and React SPA.
- Reuse shared UI primitives and feature APIs instead of creating disconnected custom logic.
- If a change impacts a workflow or API contract, update both frontend and backend together.
- Keep the design consistent with the PalSU-iManage brand and the requested warm yellow/orange theme.

## Suggested Implementation Order

1. Branding, theme, dark mode, and app shell refresh
2. Responsive nav, loading states, and route transitions
3. Notifications system and sound behavior
4. Multi-item request selection and request summary updates
5. Approval/release/return confirmation and actor metadata
6. Report and request detail improvements
7. Final QA and validation
