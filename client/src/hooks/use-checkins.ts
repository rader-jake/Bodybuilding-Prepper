import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCheckin, type Checkin } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiFetch";

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
      return await apiFetch<Checkin[]>(url);
    },
  });

  const createCheckin = useMutation({
    mutationFn: async (data: InsertCheckin) => {
      return await apiFetch<Checkin>(api.checkins.create.path, {
        method: api.checkins.create.method,
        body: JSON.stringify(data),
      });
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
      return await apiFetch<Checkin>(url, {
        method: api.checkins.update.method,
        body: JSON.stringify(updates),
      });
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
