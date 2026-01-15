import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type NutritionPlan, type Protocol, type TrainingBlock, type WeeklyTrainingPlan, type HealthMarker, type TrainingCompletion } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useTrainingBlocks(athleteId?: number) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: trainingBlocks, isLoading } = useQuery({
    queryKey: [api.trainingBlocks.list.path, athleteId],
    queryFn: async () => {
      const url = athleteId ? `${api.trainingBlocks.list.path}?athleteId=${athleteId}` : api.trainingBlocks.list.path;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch training blocks");
      return await res.json() as TrainingBlock[];
    },
    enabled: !!athleteId,
  });

  const createTrainingBlock = useMutation({
    mutationFn: async (data: Partial<TrainingBlock>) => {
      const res = await fetch(api.trainingBlocks.create.path, {
        method: api.trainingBlocks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create training block");
      return await res.json() as TrainingBlock;
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
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch weekly plans");
      return await res.json() as WeeklyTrainingPlan[];
    },
    enabled: !!athleteId,
  });

  const createWeeklyPlan = useMutation({
    mutationFn: async (data: Partial<WeeklyTrainingPlan>) => {
      const res = await fetch(api.weeklyTrainingPlans.create.path, {
        method: api.weeklyTrainingPlans.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create weekly plan");
      return await res.json() as WeeklyTrainingPlan;
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
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch nutrition plans");
      return await res.json() as NutritionPlan[];
    },
    enabled: !!athleteId,
  });

  const createNutritionPlan = useMutation({
    mutationFn: async (data: Partial<NutritionPlan>) => {
      const res = await fetch(api.nutritionPlans.create.path, {
        method: api.nutritionPlans.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create nutrition plan");
      return await res.json() as NutritionPlan;
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
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch protocols");
      return await res.json() as Protocol[];
    },
    enabled: !!athleteId,
  });

  const createProtocol = useMutation({
    mutationFn: async (data: Partial<Protocol>) => {
      const res = await fetch(api.protocols.create.path, {
        method: api.protocols.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create protocol");
      return await res.json() as Protocol;
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
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch health markers");
      return await res.json() as HealthMarker[];
    },
    enabled: !!athleteId,
  });

  const createHealthMarker = useMutation({
    mutationFn: async (data: Partial<HealthMarker>) => {
      const res = await fetch(api.healthMarkers.create.path, {
        method: api.healthMarkers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create health marker");
      return await res.json() as HealthMarker;
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
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch training completions");
      return await res.json() as TrainingCompletion[];
    },
    enabled: !!athleteId,
  });

  const createCompletion = useMutation({
    mutationFn: async (data: Partial<TrainingCompletion>) => {
      const res = await fetch(api.trainingCompletions.create.path, {
        method: api.trainingCompletions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save completion");
      return await res.json() as TrainingCompletion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.trainingCompletions.list.path] });
      toast({ title: "Saved", description: "Workout marked." });
    },
  });

  const updateCompletion = useMutation({
    mutationFn: async ({ id, ...data }: Partial<TrainingCompletion> & { id: number }) => {
      const res = await fetch(api.trainingCompletions.update.path.replace(":id", String(id)), {
        method: api.trainingCompletions.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update completion");
      return await res.json() as TrainingCompletion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.trainingCompletions.list.path] });
    },
  });

  return { completions, isLoading, createCompletion, updateCompletion };
}
