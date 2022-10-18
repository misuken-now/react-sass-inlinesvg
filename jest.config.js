const esmPackages = ["p-settle", "p-reflect", "p-limit", "yocto-queue"];

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  roots: ["<rootDir>/src/"],
  transform: {
    "\\.jsx?$": "babel-jest",
    "\\.tsx?$": "ts-jest",
  },
  transformIgnorePatterns: [
    // esmが使われているパッケージを除いてIgnoreする
    `node_modules/(?!(${esmPackages.join("|")})/)`,
  ],
  verbose: true,
};
