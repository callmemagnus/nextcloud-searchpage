import { defineConfig, devices } from "@playwright/test";
import { authFileFromUrl } from "./tests/e2e/helpers";

const host = process.env.TARGET_HOST ? process.env.TARGET_HOST : 'localhost'

const setup = (id: number) => ({
  name: `setup-${id}`,
  testMatch: "auth.setup.ts",
  use: {
    baseURL: `http://${host}:80${id}`,
  },
});

const tests = (id: number) => ({
  name: `tests-${id}`,
  testMatch: /.*\.tests\.ts/,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://${host}:80${id}`,
    storageState: authFileFromUrl(`http://${host}:80${id}`),
  },
  dependencies: [`setup-${id}`],
});

export default defineConfig({
  workers: 1,
  testDir: "./tests/e2e",
  timeout: 30_000,

  projects: [
//    setup(26),
//    tests(26),
//    setup(27),
//    tests(27),
    setup(28),
    tests(28),
    setup(29),
    tests(29),
    setup(30),
    tests(30),
    setup(31),
    tests(31),
  ],
});
