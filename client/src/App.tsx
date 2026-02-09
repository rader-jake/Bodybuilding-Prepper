import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SafeArea } from "@/components/layout/SafeArea";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/Auth";
import CoachOnboarding from "@/pages/CoachOnboarding";
import CoachDashboard from "@/pages/CoachDashboard";
import CoachAthleteProfile from "@/pages/CoachAthleteProfile";
import CoachCheckins from "@/pages/CoachCheckins";
import CoachCheckinDetail from "@/pages/CoachCheckinDetail";
import CoachMessages from "@/pages/CoachMessages";
import AthleteCheckin from "@/pages/AthleteCheckin";
import AthleteHistory from "@/pages/AthleteHistory";
import AthleteDashboard from "./pages/AthleteDashboard";
import WorkoutPlan from "./pages/WorkoutPlan";
import MealPlan from "./pages/MealPlan";
import ProfileSettings from "./pages/ProfileSettings";
import AthleteProtocolsHealth from "./pages/AthleteProtocolsHealth";
import AthleteCalendar from "./pages/AthleteCalendar";
import AthleteMessages from "./pages/AthleteMessages";
import PaymentRequiredLockout from "./pages/PaymentRequiredLockout";
import BillingSuccess from "./pages/BillingSuccess";
import BillingCancel from "./pages/BillingCancel";
import { useAuth } from "@/hooks/use-auth";

// Gate component: if athlete is overdue, show lockout instead of route
function ProtectedAthleteRoute({ component: Component }: { component: React.ComponentType }) {
  const { user } = useAuth();
  if (user?.role === "athlete") {
    const isRestricted = ["past_due", "unpaid", "incomplete", "canceled", "waiting_for_coach"].includes(user.paymentStatus || "");
    if (user.locked || isRestricted) {
      return <PaymentRequiredLockout />;
    }
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/onboarding/coach-industry" component={CoachOnboarding} />
      <Route path="/dashboard" component={CoachDashboard} />
      <Route path="/dashboard/checkins" component={CoachCheckins} />
      <Route path="/dashboard/checkins/:id" component={CoachCheckinDetail} />
      <Route path="/dashboard/messages" component={CoachMessages} />
      <Route path="/dashboard/athletes/:id" component={CoachAthleteProfile} />
      <Route path="/athlete/dashboard">
        {() => <ProtectedAthleteRoute component={AthleteDashboard} />}
      </Route>
      <Route path="/athlete/check-in">
        {() => <ProtectedAthleteRoute component={AthleteCheckin} />}
      </Route>
      <Route path="/athlete/history">
        {() => <ProtectedAthleteRoute component={AthleteHistory} />}
      </Route>
      <Route path="/athlete/workout-plan">
        {() => <ProtectedAthleteRoute component={WorkoutPlan} />}
      </Route>
      <Route path="/athlete/meal-plan">
        {() => <ProtectedAthleteRoute component={MealPlan} />}
      </Route>
      <Route path="/athlete/protocols-health">
        {() => <ProtectedAthleteRoute component={AthleteProtocolsHealth} />}
      </Route>
      <Route path="/athlete/calendar">
        {() => <ProtectedAthleteRoute component={AthleteCalendar} />}
      </Route>
      <Route path="/athlete/messages">
        {() => <ProtectedAthleteRoute component={AthleteMessages} />}
      </Route>
      <Route path="/settings/profile" component={ProfileSettings} />
      <Route path="/billing/success" component={BillingSuccess} />
      <Route path="/billing/cancel" component={BillingCancel} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SafeArea>
          <Toaster />
          <Router />
        </SafeArea>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
