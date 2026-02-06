# User Flow Scenarios for Verification

**Date:** 2026-02-05
**Focus:** UI/UX Flow Verification (Phase 1 & Onboarding)
**Target URL:** http://localhost:3000

## Scenario 1: New User Onboarding Experience (The "Aha" Path)
**Objective:** Verify the new 5-step onboarding flow and emotional hook.
**Actor:** New User (Visitor)
**Steps:**
1.  Navigate to `/onboarding`.
2.  **Step 1 (Problem)**: Select 1 or more "Problem" cards. Verify "Empathy Message" appears. Click Next.
3.  **Step 2 (Trust)**: View the "Trust Building" screen (Founder story, Stats animation, Review slider). Verify animations play. Click Next.
4.  **Step 3 (Guide)**: View "Action Guide" (3-step plan). Verify Progress Bar.
5.  **Completion**: Click "Start" (Should redirect to Signup or Home).

## Scenario 2: Main Home & Visualization (The "Atmosphere" Path)
**Objective:** Verify the Bento Grid layout, Theme switching, and "One-Page" experience.
**Actor:** Visitor/User
**Steps:**
1.  Navigate to `/`.
2.  **Animation**: Observe "Staggered Reveal" of meeting cards (Cards should popp in sequentially).
3.  **Theme Switch**: Locate Theme Toggle (Sidebar or Header). Switch between **Electric** and **Warm** modes.
    -   *Check*: Background color, Fonts (Sans vs Serif), Accent colors change.
4.  **Meeting Details**: Click on any Meeting Card.
    -   *Check*: **Bottom Sheet** opens (no page reload).
    -   *Check*: Meeting info (Date, Map, Kong Fee) is visible.
    -   *Check*: **Sticky CTA** button is at the bottom.

## Scenario 3: Landing Page (The "Hook" Path)
**Objective:** Verify the marketing landing page structure.
**Actor:** Visitor
**Steps:**
1.  Navigate to `/about`.
2.  **Scroll**: Scroll down to see sections (Hero, Gallery, Reviews).
3.  **Review**: Check if the "Anonymous Reviews" slider is working.

## Scenario 4: Ticket/Wallet (Visual Check)
**Objective:** Verify the Ticket UI components (Commitment Ritual).
**Actor:** User
**Steps:**
1.  Navigate to `/mypage/tickets` (Might require login, if so, skip or try direct component view if possible).
    -   *Alternative*: Check `/mockup` if available for UI components.

## Success Criteria
-   No visual crashes (Error boundaries).
-   Animations (Framer Motion) play smoothly.
-   Theme toggling is instant and correct.
-   Bottom Sheet interactions feels "physical" (Spring).
