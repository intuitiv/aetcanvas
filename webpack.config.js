const { getDefaultConfig } = require('@expo/webpack-config');

module.exports = async function (env, argv) {
    const config = await getDefaultConfig(env, argv);

    // ---- FIX FOR EXPO SDK 50 + RNW 0.19 ----
    config.resolve.alias = {
        ...(config.resolve.alias || {}),

        // Fix old RNW paths referenced by Expo & NativeWind
        'react-native-web/dist/index': 'react-native-web',
        'react-native-web/dist/exports': 'react-native-web',
        'react-native-web/dist/exports/Platform': 'react-native-web',
        'react-native-web/dist/exports/StyleSheet': 'react-native-web',
        'react-native-web/dist/exports/TouchableOpacity': 'react-native-web',
    };

    return config;
};
