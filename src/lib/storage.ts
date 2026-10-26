import "server-only";
import { createClient } from "@supabase/supabase-js";

export function storageEnabled(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function bucket() {
  return process.env.SUPABASE_BUCKET || "lampiran";
}

function client() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function uploadFile(taskId: number, file: File): Promise<{ url: string; path: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const path = `tugas-${taskId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const sb = client();
  const { error } = await sb.storage.from(bucket()).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(`Gagal mengunggah: ${error.message}`);
  const { data } = sb.storage.from(bucket()).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeFile(path: string) {
  if (!path || !storageEnabled()) return;
  await client().storage.from(bucket()).remove([path]);
}
