import "@testing-library/jest-dom";

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = (blob: any) => `blob:http://localhost/mock-${Math.random().toString(36).slice(2)}`;
}
if (!window.URL.revokeObjectURL) {
  window.URL.revokeObjectURL = () => {};
}

HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === "2d") {
    return {
      drawImage: () => {},
      getImageData: (x: number, y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4).fill(128),
        width: w,
        height: h,
      }),
    } as any;
  }
  return null;
} as any;

if (!HTMLMediaElement.prototype.play) {
  HTMLMediaElement.prototype.play = () => Promise.resolve();
}
if (!HTMLMediaElement.prototype.pause) {
  HTMLMediaElement.prototype.pause = () => {};
}
if (!HTMLMediaElement.prototype.load) {
  HTMLMediaElement.prototype.load = () => {};
}
