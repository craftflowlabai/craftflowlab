# Phase 1 — Authentication and Profiles

## Scope

Create a profile page shared by signed-in users of every role (`user`, `client`, or `admin`). Add a profile entry to the account dropdown on the root page. Keep the existing logout behavior unchanged.

## User flow

1. On the root page, show a profile button in place of the dashboard button.
2. Show the user's profile picture when available; otherwise show the app's existing profile placeholder.
3. Clicking the button opens a dropdown containing **Profile** and **Log Out**.
4. **Profile** links to the profile page. **Log Out** continues to use the current working logout action without changes.
5. The profile page is available to any authenticated role and displays the signed-in user's own profile details.
6. Users without a valid session are redirected to the existing login flow.

## Profile page requirements

- Use the existing application layout, navigation, typography, colors, and shared UI components.
- Provide a dedicated page rather than a modal.
- Load profile data for the current authenticated user only.
- Display the user's name and email, plus any profile fields already supported by the application.
- If profile editing already exists in the data model, allow edits only to fields the current user is allowed to change. Do not allow users to edit their role or account status.
- Use the existing avatar when present; otherwise use the same placeholder shown by the root-page profile button.
- Show the app's existing loading, validation, and error feedback patterns.
- Keep the page behavior consistent across all roles; role-specific dashboard access remains unchanged.

## Acceptance checklist

- [ ] Root page shows a profile button instead of the dashboard button.
- [ ] The button shows the current user's picture or the existing placeholder.
- [ ] Clicking the button opens a dropdown with **Profile** and **Log Out**.
- [ ] Selecting **Profile** navigates to the profile page.
- [ ] Selecting **Log Out** still invokes the existing logout behavior; logout code and behavior are not changed.
- [ ] Signed-in users with each supported role can open their own profile page.
- [ ] A user cannot view or edit another user's profile by changing a URL or request parameter.
- [ ] A user cannot change their own role or account status from the profile page.
- [ ] Missing profile pictures use the existing placeholder consistently in both locations.
- [ ] Loading, save, validation, and error states follow existing application patterns.
- [ ] The profile page follows the current landing-page brand and responsive layout.

## Implementation checklist

- [ ] Locate the existing root-page account/dashboard button and identify its current auth and logout handlers.
- [ ] Replace only the dashboard button presentation with the profile dropdown; preserve the existing logout handler.
- [ ] Add or update the shared profile/avatar component if the app already has one.
- [ ] Add a dedicated profile route and page using the existing router and page layout.
- [ ] Fetch the current user's profile through the app's existing data-access layer and authorization rules.
- [ ] Reuse existing profile fields and avatar storage behavior; do not add unrelated profile features.
- [ ] Verify the dropdown link, role-independent page access, and unchanged logout flow.

## Out of scope

- Changes to logout implementation or authentication providers.
- Changes to roles, role assignment, account moderation, dashboards, booking workflows, or session management.
- New profile fields or storage policies unless the existing app requires a minimal change to display its current profile/avatar data.
