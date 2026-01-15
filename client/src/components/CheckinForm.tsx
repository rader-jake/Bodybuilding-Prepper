import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCheckinSchema } from "@shared/schema";
import type { InsertCheckin } from "@shared/routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { z } from "zod";
import { POSE_KEYS, type PoseKey } from "@/lib/poses";
import { api } from "@shared/routes";

interface CheckinFormProps {
  onSubmit: (data: InsertCheckin) => void;
  isLoading: boolean;
  athleteId: number;
}

// Extend schema for form usage (handling string to number coercion)
const formSchema = insertCheckinSchema.extend({
  weight: z.string().min(1, "Weight is required"),
  sleep: z.coerce.number().min(1).max(10),
  stress: z.coerce.number().min(1).max(10),
  adherence: z.coerce.number().min(1).max(10),
  posePhotos: z.any(),
});

type FormData = z.infer<typeof formSchema>;

export function CheckinForm({ onSubmit, isLoading, athleteId }: CheckinFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      athleteId,
      sleep: 7,
      stress: 5,
      adherence: 10,
      posePhotos: {},
    },
  });

  const [posePhotos, setPosePhotos] = useState<Record<string, string>>({});
  const [uploadingPose, setUploadingPose] = useState<PoseKey | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadPosePhoto = async (file: File) => {
    const signatureRes = await fetch(api.cloudinary.sign.path, {
      method: api.cloudinary.sign.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "pose-photos" }),
    });
    if (!signatureRes.ok) throw new Error("Failed to prepare upload");
    const { signature, timestamp, cloudName, apiKey } = await signatureRes.json();
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
    if (!uploadRes.ok) throw new Error("Upload failed");
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

  const sleepValue = watch("sleep");
  const stressValue = watch("stress");
  const adherenceValue = watch("adherence");
  const watchedPosePhotos = watch("posePhotos") as Record<string, string> | undefined;
  const posePhotosValue = watchedPosePhotos || posePhotos;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-secondary/20 border-border">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Current Weight</Label>
              <div className="relative">
                <Input {...register("weight")} placeholder="e.g. 185.5 lbs" className="text-lg font-bold" />
                <div className="absolute inset-y-0 right-3 flex items-center text-muted-foreground pointer-events-none">
                  lbs
                </div>
              </div>
              {errors.weight && <p className="text-destructive text-sm">{errors.weight.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Pose Photos</Label>
              <p className="text-xs text-muted-foreground">Capture consistent poses for better comparison.</p>
              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
              <div className="grid grid-cols-2 gap-3 mt-3">
                {POSE_KEYS.map((pose) => (
                  <div key={pose.key} className="rounded-lg border border-border bg-background/60 p-2 space-y-2">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{pose.label}</div>
                    <div className="aspect-square rounded-md border border-dashed border-border overflow-hidden bg-secondary/30 flex items-center justify-center">
                      {posePhotosValue?.[pose.key] ? (
                        <img src={posePhotosValue[pose.key]} alt={pose.label} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No photo</span>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="block w-full text-[11px] text-muted-foreground file:mr-2 file:rounded-md file:border-0 file:bg-secondary/60 file:px-2 file:py-1 file:text-[11px] file:font-semibold file:text-foreground"
                      onChange={(event) => handlePoseFile(pose.key, event.target.files?.[0])}
                      disabled={uploadingPose === pose.key}
                    />
                    {uploadingPose === pose.key && (
                      <p className="text-[11px] text-muted-foreground">Uploading...</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/20 border-border">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Sleep Quality</Label>
                <span className="text-primary font-mono font-bold">{sleepValue}/10</span>
              </div>
              <Slider
                value={[sleepValue]}
                min={1} max={10} step={1}
                onValueChange={([v]) => setValue("sleep", v)}
                className="[&_.range]:bg-primary"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Stress Level</Label>
                <span className="text-orange-500 font-mono font-bold">{stressValue}/10</span>
              </div>
              <Slider
                value={[stressValue]}
                min={1} max={10} step={1}
                onValueChange={([v]) => setValue("stress", v)}
                className="[&_.range]:bg-orange-500"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Plan Adherence</Label>
                <span className="text-emerald-500 font-mono font-bold">{adherenceValue}/10</span>
              </div>
              <Slider
                value={[adherenceValue]}
                min={1} max={10} step={1}
                onValueChange={([v]) => setValue("adherence", v)}
                className="[&_.range]:bg-emerald-500"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Weekly Notes / Biofeedback</Label>
        <Textarea
          {...register("notes")}
          placeholder="How did you feel this week? Any issues with training or diet?"
          className="min-h-[150px] text-lg leading-relaxed bg-secondary/30"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground uppercase text-xs font-bold tracking-wider">Program Changes</Label>
        <Textarea
          {...register("programChanges")}
          placeholder="Any changes to training, nutrition, supplements, or compounds this week?"
          className="min-h-[120px] text-base leading-relaxed bg-secondary/30"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full py-6 text-lg font-bold tracking-widest uppercase bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all"
      >
        {isLoading ? "Submitting..." : "Submit Check-in"}
      </Button>
    </form>
  );
}
