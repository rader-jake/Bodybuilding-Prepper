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
  energy: z.coerce.number().min(1).max(10),
  hunger: z.coerce.number().min(1).max(10),
  mood: z.coerce.number().min(1).max(10),
  digestion: z.coerce.number().min(1).max(10),
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
      energy: 7,
      hunger: 5,
      mood: 7,
      digestion: 8,
      posePhotos: {},
    },
  });

  const [posePhotos, setPosePhotos] = useState<Record<string, string>>({});
  const [uploadingPose, setUploadingPose] = useState<PoseKey | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadPosePhoto = async (file: File) => {
    console.log(`Starting upload for file: ${file.name}`);
    const signatureRes = await fetch(api.cloudinary.sign.path, {
      method: api.cloudinary.sign.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "pose-photos" }),
    });
    if (!signatureRes.ok) {
      const err = await signatureRes.json().catch(() => ({ message: "Failed to get signature" }));
      console.error("Cloudinary signature failed:", err);
      throw new Error(`Signature failed: ${err.message}`);
    }

    const { signature, timestamp, cloudName, apiKey } = await signatureRes.json();
    console.log(`Received signature, uploading to cloudName: ${cloudName}`);

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

    if (!uploadRes.ok) {
      const errorData = await uploadRes.json().catch(() => ({ error: { message: "Upload failed" } }));
      console.error("Cloudinary upload failed:", errorData);
      throw new Error(errorData.error?.message || "Cloudinary Upload failed");
    }

    const uploadData = await uploadRes.json();
    console.log("Cloudinary upload successful:", uploadData.secure_url);
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
  const energyValue = watch("energy");
  const hungerValue = watch("hunger");
  const moodValue = watch("mood");
  const digestionValue = watch("digestion");
  const watchedPosePhotos = watch("posePhotos") as Record<string, string> | undefined;
  const posePhotosValue = watchedPosePhotos || posePhotos;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card className="bg-secondary/10 border-border/50 shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-1">
              <Label className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.1em]">Current Morning Weight</Label>
              <div className="relative group">
                <Input {...register("weight")} placeholder="0.0" className="text-2xl font-display font-bold bg-background h-14 border-border focus:border-primary/50" />
                <div className="absolute inset-y-0 right-4 flex items-center text-muted-foreground font-bold pointer-events-none group-focus-within:text-primary transition-colors">
                  LBS
                </div>
              </div>
              {errors.weight && <p className="text-destructive text-xs mt-1">{errors.weight.message}</p>}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.1em]">Pose Photography</Label>
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">Required</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed italic">Consistent lighting and angles help your coach track genuine tissue changes.</p>
              {uploadError && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{uploadError}</p>}
              <div className="grid grid-cols-2 gap-3 mt-3">
                {POSE_KEYS.map((pose) => (
                  <div key={pose.key} className="rounded-xl border border-border/50 bg-background/40 p-2.5 space-y-2 group hover:border-primary/30 transition-colors">
                    <div className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground group-hover:text-primary transition-colors">{pose.label}</div>
                    <div className="aspect-[3/4] rounded-lg border border-dashed border-border overflow-hidden bg-secondary/20 flex flex-col items-center justify-center relative">
                      {posePhotosValue?.[pose.key] ? (
                        <img src={posePhotosValue[pose.key]} alt={pose.label} className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-5 h-5 text-muted-foreground/30 mb-1" />
                          <span className="text-[10px] text-muted-foreground font-medium">Empty</span>
                        </>
                      )}
                      {uploadingPose === pose.key && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <span className="text-[10px] font-bold animate-pulse text-primary uppercase">Uploading...</span>
                        </div>
                      )}
                    </div>
                    <label className="block">
                      <span className="sr-only">Choose {pose.label}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="block w-full text-[9px] text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-[9px] file:font-bold file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        onChange={(event) => handlePoseFile(pose.key, event.target.files?.[0])}
                        disabled={uploadingPose === pose.key}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-secondary/10 border-border/50 shadow-sm">
            <CardContent className="pt-6 space-y-6">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] border-b border-border/50 pb-2">Bio-feedback Markers</h4>

              <div className="space-y-6">
                <FeedbackSlider label="Sleep Quality" value={sleepValue} color="text-primary" onValueChange={(v) => setValue("sleep", v)} />
                <FeedbackSlider label="Stress Level" value={stressValue} color="text-orange-500" onValueChange={(v) => setValue("stress", v)} />
                <FeedbackSlider label="Energy Levels" value={energyValue} color="text-yellow-500" onValueChange={(v) => setValue("energy", v)} />
                <FeedbackSlider label="Hunger" value={hungerValue} color="text-red-500" onValueChange={(v) => setValue("hunger", v)} />
                <FeedbackSlider label="Mood" value={moodValue} color="text-pink-500" onValueChange={(v) => setValue("mood", v)} />
                <FeedbackSlider label="Digestion" value={digestionValue} color="text-emerald-500" onValueChange={(v) => setValue("digestion", v)} />
                <FeedbackSlider label="Plan Adherence" value={adherenceValue} color="text-emerald-600" onValueChange={(v) => setValue("adherence", v)} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/10 border-border/50 shadow-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.1em]">Biofeedback / Weekly Notes</Label>
                <Textarea
                  {...register("notes")}
                  placeholder="Describe your week..."
                  className="min-h-[120px] bg-background border-border/50 focus:border-primary/40 text-sm leading-relaxed"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.1em]">Routine Adjustments</Label>
                <Textarea
                  {...register("programChanges")}
                  placeholder="Any changes to your protocols?"
                  className="min-h-[80px] bg-background border-border/50 focus:border-primary/40 text-sm italic"
                />
              </div>
            </CardContent>
          </Card>
        </div>
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

function FeedbackSlider({ label, value, color, onValueChange }: { label: string, value: number, color: string, onValueChange: (v: number) => void }) {
  return (
    <div className="space-y-2.5">
      <div className="flex justify-between items-center">
        <Label className="text-muted-foreground uppercase text-[9px] font-bold tracking-wider">{label}</Label>
        <span className={`font-mono font-bold text-sm ${color}`}>{value}/10</span>
      </div>
      <Slider
        value={[value]}
        min={1} max={10} step={1}
        onValueChange={([v]) => onValueChange(v)}
        className={`[&_.range]:bg-current ${color.replace('text-', 'bg-')}`}
      />
    </div>
  );
}

import { Camera } from "lucide-react";
