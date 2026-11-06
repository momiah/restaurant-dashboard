// Metro config for Expo.
// Required for the Firebase JS SDK on Expo SDK 50+: Metro's package-exports resolution
// otherwise picks a Firebase build that doesn't register the auth component on React
// Native ("Component auth has not been registered yet").
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
