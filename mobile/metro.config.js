const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable the problematic node externals feature that causes Windows issues
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Skip node: protocol imports that cause Windows directory issues
  if (moduleName.startsWith('node:')) {
    return {
      type: 'empty',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
