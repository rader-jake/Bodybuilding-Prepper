import LayoutAthlete from "@/components/LayoutAthlete";
import LayoutCoach from "@/components/LayoutCoach";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { X } from "lucide-react";

export default function ProfileSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatarUrl || null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  useEffect(() => {
    if (removeAvatar) {
      setPreviewUrl(null);
      return;
    }
    if (!avatarFile) {
      setPreviewUrl(user?.avatarUrl || null);
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile, removeAvatar, user?.avatarUrl]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let avatarUrl: string | null | undefined = undefined;

    if (avatarFile) {
      const signatureRes = await fetch(api.cloudinary.sign.path, {
        method: api.cloudinary.sign.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "avatars" }),
      });
      if (!signatureRes.ok) {
        alert("Failed to prepare image upload");
        return;
      }
      const { signature, timestamp, cloudName, apiKey } = await signatureRes.json();
      const formData = new FormData();
      formData.append("file", avatarFile);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", "avatars");

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        alert("Image upload failed");
        return;
      }
      const uploadData = await uploadRes.json();
      avatarUrl = uploadData.secure_url;
      setRemoveAvatar(false);
    } else if (removeAvatar) {
      avatarUrl = null;
    }

    const payload = { ...(avatarUrl !== undefined ? { avatarUrl } : {}) };
    const res = await fetch(api.auth.update.path, {
      method: api.auth.update.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert("Failed to save profile");
      return;
    }
    const updated = await res.json();
    queryClient.setQueryData([api.auth.me.path], updated);
    setAvatarFile(null);
    setRemoveAvatar(false);
    alert("Profile updated");
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setRemoveAvatar(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setPreviewUrl(null);
    setRemoveAvatar(true);
  };

  const Layout = user?.role === 'coach' ? LayoutCoach : LayoutAthlete;

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center">Profile</h1>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border border-white">
                {previewUrl ? <AvatarImage src={previewUrl} alt="avatar" /> : null}
                <AvatarFallback>
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    Add photo
                  </div>
                </AvatarFallback>
              </Avatar>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-2 -right-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground"
                  aria-label="Remove avatar"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button type="button" onClick={() => fileInputRef.current?.click()}>
                  Upload new photo
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">PNG or JPG up to 5MB.</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
