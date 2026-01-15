import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCheckin, type Checkin } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCheckins(athleteId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = [api.checkins.list.path, athleteId ? { athleteId } : undefined].filter(Boolean);

  const { data: checkins, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const url = athleteId
        ? `${api.checkins.list.path}?athleteId=${athleteId}`
        : api.checkins.list.path;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch check-ins");
      return await res.json() as Checkin[];
    },
  });

  const createCheckin = useMutation({
    mutationFn: async (data: InsertCheckin) => {
      const res = await fetch(api.checkins.create.path, {
        method: api.checkins.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return await res.json() as Checkin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.checkins.list.path] });
      toast({ title: "Success", description: "Check-in submitted successfully" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  const updateCheckin = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertCheckin> & { coachFeedback?: string }) => {
      const url = buildUrl(api.checkins.update.path, { id });
      const res = await fetch(url, {
        method: api.checkins.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update check-in");
      return await res.json() as Checkin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.checkins.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.checkins.queue.path] });
      toast({ title: "Success", description: "Feedback saved" });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  });

  return { checkins, isLoading, createCheckin, updateCheckin };
}
