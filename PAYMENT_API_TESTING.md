# Testing Payment Status Endpoint

## Manual Payment Status Updates (For Testing)

### Get Current User & Extract JWT Token

```bash
# Login as coach
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "coach",
    "password": "coach"
  }'

# Response includes:
# {
#   "user": { "id": 1, "username": "coach", ... },
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
# }
```

### Set Athlete Payment Status

#### Set to "due_soon"

```bash
curl -X PATCH http://localhost:5000/api/athletes/2/payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentStatus": "due_soon"
  }'
```

#### Set to "overdue"

```bash
curl -X PATCH http://localhost:5000/api/athletes/2/payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentStatus": "overdue"
  }'
```

#### Set back to "active" (unlocked)

```bash
curl -X PATCH http://localhost:5000/api/athletes/2/payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentStatus": "active"
  }'
```

---

## Complete Test Flow (Bash Script)

```bash
#!/bin/bash

# 1. Login as coach
COACH_RESPONSE=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"coach","password":"coach"}')

echo "Coach Login Response:"
echo $COACH_RESPONSE | jq .

COACH_TOKEN=$(echo $COACH_RESPONSE | jq -r '.token')
ATHLETE_ID=2

# 2. Set athlete to "due_soon"
echo -e "\n\nSetting athlete to due_soon..."
curl -s -X PATCH http://localhost:5000/api/athletes/$ATHLETE_ID/payment \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentStatus":"due_soon"}' | jq .

# 3. Check athlete data
echo -e "\n\nChecking athlete data..."
curl -s -X GET http://localhost:5000/api/athletes \
  -H "Authorization: Bearer $COACH_TOKEN" | jq ".[1] | {id, username, paymentStatus}"

# 4. Login as athlete to verify lockout
ATHLETE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"athlete","password":"athlete"}')

echo -e "\n\nAthlete Login Response (paymentStatus should be due_soon):"
echo $ATHLETE_RESPONSE | jq '.user | {id, username, paymentStatus}'

# 5. Set athlete to "overdue"
echo -e "\n\nSetting athlete to overdue..."
curl -s -X PATCH http://localhost:5000/api/athletes/$ATHLETE_ID/payment \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentStatus":"overdue"}' | jq .

# 6. Set athlete back to "active"
echo -e "\n\nSetting athlete back to active..."
curl -s -X PATCH http://localhost:5000/api/athletes/$ATHLETE_ID/payment \
  -H "Authorization: Bearer $COACH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentStatus":"active"}' | jq .
```

---

## Expected Responses

### Success (200 OK)

```json
{
  "id": 2,
  "username": "athlete",
  "password": "...",
  "role": "athlete",
  "coachId": 1,
  "displayName": null,
  "avatarUrl": null,
  "bio": null,
  "timezone": null,
  "currentPhase": "off-season",
  "nextShowName": null,
  "nextShowDate": null,
  "workoutPlan": null,
  "mealPlan": null,
  "sport": "bodybuilding",
  "coachIndustry": null,
  "paymentStatus": "overdue"
}
```

### Unauthorized (403 Forbidden)

```json
// Returned if:
// 1. User is not a coach
// 2. Athlete does not belong to coach's roster
// 3. No valid JWT token
```

### Bad Request (400 Bad Request)

```json
{
  "message": "Invalid payment status"
}
```

---

## Frontend Flow Verification

### Step 1: Athlete Sees Lockout

1. Set athlete payment to "due_soon" or "overdue" via API
2. Athlete logs in
3. Redirected to `/athlete/dashboard`
4. **Expected**: `PaymentRequiredLockout` component renders instead of dashboard
5. **Text**: "Your subscription payment is [due soon|overdue]"
6. **Button**: "Review Subscription" (due_soon) or "Update Payment Now" (overdue)

### Step 2: Coach Sees Payment Badge

1. Coach logs in → `/dashboard`
2. **Expected**: Athlete card shows badge:
   - Orange "Due Soon" (if `paymentStatus=due_soon`)
   - Red "Overdue" (if `paymentStatus=overdue`)
   - No badge (if `paymentStatus=active`)

### Step 3: Payment Resolution

1. Set athlete back to `active`
2. Athlete refreshes → Normal dashboard loads
3. Coach dashboard → Badge disappears

---

## Stripe Integration Checklist (Future)

- [ ] Create Stripe webhook handler
- [ ] On `payment_intent.succeeded` → Update athlete to `active`
- [ ] On `invoice.payment_failed` → Update athlete to `overdue`
- [ ] On `invoice.upcoming` (30 days before) → Update athlete to `due_soon`
- [ ] Implement Stripe Billing Portal URL generation
- [ ] Replace `alert()` in PaymentRequiredLockout with real redirect
- [ ] Add subscription management UI to athlete settings
