import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type NutritionPlan, type Protocol, type TrainingBlock, type WeeklyTrainingPlan, type HealthMarker, type TrainingCompletion } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiFetch";

export function useTrainingBlocks(athleteId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: trainingBlocks, isLoading } = useQuery({
    queryKey: [api.trainingBlocks.list.path, athleteId],
    queryFn: async () => {
      const url = athleteId ? `${api.trainingBlocks.list.path}?athleteId=${athleteId}` : api.trainingBlocks.list.path;
      return await apiFetch<TrainingBlock[]>(url);
    },
    enabled: !!athleteId,
  });

  const createTrainingBlock = useMutation({
    mutationFn: async (data: Partial<TrainingBlock>) => {
      return await apiFetch<TrainingBlock>(api.trainingBlocks.create.path, {
        method: api.trainingBlocks.create.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.trainingBlocks.list.path] });
      toast({ title: "Saved", description: "Training block added." });
    },
  });

  return { trainingBlocks, isLoading, createTrainingBlock };
}

export function useWeeklyTrainingPlans(athleteId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: weeklyPlans, isLoading } = useQuery({
    queryKey: [api.weeklyTrainingPlans.list.path, athleteId],
    queryFn: async () => {
      const url = athleteId ? `${api.weeklyTrainingPlans.list.path}?athleteId=${athleteId}` : api.weeklyTrainingPlans.list.path;
      return await apiFetch<WeeklyTrainingPlan[]>(url);
    },
    enabled: !!athleteId,
  });

  const createWeeklyPlan = useMutation({
    mutationFn: async (data: Partial<WeeklyTrainingPlan>) => {
      return await apiFetch<WeeklyTrainingPlan>(api.weeklyTrainingPlans.create.path, {
        method: api.weeklyTrainingPlans.create.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.weeklyTrainingPlans.list.path] });
      toast({ title: "Saved", description: "Weekly plan added." });
    },
  });

  return { weeklyPlans, isLoading, createWeeklyPlan };
}

export function useNutritionPlans(athleteId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: nutritionPlans, isLoading } = useQuery({
    queryKey: [api.nutritionPlans.list.path, athleteId],
    queryFn: async () => {
      const url = athleteId ? `${api.nutritionPlans.list.path}?athleteId=${athleteId}` : api.nutritionPlans.list.path;
      return await apiFetch<NutritionPlan[]>(url);
    },
    enabled: !!athleteId,
  });

  const createNutritionPlan = useMutation({
    mutationFn: async (data: Partial<NutritionPlan>) => {
      return await apiFetch<NutritionPlan>(api.nutritionPlans.create.path, {
        method: api.nutritionPlans.create.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.nutritionPlans.list.path] });
      toast({ title: "Saved", description: "Nutrition plan added." });
    },
  });

  return { nutritionPlans, isLoading, createNutritionPlan };
}

export function useProtocols(athleteId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: protocols, isLoading } = useQuery({
    queryKey: [api.protocols.list.path, athleteId],
    queryFn: async () => {
      const url = athleteId ? `${api.protocols.list.path}?athleteId=${athleteId}` : api.protocols.list.path;
      return await apiFetch<Protocol[]>(url);
    },
    enabled: !!athleteId,
  });

  const createProtocol = useMutation({
    mutationFn: async (data: Partial<Protocol>) => {
      return await apiFetch<Protocol>(api.protocols.create.path, {
        method: api.protocols.create.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.protocols.list.path] });
      toast({ title: "Saved", description: "Protocol updated." });
    },
  });

  return { protocols, isLoading, createProtocol };
}

export function useHealthMarkers(athleteId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: healthMarkers, isLoading } = useQuery({
    queryKey: [api.healthMarkers.list.path, athleteId],
    queryFn: async () => {
      const url = athleteId ? `${api.healthMarkers.list.path}?athleteId=${athleteId}` : api.healthMarkers.list.path;
      return await apiFetch<HealthMarker[]>(url);
    },
    enabled: !!athleteId,
  });

  const createHealthMarker = useMutation({
    mutationFn: async (data: Partial<HealthMarker>) => {
      return await apiFetch<HealthMarker>(api.healthMarkers.create.path, {
        method: api.healthMarkers.create.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.healthMarkers.list.path] });
      toast({ title: "Saved", description: "Health marker added." });
    },
  });

  return { healthMarkers, isLoading, createHealthMarker };
}

export function useTrainingCompletions(athleteId?: number, dateKey?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: completions, isLoading } = useQuery({
    queryKey: [api.trainingCompletions.list.path, athleteId, dateKey],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (athleteId) params.append("athleteId", String(athleteId));
      if (dateKey) params.append("dateKey", dateKey);
      const url = params.toString()
        ? `${api.trainingCompletions.list.path}?${params.toString()}`
        : api.trainingCompletions.list.path;
      return await apiFetch<TrainingCompletion[]>(url);
    },
    enabled: !!athleteId,
  });

  const createCompletion = useMutation({
    mutationFn: async (data: Partial<TrainingCompletion>) => {
      return await apiFetch<TrainingCompletion>(api.trainingCompletions.create.path, {
        method: api.trainingCompletions.create.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.trainingCompletions.list.path] });
      toast({ title: "Saved", description: "Workout marked." });
    },
  });

  const updateCompletion = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TrainingCompletion> & { id: number }) => {
      return await apiFetch<TrainingCompletion>(api.trainingCompletions.update.path.replace(":id", String(id)), {
        method: api.trainingCompletions.update.method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.trainingCompletions.list.path] });
    },
  });

  return { completions, isLoading, createCompletion, updateCompletion };
}
