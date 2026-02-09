import { useAuth } from "@/hooks/use-auth";
import { api } from "@shared/routes";
import { apiFetch } from "@/lib/apiFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function PaymentRequiredLockout() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user || user.paymentStatus === "active") {
    return null; // Should not reach here if properly gated
  }

  const isOverdue = ["past_due", "unpaid"].includes(user.paymentStatus || "");
  const isIncomplete = ["incomplete", "canceled"].includes(user.paymentStatus || "");
  const isWaitingForCoach = user.paymentStatus === "waiting_for_coach" || (user.locked && !isIncomplete && !isOverdue);
  const coachBillingMode = (user as any)?.coachBillingMode;

  const handlePortal = async () => {
    const res = await apiFetch<{ url: string }>(api.billing.portal.path, { method: api.billing.portal.method });
    window.location.href = res.url;
  };

  const handleCheckout = async () => {
    const res = await apiFetch<{ url: string }>(api.billing.checkout.path, { method: api.billing.checkout.method });
    window.location.href = res.url;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/40">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_30px_-10px_rgba(249,115,22,0.4)]">
            {isOverdue ? (
              <AlertTriangle className="w-8 h-8 text-red-500" />
            ) : isWaitingForCoach ? (
              <Clock className="w-8 h-8 text-primary" />
            ) : (
              <CreditCard className="w-8 h-8 text-orange-500" />
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-display uppercase tracking-tight">
              {isOverdue
                ? "Payment Overdue"
                : isWaitingForCoach
                  ? "Waiting for Coach"
                  : isIncomplete
                    ? "Payment Setup Required"
                    : "Payment Due"}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className={`p-4 rounded-lg border ${isOverdue ? "bg-red-500/5 border-red-500/30" : "bg-primary/5 border-primary/30"}`}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isOverdue
                ? "Your subscription payment is overdue. Please update your payment method to regain access."
                : isWaitingForCoach
                  ? "Your coach handles billing externally. Your access is currently pending coach confirmation of your last payment."
                  : isIncomplete
                    ? "Your coach uses MetaLifts for automatic billing. Add a payment method to activate your account."
                    : "Your account requires attention. Please follow the steps below to continue."}
            </p>
          </div>

          <div className="space-y-3">
            {coachBillingMode === "platform" && (
              <>
                {!isIncomplete && (
                  <Button onClick={handlePortal} className="w-full h-12 bg-primary hover:bg-primary/90">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Update Payment Method
                  </Button>
                )}
                {isIncomplete && (
                  <Button onClick={handleCheckout} className="w-full h-12 bg-primary hover:bg-primary/90">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Start Subscription
                  </Button>
                )}
              </>
            )}

            {coachBillingMode === "external" && isWaitingForCoach && (
              <div className="bg-secondary/20 p-4 rounded-xl text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</p>
                <p className="text-sm font-medium mt-1">Pending Coach Unlock</p>
              </div>
            )}

            <Button
              onClick={() => {
                logout();
                setLocation("/");
              }}
              variant="outline"
              className="w-full h-12"
            >
              Sign Out
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Need help? <span className="text-primary font-bold">Message your coach</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
