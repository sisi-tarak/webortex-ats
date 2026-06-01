"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Bell, Shield, Trash2, Camera, Loader2 } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { updateUserProfile } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

const AVATAR_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || "",
      phone: profile?.phone || "",
    },
  });

  const onSaveProfile = async (data: { displayName: string; phone?: string }) => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateProfile(user, { displayName: data.displayName });
      await updateUserProfile(user.uid, { displayName: data.displayName, phone: data.phone || "" });
      await refreshProfile();
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG, and WebP images are allowed");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error("Image must be smaller than 5 MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const idToken = await user.getIdToken();
      const form = new FormData();
      form.append("avatar", file);

      const res = await fetch("/api/user/upload-avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Upload failed");
      }

      await refreshProfile();
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const avatarSrc = profile?.photoURL || user?.photoURL || null;
  const initials = (profile?.displayName?.[0] ?? user?.email?.[0] ?? "U").toUpperCase();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Settings</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-[var(--primary)]" /> Profile Information
          </CardTitle>
          <CardDescription>Update your name, photo, and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[var(--primary)] text-[#060606] flex items-center justify-center text-2xl font-bold">
                    {initials}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Change photo"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={onAvatarChange}
                />
              </div>
              <div>
                <p className="font-medium text-[var(--foreground)]">{profile?.displayName}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{user?.email}</p>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-xs text-[var(--primary)] hover:underline mt-0.5 disabled:opacity-50"
                >
                  {uploadingAvatar ? "Uploading…" : "Change photo"}
                </button>
              </div>
            </div>

            <Input
              label="Full Name"
              error={errors.displayName?.message}
              required
              {...register("displayName")}
            />
            <Input
              label="Phone Number"
              placeholder="+91 98765 43210"
              hint="Used for account recovery"
              {...register("phone")}
            />
            <Input
              label="Email Address"
              defaultValue={user?.email || ""}
              disabled
              hint="Email cannot be changed. Contact support if needed."
            />
            <Button type="submit" loading={savingProfile}>Save Changes</Button>
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-[var(--primary)]" /> Notifications
          </CardTitle>
          <CardDescription>Control what emails you receive</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: "ATS Score Reports", desc: "Get emailed when your ATS score changes significantly" },
              { label: "Product Updates", desc: "New features, templates, and improvements" },
              { label: "Tips & Best Practices", desc: "Weekly ATS optimization tips" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start justify-between gap-4 py-3 border-b border-[var(--border)] last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{item.desc}</p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-1 h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--primary)]" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Password</p>
              <p className="text-xs text-[var(--muted-foreground)]">Change your account password</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Reset link sent to your email")}
            >
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-500/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-400">
            <Trash2 className="h-4 w-4" /> Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions. Proceed with caution.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Delete Account</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Permanently delete your account and all resume data
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                toast.error(
                  "Please contact support to delete your account: support@webortex.com"
                )
              }
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
