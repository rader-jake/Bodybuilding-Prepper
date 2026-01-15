import { useAuth } from "@/hooks/use-auth";
import { useCheckins } from "@/hooks/use-checkins";
import { CheckinForm } from "@/components/CheckinForm";
import { Redirect, Link } from "wouter";
import { format } from "date-fns";
import { LogOut, History, ChevronLeft, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

import LayoutAthlete from "@/components/LayoutAthlete";

export default function AthleteCheckin() {
  const { user, logout } = useAuth();
  const { createCheckin } = useCheckins(user?.id);

  if (!user || user.role !== 'athlete') return <Redirect to="/" />;

  return (
    <LayoutAthlete>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-primary font-medium leading-relaxed">
            "Discipline is doing what needs to be done, even if you don't want to do it." 
            <span className="block mt-1 opacity-70">- Focus on the process.</span>
          </p>
        </div>

        <CheckinForm 
          onSubmit={(data) => createCheckin.mutate(data)} 
          isLoading={createCheckin.isPending} 
          athleteId={user.id} 
        />
      </div>
    </LayoutAthlete>
  );
}
