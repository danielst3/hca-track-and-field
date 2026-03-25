/**
 * Extracts keyframes from a video URL using browser Canvas API.
 * Returns an array of uploaded image URLs.
 */
import { base44 } from "@/api/base44Client";

export async function extractAndUploadFrames(videoUrl, numFrames = 5) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.muted = true;
    video.src = videoUrl;

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration;
      if (!duration || duration === Infinity) {
        resolve([]);
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const timestamps = [];

      // Spread frames evenly, skipping the very start and end
      for (let i = 0; i < numFrames; i++) {
        const t = (duration / (numFrames + 1)) * (i + 1);
        timestamps.push(t);
      }

      const frameBlobs = [];
      let currentIndex = 0;

      const captureNext = () => {
        if (currentIndex >= timestamps.length) {
          // All frames captured — upload them
          uploadAll(frameBlobs).then(resolve).catch(reject);
          return;
        }
        video.currentTime = timestamps[currentIndex];
      };

      video.addEventListener("seeked", () => {
        canvas.width = Math.min(video.videoWidth, 1280);
        canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) frameBlobs.push(blob);
          currentIndex++;
          captureNext();
        }, "image/jpeg", 0.85);
      });

      captureNext();
    });

    video.addEventListener("error", () => {
      // If we can't load the video (e.g., CORS), resolve empty
      resolve([]);
    });

    // Timeout fallback
    setTimeout(() => resolve([]), 30000);
  });
}

async function uploadAll(blobs) {
  const urls = [];
  for (const blob of blobs) {
    const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    urls.push(file_url);
  }
  return urls;
}