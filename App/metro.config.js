const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname)

config.resolver.blockList = [
  /node_modules\/@react-native\/debugger-frontend\/.*/,
  /node_modules\/@xmldom\/xmldom\/.*/,
]

module.exports = withNativeWind(config, { input: './global.css' })