module.exports = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@kroger-mini/contracts$": "<rootDir>/../../packages/contracts/src/index.ts",
    "^(\\.{1,2}/.*)\\.js$": "$1"
  }
};
