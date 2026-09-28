import { supabase } from "./supabase";

export async function uploadFileToStorage(
  file: File | Blob,
  path: string
): Promise<string> {
  const cleanPath = path.replace(/^\/+/, "");
  const { data, error } = await supabase.storage
    .from("midias")
    .upload(cleanPath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    throw new Error(`Erro ao enviar arquivo para o Storage: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from("midias")
    .getPublicUrl(data.path);

  return publicData.publicUrl;
}
