import { getLocalFile, saveLocalFile } from "./localFiles";

const pending = new Map<string, Promise<Blob | null>>();

async function captureFrame(videoBlob: Blob): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(videoBlob);
    let finished = false;
    const timer = window.setTimeout(() => finish(null), 8000);

    function finish(poster: Blob | null) {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      video.pause();
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(poster);
    }

    function draw() {
      if (!video.videoWidth || !video.videoHeight) { finish(null); return; }
      const ratio = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(video.videoWidth * ratio));
      canvas.height = Math.max(1, Math.round(video.videoHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) { finish(null); return; }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(finish, "image/jpeg", 0.82);
    }

    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => finish(null);
    video.onseeked = draw;
    video.onloadedmetadata = () => {
      const target = Number.isFinite(video.duration) ? Math.min(0.5, video.duration * 0.2) : 0.25;
      if (target > 0.05) video.currentTime = target;
      else if (video.readyState >= 2) draw();
    };
    video.onloadeddata = () => {
      if (video.currentTime === 0 && (!Number.isFinite(video.duration) || video.duration <= 0.25)) draw();
    };
    video.src = url;
  });
}

export async function getVideoPoster(id: string, videoBlob: Blob): Promise<Blob | null> {
  const key = `poster:${id}`;
  const existing = await getLocalFile(key);
  if (existing) return existing;
  const inProgress = pending.get(key);
  if (inProgress) return inProgress;
  const task = captureFrame(videoBlob).then(async (poster) => {
    if (poster) await saveLocalFile(key, poster).catch(() => {});
    return poster;
  }).finally(() => pending.delete(key));
  pending.set(key, task);
  return task;
}
