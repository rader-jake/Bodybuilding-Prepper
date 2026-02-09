import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

import { apiFetch } from "@/lib/apiFetch";

export default function BillingSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    async function finalize() {
      try {
        if (sessionId) {
          // Explicitly confirm with server to avoid relying solely on webhooks for the success redirect
          await apiFetch(api.billing.confirm.path, {
            method: api.billing.confirm.method,
            body: JSON.stringify({ sessionId }),
          });
        }

        // Invalidate user query to ensure we get fresh data
        await queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
        toast({ title: "Subscription active", description: "Your payment method is confirmed. Welcome back." });
        setLocation("/athlete/dashboard");
      } catch (err) {
        console.error("Billing confirmation failed:", err);
        toast({
          variant: "destructive",
          title: "Confirmation delayed",
          description: "We're still confirming your payment. Please check your dashboard in a moment."
        });
        setLocation("/athlete/dashboard");
      }
    }

    finalize();
  }, [setLocation, toast, queryClient]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-10 text-center text-muted-foreground">
          Subscription active. Redirecting to your dashboard...
        </CardContent>
      </Card>
    </div>
  );
}
