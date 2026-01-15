import LayoutAthlete from "@/components/LayoutAthlete";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Redirect } from "wouter";
import { differenceInDays, eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, startOfMonth } from "date-fns";
import { CalendarDays } from "lucide-react";

export default function AthleteCalendar() {
  const { user } = useAuth();

  if (!user || user.role !== "athlete") return <Redirect to="/" />;

  const showDate = user.nextShowDate ? new Date(user.nextShowDate) : null;
  const showName = user.nextShowName || "Next show";
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const weekdayOffset = monthStart.getDay();
  const countdownDays = showDate ? differenceInDays(showDate, today) : null;

  return (
    <LayoutAthlete>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            Show Calendar
          </h1>
          <p className="text-sm text-muted-foreground">Track your stage date and countdown.</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Next show</div>
                <div className="text-lg font-semibold">{showDate ? `${showName} • ${format(showDate, "MMM d, yyyy")}` : "No show set"}</div>
              </div>
              <div className="rounded-full border border-border bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
                {countdownDays !== null ? `${countdownDays} days to show` : "Countdown unavailable"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{format(today, "MMMM yyyy")}</div>
              <div className="text-xs text-muted-foreground">Internal calendar</div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 text-[11px]">
              {Array.from({ length: weekdayOffset }).map((_, index) => (
                <div key={`empty-${index}`} />
              ))}
              {monthDays.map((day) => {
                const isShowDay = showDate && isSameDay(day, showDate);
                return (
                  <div
                    key={day.toISOString()}
                    className={`h-10 rounded-md border border-border flex items-center justify-center text-xs ${
                      isSameMonth(day, today) ? "bg-background" : "bg-secondary/20 text-muted-foreground"
                    } ${isShowDay ? "border-primary bg-primary/10 text-primary font-semibold" : ""}`}
                  >
                    {format(day, "d")}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutAthlete>
  );
}
