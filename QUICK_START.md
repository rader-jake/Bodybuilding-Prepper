# Quick Start: Testing the MVP

## 1. Start the server & client

```bash
npm run dev
```

## 2. Register as Coach (Test Case 1: Bodybuilding)

- **Username**: `coach_bb`
- **Password**: `test123`
- **Role**: Coach
- → Redirected to `/onboarding/coach-industry`
- Select: **Bodybuilding**
- → Redirected to `/dashboard`

## 3. Create an Athlete

- **Athlete Name**: John Doe
- **Initial Password**: athlete123
- → Athlete created with `sport=bodybuilding`

## 4. Test Athlete Check-in (Normal State)

- **Sign out** from coach
- **Login as athlete**: `athlete` / `athlete123`
- **Navigate to** `/athlete/check-in`
- **Verify fields**: Weight, Posing Photos, Energy (1-5), Notes
  - NO squat/bench/deadlift fields (those would be for powerlifting)
  - NO swim/bike/run fields (those would be for endurance)

## 5. Test Payment Lockout

```bash
# In a terminal, set athlete payment to overdue:
curl -X PATCH http://localhost:5000/api/athletes/2/payment \
  -H "Authorization: Bearer [COACH_JWT_TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{"paymentStatus":"overdue"}'
```

- **Athlete tries** to access `/athlete/dashboard`
- → Shown `PaymentRequiredLockout` screen (red alert, "Update Payment Now" button)
- **All athlete routes blocked** until payment status is `active`

## 6. Test Multiple Industries (Coach 2)

- **Register new coach**: `coach_pl` / `test123`
- Select: **Powerlifting**
- Create athlete
- **Athlete sees**: Squat/Bench/Deadlift fields (NO posing photos)
- **Verify**: Each industry has distinct KPIs with zero cross-contamination

## Seed Users (Pre-loaded)

- **Coach**: `coach` / `coach` (coachIndustry=bodybuilding)
- **Athlete**: `athlete` / `athlete` (sport=bodybuilding, paymentStatus=active)

## Key Files to Review

- Schema changes: [shared/schema.ts](shared/schema.ts#L1)
- Coach onboarding: [client/src/pages/CoachOnboarding.tsx](client/src/pages/CoachOnboarding.tsx)
- Payment lockout: [client/src/pages/PaymentRequiredLockout.tsx](client/src/pages/PaymentRequiredLockout.tsx)
- Route protection: [client/src/App.tsx](client/src/App.tsx#L27)
- Templates logic: [client/src/lib/templates.ts](client/src/lib/templates.ts#L165)

## Important Notes

- **coachIndustry is immutable** after onboarding (by design)
- **Athletes inherit coach's industry** → `sport` field at creation time
- **No defaults or fallbacks** in dynamic schema derivation (templates.ts)
- **Payment status must be updated manually** for MVP (TODO: Stripe integration)
