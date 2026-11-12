const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { localWebTransport } = require("./scripts/local-web-transport.cjs");

const config = getDefaultConfig(__dirname);

const styledConfig = withNativeWind(config, { input: "./global.css" });
const enhanceMiddleware = styledConfig.server.enhanceMiddleware;
styledConfig.server.enhanceMiddleware = (middleware, server) => localWebTransport(
  enhanceMiddleware ? enhanceMiddleware(middleware, server) : middleware
);

module.exports = styledConfig;
