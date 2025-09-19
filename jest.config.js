const nextJest = require("next/jest");

// Provide the path to your Next.js app to load next.config.js and .env files
const createJestConfig = nextJest({ dir: "./" });

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"], // UNCOMMENT THIS LINE
  testEnvironment: "jest-environment-node", // Use the node environment for API route testing
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  moduleDirectories: ["node_modules", "<rootDir>/"],

  // Mocks for CSS and other assets
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js configuration, which is essential for `app` directory support.
module.exports = createJestConfig(customJestConfig);
