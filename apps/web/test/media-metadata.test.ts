import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractMediaMetadata, computeOrientation } from "../src/lib/utils/mediaMetadata";

describe("Client-Side Media Metadata & Blurhash Extraction Seam", () => {
  it("computes orientation correctly based on width/height aspect ratios", () => {
    // Square: ratio between 0.95 and 1.05
    expect(computeOrientation(500, 500)).toBe("square");
    expect(computeOrientation(1000, 1020)).toBe("square");

    // Landscape: ratio > 1.05
    expect(computeOrientation(1920, 1080)).toBe("landscape");
    expect(computeOrientation(800, 600)).toBe("landscape");

    // Portrait: ratio < 0.95
    expect(computeOrientation(600, 800)).toBe("portrait");
    expect(computeOrientation(1080, 1920)).toBe("portrait");
  });

  it("extracts dimensions, orientation, and 32x32 canvas blurhash for an image file", async () => {
    // Mock Image naturalWidth/naturalHeight & trigger onload
    const originalImage = window.Image;
    window.Image = class extends originalImage {
      constructor() {
        super();
        setTimeout(() => {
          Object.defineProperty(this, "naturalWidth", { value: 1600 });
          Object.defineProperty(this, "naturalHeight", { value: 900 });
          this.onload?.(new Event("load"));
        }, 10);
      }
    } as any;

    const file = new File(["dummy content"], "test-photo.jpg", {
      type: "image/jpeg",
    });

    const metadata = await extractMediaMetadata(file);

    expect(metadata.width).toBe(1600);
    expect(metadata.height).toBe(900);
    expect(metadata.orientation).toBe("landscape");
    expect(metadata.duration).toBeNull();
    expect(metadata.blurhash).toBeDefined();
    expect(typeof metadata.blurhash).toBe("string");
    expect(metadata.blurhash!.length).toBeGreaterThan(5);
    expect(metadata.localPreviewUrl).toBeDefined();

    window.Image = originalImage;
  });

  it("extracts duration and orientation for a video file", async () => {
    // Mock HTMLVideoElement
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === "video") {
        const video = originalCreateElement("video");
        setTimeout(() => {
          Object.defineProperty(video, "videoWidth", { value: 720 });
          Object.defineProperty(video, "videoHeight", { value: 1280 });
          Object.defineProperty(video, "duration", { value: 14.5 });
          video.onloadedmetadata?.(new Event("loadedmetadata"));
        }, 10);
        return video;
      }
      return originalCreateElement(tagName);
    });

    const videoFile = new File(["video stream"], "clip.mp4", {
      type: "video/mp4",
    });

    const metadata = await extractMediaMetadata(videoFile);

    expect(metadata.width).toBe(720);
    expect(metadata.height).toBe(1280);
    expect(metadata.orientation).toBe("portrait");
    expect(metadata.duration).toBe(14500); // 14.5s in ms
    expect(metadata.localPreviewUrl).toBeDefined();

    vi.restoreAllMocks();
  });
});
