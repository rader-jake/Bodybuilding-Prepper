import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/Auth";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/dashboard" component={CoachDashboard} />
      <Route path="/dashboard/checkins" component={CoachCheckins} />
      <Route path="/dashboard/checkins/:id" component={CoachCheckinDetail} />
      <Route path="/dashboard/messages" component={CoachMessages} />
      <Route path="/dashboard/athletes/:id" component={CoachAthleteProfile} />
      <Route path="/athlete/dashboard" component={AthleteDashboard} />
      <Route path="/athlete/check-in" component={AthleteCheckin} />
      <Route path="/athlete/history" component={AthleteHistory} />
      <Route path="/athlete/workout-plan" component={WorkoutPlan} />
      <Route path="/athlete/meal-plan" component={MealPlan} />
      <Route path="/athlete/protocols-health" component={AthleteProtocolsHealth} />
      <Route path="/athlete/calendar" component={AthleteCalendar} />
      <Route path="/athlete/messages" component={AthleteMessages} />
      <Route path="/settings/profile" component={ProfileSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
