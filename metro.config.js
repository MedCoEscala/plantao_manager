const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Desabilitar package.json exports - problema conhecido no SDK 53
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
