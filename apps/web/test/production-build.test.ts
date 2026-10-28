// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import viteConfig from "../vite.config";

describe("Production Build & Docker Configuration Seam", () => {
  it("establishes static production build configuration with asset optimization and vendor chunk splitting in vite.config.ts", () => {
    const config = typeof viteConfig === "function"
      ? (viteConfig as any)({ command: "build", mode: "production" })
      : viteConfig;

    expect(config.build).toBeDefined();
    expect(config.build?.target).toBe("esnext");
    expect(config.build?.outDir).toBe("dist");
    expect(config.build?.assetsDir).toBe("assets");
    expect(config.build?.cssMinify).toBe(true);

    const output = config.build?.rollupOptions?.output as any;
    expect(output).toBeDefined();
    expect(typeof output.manualChunks).toBe("function");

    // Verify vendor module chunk categorization
    expect(output.manualChunks("/node_modules/react/index.js")).toBe("react-vendor");
    expect(output.manualChunks("/node_modules/@tanstack/react-query/index.js")).toBe("tanstack-vendor");
    expect(output.manualChunks("/node_modules/lexical/index.js")).toBe("lexical-vendor");
    expect(output.manualChunks("/node_modules/@radix-ui/react-dialog/index.js")).toBe("ui-vendor");
  });

  it("defines multi-stage production Dockerfile for apps/server (Node.js Alpine runtime)", () => {
    const serverDockerfilePath = path.resolve(__dirname, "../../server/Dockerfile");
    expect(fs.existsSync(serverDockerfilePath)).toBe(true);

    const dockerfileContent = fs.readFileSync(serverDockerfilePath, "utf-8");
    expect(dockerfileContent).toMatch(/FROM\s+node:22-alpine\s+AS\s+builder/i);
    expect(dockerfileContent).toMatch(/FROM\s+node:22-alpine\s+AS\s+runner/i);
    expect(dockerfileContent).toContain("COPY packages/shared/package.json");
    expect(dockerfileContent).toContain("COPY apps/server/package.json");
    expect(dockerfileContent).toContain("COPY apps/web/package.json");
    expect(dockerfileContent).toContain("pnpm --filter @chat-me/shared build");
    expect(dockerfileContent).toContain("pnpm --filter @chat-me/server --prod deploy --legacy /prod/server");
    expect(dockerfileContent).toMatch(/NODE_ENV=production/);
    expect(dockerfileContent).toMatch(/USER\s+node/);
    expect(dockerfileContent).toMatch(/EXPOSE\s+3001/);
    expect(dockerfileContent).toContain('CMD ["node", "dist/index.js"]');
  });

  it("defines multi-stage production Dockerfile for apps/web static bundle", () => {
    const webDockerfilePath = path.resolve(__dirname, "../Dockerfile");
    expect(fs.existsSync(webDockerfilePath)).toBe(true);

    const dockerfileContent = fs.readFileSync(webDockerfilePath, "utf-8");
    expect(dockerfileContent).toMatch(/FROM\s+node:22-alpine\s+AS\s+builder/i);
    expect(dockerfileContent).toContain("COPY packages/shared/package.json");
    expect(dockerfileContent).toContain("COPY apps/server/package.json");
    expect(dockerfileContent).toContain("COPY apps/web/package.json");
    expect(dockerfileContent).toContain("pnpm --filter @chat-me/shared build");
    expect(dockerfileContent).toContain("pnpm --filter @chat-me/web build");
    expect(dockerfileContent).toMatch(/FROM\s+nginx:.*alpine\s+AS\s+runner/i);
  });
});
