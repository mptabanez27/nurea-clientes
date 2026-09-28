export async function uploadFileToStorage(
  file: File | Blob,
  path: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Falha ao enviar arquivo para o servidor");
  }

  const data = await res.json();
  return data.url;
}
