const { withAppDelegate } = require('@expo/config-plugins');

function withReleaseLogging(config) {
  return withAppDelegate(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes('RCTSetLogThreshold')) {
      // 1. Add RCTLog header import
      if (!contents.includes('<React/RCTLog.h>')) {
        contents = contents.replace(
          '#import "AppDelegate.h"',
          '#import "AppDelegate.h"\n#import <React/RCTLog.h>'
        );
      }
      // 2. Insert RCTSetLogThreshold at start of didFinishLaunchingWithOptions
      const targetPattern = /didFinishLaunchingWithOptions:\s*\(NSDictionary\s*\*\)launchOptions\s*\{/;
      if (targetPattern.test(contents)) {
        contents = contents.replace(
          targetPattern,
          'didFinishLaunchingWithOptions:(NSDictionary *)launchOptions\n{\n  RCTSetLogThreshold(RCTLogLevelInfo);'
        );
      }
      modConfig.modResults.contents = contents;
    }
    return modConfig;
  });
}

module.exports = withReleaseLogging;
