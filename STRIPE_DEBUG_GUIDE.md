# Stripe Integration Debugging & Verification Guide

## 1. Webhook Setup
Ensuring Stripe can "talk" to your server is critical.

### Local Development
1. **Start the Stripe CLI**:
   ```bash
   stripe listen --forward-to localhost:52000/api/stripe/webhook
   ```
2. **Copy the Webhook Secret**:
   Look for `whsec_...` in the CLI output.
3. **Update `.env`**:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_from_step_2
   ```
4. **Restart Server**:
   Webhooks require a fresh env to verify signatures.

### Production
1. **Endpoint URL**: `https://yourdomain.com/api/stripe/webhook`
2. **Events to Select**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

---

## 2. Triggering Test Events
Use the Stripe CLI to simulate events without going through the UI:

```bash
# Test Checkout Success
stripe trigger checkout.session.completed

# Test Payment Failure
stripe trigger invoice.payment_failed
```

---

## 3. Verifying Database State
Check these fields in your `users` and `billing_profiles` tables:

| Field | Expected (Success) | Expected (Failure) |
| :--- | :--- | :--- |
| `paymentStatus` | `active` | `past_due` or `unpaid` |
| `locked` | `false` | `true` |
| `stripeCustomerId` | `cus_...` | `cus_...` |
| `stripeSubscriptionId` | `sub_...` | `sub_...` |

---

## 4. Troubleshooting Checklist
- [ ] **Signature Verification Failure?** Ensure `STRIPE_WEBHOOK_SECRET` matches exactly.
- [ ] **Webhook Not Firing?** Check Stripe Dashboard -> Developers -> Webhooks to see delivery attempts and error codes.
- [ ] **Athlete Still Locked?** 
  - Check `billing.confirm` logs in your server console.
  - Verify the athlete is being redirected to `/billing/success?session_id=...`.
  - Check if `api/auth/me` returns updated `paymentStatus`.
- [ ] **Raw Body Issues?** We've configured `express.raw` for `/api/stripe/webhook` in `server/index.ts`. Do not move this below general `express.json` middleware.
