import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function PaymentRequiredLockout() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user || user.paymentStatus === "active") {
    return null; // Should not reach here if properly gated
  }

  const isDueSoon = user.paymentStatus === "due_soon";
  const isOverdue = user.paymentStatus === "overdue";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary via-background to-background p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl shadow-black/40">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-[0_0_30px_-10px_rgba(239,68,68,0.4)]">
            {isOverdue ? (
              <AlertTriangle className="w-8 h-8 text-red-500" />
            ) : (
              <CreditCard className="w-8 h-8 text-orange-500" />
            )}
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-display uppercase tracking-tight">
              {isOverdue ? "Payment Overdue" : "Payment Due"}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className={`p-4 rounded-lg border ${isOverdue ? "bg-red-500/5 border-red-500/30" : "bg-orange-500/5 border-orange-500/30"}`}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isOverdue
                ? "Your subscription payment is overdue. Please update your payment method to regain access to your training dashboard."
                : "Your subscription payment is due soon. Update your payment method to continue without interruption."}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                // TODO: Integrate with Stripe billing portal
                // For now, stub with alert
                alert(
                  "TODO: Redirect to Stripe billing portal\nIn production: window.location.href = stripePortalUrl"
                );
              }}
              className="w-full h-12 bg-primary hover:bg-primary/90"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isOverdue ? "Update Payment Now" : "Review Subscription"}
            </Button>

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
            Need help? <span className="text-primary">Contact support</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
