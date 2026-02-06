# Minimal Diffs: What Changed

## 1. Schema Addition (shared/schema.ts)

```diff
  sport: text("sport").default("bodybuilding"),
+ coachIndustry: text("coach_industry", { enum: ["bodybuilding", "powerlifting", "endurance", "crossfit"] }),
+ paymentStatus: text("payment_status", { enum: ["active", "due_soon", "overdue"] }).default("active"),
```

## 2. New Files (2 pages)

- ✅ `client/src/pages/CoachOnboarding.tsx` (152 lines) - Industry selection form
- ✅ `client/src/pages/PaymentRequiredLockout.tsx` (63 lines) - Athlete lockout screen

## 3. App Routes (client/src/App.tsx)

```diff
+ import CoachOnboarding from "@/pages/CoachOnboarding";
+ import PaymentRequiredLockout from "./pages/PaymentRequiredLockout";
+ import { useAuth } from "@/hooks/use-auth";
+
+ function ProtectedAthleteRoute({ component: Component }) {
+   const { user } = useAuth();
+   if (user?.role === "athlete" && user?.paymentStatus !== "active") {
+     return <PaymentRequiredLockout />;
+   }
+   return <Component />;
+ }

  <Route path="/onboarding/coach-industry" component={CoachOnboarding} />

  // All /athlete/* routes wrapped:
  <Route path="/athlete/dashboard">
    {() => <ProtectedAthleteRoute component={AthleteDashboard} />}
  </Route>
```

## 4. Auth Redirects (client/src/hooks/use-auth.tsx)

```diff
  if (user.role === "coach") {
+   if (!user.coachIndustry) {
+     setLocation("/onboarding/coach-industry");
+   } else {
+     setLocation("/dashboard");
+   }
  }
```

## 5. Templates Logic (client/src/lib/templates.ts)

```diff
- return CHECKIN_TEMPLATES[user.sport] || CHECKIN_TEMPLATES.bodybuilding;
+
+ let industry: SportType | undefined;
+ if (user?.role === "coach") {
+   industry = user.coachIndustry as SportType;
+ } else if (user?.role === "athlete") {
+   industry = user.sport as SportType;
+ }
+ return CHECKIN_TEMPLATES[industry] || CHECKIN_TEMPLATES.bodybuilding;
```

## 6. Coach Dashboard (client/src/pages/CoachDashboard.tsx)

```diff
+ import { useToast } from "@/hooks/use-toast";
+ const { toast } = useToast();
+
+ if (!user?.coachIndustry) {
+   toast({ variant: "destructive", title: "Setup Required" });
+   return;
+ }
+
+ createAthlete.mutate({
+   ...
+   sport: user.coachIndustry,
+ });
+
+ // In AthleteCard:
+ {athlete.paymentStatus === "overdue" && (
+   <div className="...">Overdue</div>
+ )}
+ {athlete.paymentStatus === "due_soon" && (
+   <div className="...">Due Soon</div>
+ )}
```

## 7. Server Routes (server/routes.ts)

```diff
  // Athlete creation
  const athlete = await storage.createUser({
    ...input,
    coachId: user.id,
    role: 'athlete',
+   sport: input.sport || user.coachIndustry,
  });

+ app.patch("/api/athletes/:id/payment", requireAuthJWT, async (req, res) => {
+   const { paymentStatus } = req.body;
+   const updated = await storage.updateUser(athleteId, { paymentStatus });
+   res.json(updated);
+ });

  // Seed data
  const coach = await storage.createUser({
    username: "coach",
    password: hp,
    role: "coach",
+   coachIndustry: "bodybuilding"
  });
  const athlete = await storage.createUser({
    username: "athlete",
    password: hp2,
    role: "athlete",
    coachId: coach.id,
+   sport: "bodybuilding",
+   paymentStatus: "active"
  });
```

---

## Summary of Diffs by File

| File                                          | Lines Added | Type   | Purpose                                         |
| --------------------------------------------- | ----------- | ------ | ----------------------------------------------- |
| `shared/schema.ts`                            | 2           | Schema | Add coachIndustry + paymentStatus fields        |
| `client/src/App.tsx`                          | ~30         | Routes | Add onboarding route + payment gate             |
| `client/src/pages/CoachOnboarding.tsx`        | 152         | NEW    | Coach industry selection form                   |
| `client/src/pages/PaymentRequiredLockout.tsx` | 63          | NEW    | Athlete payment lockout screen                  |
| `client/src/hooks/use-auth.tsx`               | ~8          | Auth   | Redirect coaches without industry to onboarding |
| `client/src/lib/templates.ts`                 | ~25         | Logic  | Derive templates from coachIndustry             |
| `client/src/pages/CoachDashboard.tsx`         | ~25         | UI     | Block athlete creation + payment badges         |
| `server/routes.ts`                            | ~35         | API    | Inherit industry + payment status endpoint      |

**Total new lines of code: ~340 (2 new files + modifications)**
**Total changes: 8 files touched**

---

## No Breaking Changes

✅ All existing routes/endpoints work as before  
✅ Seed data updated but backward-compatible  
✅ Athletes without payment status default to "active"  
✅ Coaches without industry can complete onboarding any time
