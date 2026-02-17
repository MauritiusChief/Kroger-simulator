module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src"],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setupTests.ts"],
  moduleNameMapper: {
    "^@kroger-mini/contracts$": "<rootDir>/../../packages/contracts/src/index.ts",
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "\\.(css|less|scss)$": "<rootDir>/src/test/styleMock.ts"
  }
};
