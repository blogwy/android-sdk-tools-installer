'use strict'

var os = require('os');
var path = require('path');

const getAndroidSdkToolsPath = (type) => {
  const typeMap = {
    adb: 'adb',
    fastboot: 'fastboot'
  };
  if (!typeMap[type]) {
    throw new Error('Type arg error');
  };
  var platform = process.env.npm_config_platform || os.platform();
  if (platform !== 'darwin' && platform !== 'linux' && platform !== 'win32') {
    throw new Error('Current platform is not supported');
  }
  var toolsPath = path.join(
    __dirname,
    platform,
    platform === 'win32' ? `${typeMap[type]}.exe` : typeMap[type]
  );
  return toolsPath;
}

const getAndroidSdkToolsDir = () => {
  var platform = process.env.npm_config_platform || os.platform();
  if (platform !== 'darwin' && platform !== 'linux' && platform !== 'win32') {
    throw new Error('Current platform is not supported');
  }
  var toolsDir = path.join(
    __dirname,
    platform
  );
  return toolsDir;
}

module.exports = {
  getAndroidSdkToolsPath,
  getAndroidSdkToolsDir
}
