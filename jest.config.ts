import type {Config} from 'jest';

const config: Config = {
  verbose: true,
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ["<rootDir>/.jest/setEnvVars.ts"]
};

export default config;
