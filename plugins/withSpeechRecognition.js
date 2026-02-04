
const { withInfoPlist, withAndroidManifest } = require('@expo/config-plugins');

/**
 * Add speech recognition permissions to iOS Info.plist
 */
function withSpeechRecognitionIOS(config) {
  return withInfoPlist(config, (config) => {
    config.modResults.NSSpeechRecognitionUsageDescription =
      config.modResults.NSSpeechRecognitionUsageDescription ||
      'TOIL Bank uses speech recognition to convert your spoken notes into text.';
    config.modResults.NSMicrophoneUsageDescription =
      config.modResults.NSMicrophoneUsageDescription ||
      'TOIL Bank needs access to your microphone for speech-to-text functionality.';
    return config;
  });
}

/**
 * Add RECORD_AUDIO permission to Android manifest
 */
function withSpeechRecognitionAndroid(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;

    // Add RECORD_AUDIO permission if not already present
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const hasRecordAudio = androidManifest['uses-permission'].some(
      (permission) => permission.$['android:name'] === 'android.permission.RECORD_AUDIO'
    );

    if (!hasRecordAudio) {
      androidManifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.RECORD_AUDIO' },
      });
    }

    return config;
  });
}

/**
 * Main plugin function
 */
module.exports = function withSpeechRecognition(config) {
  config = withSpeechRecognitionIOS(config);
  config = withSpeechRecognitionAndroid(config);
  return config;
};
