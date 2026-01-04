// plugins/withDevelopmentTeam.js
const { withXcodeProject } = require("@expo/config-plugins");
const { execSync } = require("child_process");

/**
 * Auto-detects the development team from available signing certificates.
 * Falls back to the provided default if detection fails.
 */
function detectDevelopmentTeam(fallbackTeam = null) {
  try {
    // Try to get Apple Development certificates from keychain
    const result = execSync(
      'security find-identity -v -p codesigning | grep "Apple Development\\|iPhone Developer\\|Apple Distribution\\|iPhone Distribution"',
      { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
    );

    // Extract team ID from certificate (format: "Apple Development: Name (TEAM_ID)")
    const match = result.match(/\(([A-Z0-9]{10})\)/);
    if (match && match[1]) {
      console.log(`[withDevelopmentTeam] Auto-detected team ID: ${match[1]}`);
      return match[1];
    }
  } catch (error) {
    console.log(
      "[withDevelopmentTeam] Could not auto-detect team, using fallback"
    );
  }

  if (fallbackTeam) {
    console.log(
      `[withDevelopmentTeam] Using fallback team ID: ${fallbackTeam}`
    );
    return fallbackTeam;
  }

  // Try to read from app.json developmentTeam as last resort
  try {
    const appJson = require("../app.json");
    const team = appJson?.expo?.ios?.developmentTeam;
    if (team) {
      console.log(`[withDevelopmentTeam] Using team from app.json: ${team}`);
      return team;
    }
  } catch (e) {
    // Ignore
  }

  return null;
}

module.exports = function withDevelopmentTeam(config, options = {}) {
  const { fallbackTeam } = options;

  return withXcodeProject(config, (config) => {
    const project = config.modResults;

    // 1. Check app.json first (Explicit config matches Expo behavior)
    let developmentTeam = config.ios?.developmentTeam;

    // 2. Fallback to auto-detection if not specified
    if (!developmentTeam) {
      developmentTeam = detectDevelopmentTeam(fallbackTeam);
    }

    if (!developmentTeam) {
      console.warn('[withDevelopmentTeam] No development team found. Signing may fail.');
      return config;
    }

    console.log(`[withDevelopmentTeam] Using Team ID: ${developmentTeam}`);

    // Get all build configurations for the main target
    const nativeTargets = project.pbxNativeTargetSection();

    for (const key in nativeTargets) {
      const target = nativeTargets[key];
      // Match the target name (without quotes)
      const targetName = target.name?.replace(/"/g, "");
      if (
        targetName === "aetcanvas" ||
        target.productType?.includes("application")
      ) {
        const configurationList =
          project.pbxXCConfigurationList()[target.buildConfigurationList];
        if (configurationList && configurationList.buildConfigurations) {
          configurationList.buildConfigurations.forEach((buildConfig) => {
            const configKey = buildConfig.value;
            const buildSettings =
              project.pbxXCBuildConfigurationSection()[configKey];
            if (buildSettings && buildSettings.buildSettings) {
              buildSettings.buildSettings.DEVELOPMENT_TEAM = developmentTeam;
              buildSettings.buildSettings.CODE_SIGN_STYLE = "Automatic";
              console.log(
                `[withDevelopmentTeam] Set team ${developmentTeam} for config: ${
                  buildSettings.name || configKey
                }`
              );
            }
          });
        }
      }
    }

    return config;
  });
};
