"use client";

import { useState, useRef, type ChangeEvent } from "react";
import Image from "next/image";
import { Camera, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function ProfileImageUpload() {
  const { userDoc, updateProfileImage } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      await updateProfileImage(file);
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      console.error("Image upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-purple text-white flex items-center justify-center">
          {userDoc?.photoURL ? (
            <Image
              src={userDoc.photoURL}
              alt="Profile"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={48} />
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-purple text-white flex items-center justify-center hover:bg-purple-pressed transition-colors disabled:opacity-50"
        >
          <Camera size={16} />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="hidden"
      />

      {uploading && (
        <p className="text-sm text-ink-muted">Uploading...</p>
      )}

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="text-sm text-purple hover:text-purple-pressed transition-colors disabled:opacity-50"
      >
        {userDoc?.photoURL ? "Change Photo" : "Upload Photo"}
      </button>
    </div>
  );
}