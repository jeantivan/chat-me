import { encode } from "blurhash";
import type { MediaOrientation } from "@chat-me/shared";

export function computeOrientation(width: number, height: number): MediaOrientation {
  if (width <= 0 || height <= 0) return "square";
  const ratio = width / height;
  if (ratio >= 0.95 && ratio <= 1.05) return "square";
  return ratio > 1.05 ? "landscape" : "portrait";
}

export function generateCanvasBlurhash(
  imageSource: CanvasImageSource,
  _sourceWidth: number,
  _sourceHeight: number
): string | undefined {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    ctx.drawImage(imageSource, 0, 0, 32, 32);
    const imageData = ctx.getImageData(0, 0, 32, 32);
    return encode(imageData.data, 32, 32, 4, 3);
  } catch (err) {
    console.warn("Failed to generate blurhash", err);
    return undefined;
  }
}

export interface ExtractedMediaMetadata {
  width?: number;
  height?: number;
  orientation?: MediaOrientation;
  duration?: number | null;
  blurhash?: string;
  localPreviewUrl: string;
}

export async function extractMediaMetadata(file: File): Promise<ExtractedMediaMetadata> {
  const localPreviewUrl = URL.createObjectURL(file);

  if (file.type.startsWith("image/")) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width || 100;
        const height = img.naturalHeight || img.height || 100;
        const orientation = computeOrientation(width, height);
        const blurhash = generateCanvasBlurhash(img, width, height);

        resolve({
          width,
          height,
          orientation,
          duration: null,
          blurhash,
          localPreviewUrl,
        });
      };
      img.onerror = () => {
        resolve({
          localPreviewUrl,
          orientation: "square",
          duration: null,
        });
      };
      img.src = localPreviewUrl;
    });
  }

  if (file.type.startsWith("video/")) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        const width = video.videoWidth || 100;
        const height = video.videoHeight || 100;
        const orientation = computeOrientation(width, height);
        const duration = video.duration ? Math.round(video.duration * 1000) : null;
        let blurhash: string | undefined;

        try {
          blurhash = generateCanvasBlurhash(video, width, height);
        } catch {
          // ignore
        }

        resolve({
          width,
          height,
          orientation,
          duration,
          blurhash,
          localPreviewUrl,
        });
      };

      video.onerror = () => {
        resolve({
          localPreviewUrl,
          orientation: "square",
          duration: null,
        });
      };

      video.src = localPreviewUrl;
    });
  }

  if (file.type.startsWith("audio/")) {
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";

      audio.onloadedmetadata = () => {
        const duration = audio.duration ? Math.round(audio.duration * 1000) : null;
        resolve({
          duration,
          localPreviewUrl,
        });
      };

      audio.onerror = () => {
        resolve({
          duration: null,
          localPreviewUrl,
        });
      };

      audio.src = localPreviewUrl;
    });
  }

  return { localPreviewUrl };
}
