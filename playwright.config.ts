import { defineConfig, devices } from "@playwright/test";
import { authFileFromUrl } from "./tests/e2e/helpers";

const setup = (id: number) => ({
  name: `setup-${id}`,
  testMatch: "auth.setup.ts",
  use: {
    baseURL: `http://localhost:80${id}`,
  },
});

const tests = (id: number) => ({
  name: `tests-${id}`,
  testMatch: /.*\.tests\.ts/,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:80${id}`,
    storageState: authFileFromUrl(`http://localhost:80${id}`),
  },
  dependencies: [`setup-${id}`],
});

export default defineConfig({
  workers: 1,
  testDir: "./tests/e2e",
  timeout: 30_000,

  projects: [setup(27), tests(27), setup(28), tests(28), setup(29), tests(29)],
});
