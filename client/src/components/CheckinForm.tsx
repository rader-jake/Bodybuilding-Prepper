import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { InsertCheckin } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo } from "react";
import { z } from "zod";
import { POSE_KEYS, type PoseKey } from "@/lib/poses";
import { api } from "@shared/routes";
import { apiFetch } from "@/lib/apiFetch";
import { ChevronRight, Camera } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SPORT_CHECKIN_CONFIGS, getSportTypeForUser } from "@/lib/sport-configs";

interface CheckinFormProps {
  onSubmit: (data: InsertCheckin) => void;
  isLoading: boolean;
  athleteId: number;
}

export function MinimalCheckInForm({ onSubmit, isLoading, athleteId }: CheckinFormProps) {
  const { user } = useAuth();
  const sportType = useMemo(() => getSportTypeForUser(user || null), [user]);
  const config = SPORT_CHECKIN_CONFIGS[sportType];

  // Build a dynamic Zod schema based on the template
  const dynamicSchema = useMemo(() => {
    const schemaShape: Record<string, z.ZodTypeAny> = {
      note: z.string().optional(),
      posePhotos: z.any().optional(),
    };

    config.metrics.forEach((field) => {
      if (field.type === "number" || field.type === "rating") {
        let validator: z.ZodTypeAny = z.coerce.number();
        if (field.required) validator = validator.min(1, `${field.label} is required`);
        else validator = validator.optional();
        schemaShape[field.key] = validator;
      } else if (field.type === "boolean") {
        schemaShape[field.key] = z.coerce.boolean().optional();
      } else {
        let validator: z.ZodTypeAny = z.string();
        if (field.required) validator = validator.min(1, `${field.label} is required`);
        else validator = validator.optional();
        schemaShape[field.key] = validator;
      }
    });

    return z.object(schemaShape);
  }, [config]);

  type FormData = z.infer<typeof dynamicSchema>;

  const defaultValues: any = { athleteId };
  config.metrics.forEach((f) => {
    if (f.type === "rating") defaultValues[f.key] = f.max ?? 5;
    if (f.type === "boolean") defaultValues[f.key] = false;
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues
  });

  const [posePhotos, setPosePhotos] = useState<Record<string, string>>({});
  const [uploadingPose, setUploadingPose] = useState<PoseKey | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadPosePhoto = async (file: File) => {
    const { signature, timestamp, cloudName, apiKey } = await apiFetch<{
      signature: string;
      timestamp: number;
      cloudName: string;
      apiKey: string;
    }>(api.cloudinary.sign.path, {
      method: api.cloudinary.sign.method,
      body: JSON.stringify({ folder: "pose-photos" }),
    });

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);
    formData.append("folder", "pose-photos");

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) throw new Error("Cloudinary Upload failed");
    const uploadData = await uploadRes.json();
    return uploadData.secure_url as string;
  };

  const handlePoseFile = async (poseKey: PoseKey, file?: File) => {
    if (!file) return;
    setUploadError(null);
    setUploadingPose(poseKey);
    try {
      const url = await uploadPosePhoto(file);
      const next = { ...posePhotos, [poseKey]: url };
      setPosePhotos(next);
      setValue("posePhotos", next);
    } catch (error) {
      setUploadError("Failed to upload photo. Try again.");
    } finally {
      setUploadingPose(null);
    }
  };

  const handleFormSubmit = (formData: any) => {
    if (config.requiresPhotos) {
      const missing = POSE_KEYS.filter((pose) => !posePhotos[pose.key]);
      if (missing.length) {
        setUploadError("Please upload front, side, and back photos.");
        return;
      }
    }

    const metrics = config.metrics
      .map((metric) => ({
        key: metric.key,
        label: metric.label,
        value: formData[metric.key],
      }))
      .filter((metric) => metric.value !== undefined && metric.value !== "");

    const mediaUrls = config.requiresPhotos
      ? POSE_KEYS.map((pose) => posePhotos[pose.key]).filter(Boolean)
      : [];

    const submission: any = {
      athleteId,
      notes: formData.note || null,
      data: {
        metrics,
        mediaUrls,
        sportType,
      },
    };

    const weightMetric = metrics.find((metric) => metric.key === "weight");
    if (weightMetric?.value !== undefined && weightMetric?.value !== "") {
      submission.weight = String(weightMetric.value);
    }

    if (config.requiresPhotos) {
      submission.posePhotos = posePhotos;
      submission.photos = mediaUrls;
    }

    onSubmit(submission);
  };

  const renderMetricField = (field: (typeof config.metrics)[number]) => {
    if (field.type === "rating") {
      return (
        <div key={field.key} className="space-y-4 py-2">
          <FeedbackWrapper
            label={field.label}
            value={watch(field.key) as number}
            onValueChange={(v) => setValue(field.key, v)}
            min={field.min ?? 1}
            max={field.max ?? 5}
          />
        </div>
      );
    }

    if (field.type === "boolean") {
      return (
        <label key={field.key} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
          <Checkbox
            checked={!!watch(field.key)}
            onCheckedChange={(value) => setValue(field.key, value === true)}
          />
          <input type="hidden" {...register(field.key)} />
          <span className="text-sm font-semibold">{field.label}</span>
        </label>
      );
    }

    const isLargeNumber = field.key === "weight";
    if (isLargeNumber && field.type === "number") {
      return (
        <div className="space-y-4" key={field.key}>
          <Label className="label-caps">{field.label}</Label>
          <div className="relative group max-w-[200px]">
            <Input
              {...register(field.key)}
              placeholder="0.0"
              className="text-6xl font-display font-bold bg-transparent border-none text-primary p-0 h-auto placeholder:text-white/5 focus-visible:ring-0 rounded-none border-b-2 border-white/5 focus:border-primary transition-all duration-500"
            />
            <div className="absolute right-0 bottom-3 text-sm font-bold opacity-20 pointer-events-none tracking-widest">
              LBS
            </div>
          </div>
          {errors[field.key] && <p className="text-destructive text-xs font-bold uppercase tracking-wider">{(errors[field.key] as any)?.message}</p>}
        </div>
      );
    }

    const isTextArea = field.type === "text" && field.key.includes("highlight");
    if (isTextArea) {
      return (
        <div className="space-y-4" key={field.key}>
          <Label className="label-caps">{field.label}</Label>
          <Textarea
            {...register(field.key)}
            placeholder={field.placeholder || "Enter details..."}
            className="min-h-[140px] bg-white/[0.02] border border-white/5 rounded-2xl p-6 focus:bg-white/[0.05] focus:border-primary/40 transition-all placeholder:opacity-20 scroll-hide"
          />
        </div>
      );
    }

    return (
      <div className="space-y-3" key={field.key}>
        <Label className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.1em]">{field.label}</Label>
        <Input
          {...register(field.key)}
          type={field.type === "number" ? "number" : "text"}
          placeholder={field.placeholder}
          className="bg-secondary/5 border-transparent h-11 px-4 focus:bg-secondary/10 focus:border-primary/20 transition-all rounded-lg"
        />
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-xl mx-auto">
      <div className="space-y-8">
        {config.metrics.map((metric) => renderMetricField(metric))}
      </div>

      {config.requiresPhotos && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="label-caps">Posing Photos</Label>
            <span className="label-caps !text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Required</span>
          </div>
          {uploadError && <p className="text-xs text-destructive bg-destructive/10 p-4 rounded-2xl border border-destructive/20 font-bold uppercase tracking-wider">{uploadError}</p>}
          <div className="grid grid-cols-2 gap-4">
            {POSE_KEYS.map((pose) => (
              <div key={pose.key} className="card-premium aspect-[3/4] p-0 overflow-hidden group/photo relative ring-1 ring-white/5">
                {posePhotos[pose.key] ? (
                  <img src={posePhotos[pose.key]} alt={pose.label} className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover/photo:bg-primary/20 transition-colors">
                      <Camera className="w-6 h-6 text-white/20 group-hover/photo:text-primary transition-colors" />
                    </div>
                    <span className="label-caps opacity-40 group-hover/photo:opacity-100 transition-opacity">{pose.label}</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest">{posePhotos[pose.key] ? "Replace Photo" : "Upload Pose"}</p>
                </div>

                {uploadingPose === pose.key && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                <label className="absolute inset-0 cursor-pointer z-0">
                  <span className="sr-only">Choose {pose.label}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(event) => handlePoseFile(pose.key, event.target.files?.[0])}
                    disabled={!!uploadingPose}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Label className="label-caps">Note (Optional)</Label>
        <Textarea
          {...register("note")}
          placeholder="Short note for your coach..."
          className="min-h-[140px] bg-white/[0.02] border border-white/5 rounded-2xl p-6 focus:bg-white/[0.05] focus:border-primary/40 transition-all placeholder:opacity-20 scroll-hide"
        />
      </div>

      <div className="pt-12 pb-24">
        <Button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full h-16 text-lg tracking-[0.2em] shadow-2xl group"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              <span>SUBMITTING...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span>COMPLETE CHECK-IN</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}

function FeedbackWrapper({ label, value, onValueChange, min = 1, max = 10 }: { label: string, value: number, onValueChange: (v: number) => void, min?: number, max?: number }) {
  let colorClass = "text-primary";
  let ringClass = "ring-primary/20";

  if (label.toLowerCase().includes("fatigue")) { colorClass = "text-orange-500"; ringClass = "ring-orange-500/20"; }
  if (label.toLowerCase().includes("soreness")) { colorClass = "text-red-500"; ringClass = "ring-red-500/20"; }
  if (label.toLowerCase().includes("energy")) { colorClass = "text-emerald-500"; ringClass = "ring-emerald-500/20"; }

  return (
    <div className={`space-y-6 bg-white/[0.02] p-6 rounded-3xl border border-white/5 transition-all hover:bg-white/[0.04]`}>
      <div className="flex justify-between items-center">
        <Label className="label-caps !text-ml-text-muted">{label}</Label>
        <div className={`font-display font-bold text-2xl ${colorClass} tracking-tighter`}>
          {value || Math.ceil(max / 2)}<span className="text-sm opacity-20 ml-1">/ {max}</span>
        </div>
      </div>
      <div className="px-2">
        <Slider
          value={[value || Math.ceil(max / 2)]}
          min={min} max={max} step={1}
          onValueChange={([v]) => onValueChange(v)}
          className={`slider-premium ${colorClass.replace('text-', 'bg-')}`}
        />
      </div>
      <div className="flex justify-between label-caps !opacity-20 px-2">
        <span>Low</span>
        <span>High</span>
      </div>
    </div>
  );
}

export function CheckinForm({ onSubmit, isLoading, athleteId }: CheckinFormProps) {
  return <MinimalCheckInForm onSubmit={onSubmit} isLoading={isLoading} athleteId={athleteId} />;
}
