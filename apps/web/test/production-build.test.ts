// @vitest-environment node
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
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

  it("provisions environment configuration idempotently with generated secrets via scripts/setup-env.sh", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const scriptPath = path.resolve(repoRoot, "scripts/setup-env.sh");

    expect(fs.existsSync(scriptPath)).toBe(true);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "chat-me-env-test-"));
    try {
      const exampleContent = [
        "PORT=3001",
        "HOST=0.0.0.0",
        "DATABASE_URL=postgres://postgres:postgres@localhost:5434/chat_me",
        "REDIS_URL=redis://localhost:6379",
        "S3_ENDPOINT=http://localhost:9000",
        "S3_REGION=auto",
        "S3_ACCESS_KEY_ID=minioadmin",
        "S3_SECRET_ACCESS_KEY=minioadmin",
        "S3_BUCKET=chat-media",
      ].join("\n") + "\n";

      fs.writeFileSync(path.join(tempDir, ".env.example"), exampleContent, "utf-8");

      // First run: should create .env and populate missing secrets
      execSync(`bash "${scriptPath}" "${tempDir}"`, { stdio: "pipe" });

      const envPath = path.join(tempDir, ".env");
      expect(fs.existsSync(envPath)).toBe(true);

      const generatedEnv = fs.readFileSync(envPath, "utf-8");
      expect(generatedEnv).toContain("PORT=3001");
      expect(generatedEnv).toContain("DATABASE_URL=postgres://postgres:postgres@localhost:5434/chat_me");
      expect(generatedEnv).toContain("REDIS_URL=redis://localhost:6379");
      expect(generatedEnv).toContain("S3_BUCKET=chat-media");

      const jwtMatch = generatedEnv.match(/^JWT_SECRET=([a-f0-9]{64})$/m);
      const cookieMatch = generatedEnv.match(/^COOKIE_SECRET=([a-f0-9]{64})$/m);
      expect(jwtMatch).not.toBeNull();
      expect(cookieMatch).not.toBeNull();

      const initialJwt = jwtMatch![1];
      const initialCookie = cookieMatch![1];

      // Mutate one non-secret key to test idempotency and preservation of user overrides
      fs.writeFileSync(envPath, generatedEnv.replace("PORT=3001", "PORT=4000"), "utf-8");

      // Second run: idempotent; must not overwrite custom changes or re-generate secrets
      execSync(`bash "${scriptPath}" "${tempDir}"`, { stdio: "pipe" });

      const secondRunEnv = fs.readFileSync(envPath, "utf-8");
      expect(secondRunEnv).toContain("PORT=4000");

      const secondJwtMatch = secondRunEnv.match(/^JWT_SECRET=([a-f0-9]{64})$/m);
      const secondCookieMatch = secondRunEnv.match(/^COOKIE_SECRET=([a-f0-9]{64})$/m);
      expect(secondJwtMatch![1]).toBe(initialJwt);
      expect(secondCookieMatch![1]).toBe(initialCookie);

      // Third run: test populating empty quoted secrets
      fs.writeFileSync(envPath, secondRunEnv.replace(/^JWT_SECRET=.*$/m, 'JWT_SECRET=""'), "utf-8");
      execSync(`bash "${scriptPath}" "${tempDir}"`, { stdio: "pipe" });
      const thirdRunEnv = fs.readFileSync(envPath, "utf-8");
      const repopulatedJwtMatch = thirdRunEnv.match(/^JWT_SECRET=([a-f0-9]{64})$/m);
      expect(repopulatedJwtMatch).not.toBeNull();
      expect(repopulatedJwtMatch![1]).not.toBe("");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("adheres to 42-style Makefile target contract and prerequisite resolution", () => {
    const repoRoot = path.resolve(__dirname, "../../..");
    const makefilePath = path.resolve(repoRoot, "Makefile");

    expect(fs.existsSync(makefilePath)).toBe(true);

    const helpOutput = execSync("make help", { cwd: repoRoot, encoding: "utf-8" });
    expect(helpOutput).toContain("all");
    expect(helpOutput).toContain("clean");
    expect(helpOutput).toContain("fclean");
    expect(helpOutput).toContain("re");
    expect(helpOutput).toContain("dev");
    expect(helpOutput).toContain("check");

    const requiredTargets = [
      "all",
      "clean",
      "fclean",
      "re",
      "env",
      "dev",
      "test",
      "test-e2e",
      "lint",
      "typecheck",
      "check",
      "ci",
      "up",
      "down",
      "logs",
      "migrate",
      "seed",
      "health",
    ];

    for (const target of requiredTargets) {
      const dryRun = execSync(`make -n ${target}`, { cwd: repoRoot, encoding: "utf-8" });
      expect(dryRun.length).toBeGreaterThan(0);
    }

    // Verify key target command semantics in dry-run output
    expect(execSync("make -n all", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/pnpm install/);
    expect(execSync("make -n all", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/docker compose up/);
    expect(execSync("make -n clean", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/rm -rf/);
    expect(execSync("make -n clean", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/docker compose stop/);
    expect(execSync("make -n fclean", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/node_modules/);
    expect(execSync("make -n fclean", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/docker compose down -v/);
    expect(execSync("make -n env", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/setup-env\.sh/);
    expect(execSync("make -n dev", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/pnpm dev/);
    expect(execSync("make -n test", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/pnpm test/);
    expect(execSync("make -n test-e2e", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/test:e2e/);
    expect(execSync("make -n check", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/pnpm lint/);
    expect(execSync("make -n check", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/pnpm typecheck/);
    expect(execSync("make -n check", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/pnpm test/);
    expect(execSync("make -n up", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/docker compose up -d --wait/);
    expect(execSync("make -n down", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/docker compose down/);
    expect(execSync("make -n logs", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/docker compose logs -f/);
    expect(execSync("make -n migrate", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/db:migrate/);
    expect(execSync("make -n seed", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/db:seed/);
    expect(execSync("make -n health", { cwd: repoRoot, encoding: "utf-8" })).toMatch(/health/);
  });
});
