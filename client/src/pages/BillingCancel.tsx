import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillingCancel() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-md w-full">
        <CardContent className="py-10 text-center space-y-4">
          <div className="text-lg font-semibold">Checkout canceled</div>
          <p className="text-sm text-muted-foreground">You can try again when you’re ready.</p>
          <Link href="/athlete/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
