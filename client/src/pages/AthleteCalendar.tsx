import LayoutAthlete from "@/components/LayoutAthlete";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Redirect } from "wouter";
import { differenceInDays, eachDayOfInterval, endOfMonth, format, isSameDay, isSameMonth, startOfMonth } from "date-fns";
import { CalendarDays } from "lucide-react";
import { getTemplateForUser } from "@/lib/templates";

export default function AthleteCalendar() {
  const { user } = useAuth();

  if (!user || user.role !== "athlete") return <Redirect to="/" />;

  const template = getTemplateForUser(user);

  const showDate = user.nextShowDate ? new Date(user.nextShowDate) : null;
  const showName = user.nextShowName || "Next event";
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const weekdayOffset = monthStart.getDay();
  const countdownDays = showDate ? differenceInDays(showDate, today) : null;

  const eventLabel = template.sportType === 'bodybuilding' ? 'Show' :
    template.sportType === 'powerlifting' ? 'Meet' :
      template.sportType === 'crossfit' ? 'Comp' :
        template.sportType === 'endurance' ? 'Race' : 'Event';

  const dayLabel = template.sportType === 'bodybuilding' ? 'Stage Day' :
    template.sportType === 'powerlifting' ? 'Meet Day' :
      template.sportType === 'crossfit' ? 'Game Day' :
        template.sportType === 'endurance' ? 'Race Day' : 'Event Day';

  return (
    <LayoutAthlete>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3 uppercase tracking-tight">
            <CalendarDays className="w-8 h-8 text-primary shadow-sm" />
            Vanguard Calendar
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">Countdown to your moment.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
            <CardContent className="p-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Next {eventLabel} Engagement</span>
                  {showDate && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Locked In</span>
                  )}
                </div>

                <div className="space-y-1">
                  <h2 className="text-3xl font-display font-bold uppercase tracking-tight">
                    {showDate ? showName : `No Target ${eventLabel} Defined`}
                  </h2>
                  {showDate && (
                    <p className="text-muted-foreground font-medium">
                      {format(showDate, "MMMM do, yyyy")}
                    </p>
                  )}
                </div>

                {showDate && (
                  <div className="mt-4 pt-6 border-t border-border/50 grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-[24px] font-display font-bold leading-none">{Math.floor(countdownDays! / 7)}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Weeks Out</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[24px] font-display font-bold leading-none text-primary">{countdownDays}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Days Out</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[24px] font-display font-bold leading-none">{Math.floor(countdownDays! * 24)}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Hours Out</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-primary shadow-lg shadow-primary/20 flex flex-col justify-center text-primary-foreground p-8 text-center bg-gradient-to-br from-primary to-primary-foreground/20">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-2">Focus Mode</div>
            <p className="text-lg font-display font-bold uppercase leading-tight">
              "The pain of discipline is temporary. The pain of regret is forever."
            </p>
          </Card>
        </div>

        <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-secondary/5">
              <div className="text-sm font-bold uppercase tracking-widest">{format(currentMonth, "MMMM yyyy")}</div>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-primary/20" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-7 gap-3 text-center mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: weekdayOffset }).map((_, index) => (
                  <div key={`empty-${index}`} className="aspect-square rounded-xl bg-secondary/5 border border-transparent" />
                ))}

                {monthDays.map((date) => {
                  const isShowDay = showDate && isSameDay(date, showDate);
                  const isPast = date < today && !isSameDay(date, today);
                  const isCur = isSameDay(date, today);

                  return (
                    <div
                      key={date.toISOString()}
                      className={`aspect-square rounded-xl border flex flex-col items-center justify-center relative transition-all duration-300 ${isShowDay
                        ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30 z-10 scale-105"
                        : isCur
                          ? "border-primary/50 bg-primary/5 text-primary font-bold shadow-[0_0_15px_rgba(var(--primary),0.1)]"
                          : isPast
                            ? "border-border/20 bg-secondary/5 opacity-30"
                            : "border-border/50 bg-background hover:border-primary/30"
                        }`}
                    >
                      <span className={`text-xs ${isShowDay ? "font-bold text-lg" : "font-medium"}`}>
                        {format(date, "d")}
                      </span>
                      {isShowDay && <span className="text-[7px] font-bold uppercase mt-0.5">{dayLabel}</span>}
                      {isCur && !isShowDay && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary shadow-[0_0_5px_rgba(var(--primary),1)]" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutAthlete>
  );
}

const currentMonth = new Date();
