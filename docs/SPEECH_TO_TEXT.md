
# Speech-to-Text Implementation

## Overview

The TOIL Bank app now includes native speech-to-text functionality for the note field on the logging screen. This feature allows users to dictate notes instead of typing them manually.

## Features

- **Platform Support**: Works on iOS, Android, and Web
- **Permission Handling**: Automatically requests microphone and speech recognition permissions on first use
- **Auto-stop**: Automatically stops listening after 2 seconds of silence
- **Visual Feedback**: Microphone icon pulses while listening, with a "Listening..." indicator
- **Graceful Fallback**: If speech recognition fails, users can still type notes manually
- **No Blocking**: Speech recognition failures do not prevent saving TOIL events

## Implementation Details

### iOS
- Uses Apple's Speech framework (SFSpeechRecognizer) via native module
- Requires `NSSpeechRecognitionUsageDescription` and `NSMicrophoneUsageDescription` in Info.plist
- Permissions are requested on first microphone tap

### Android
- Uses Android SpeechRecognizer via native module
- Requires `RECORD_AUDIO` permission in AndroidManifest.xml
- Permission is requested on first microphone tap

### Web
- Uses Web Speech API (SpeechRecognition)
- Works in Chrome, Edge, and Safari
- No permission prompts required (browser handles it)

## User Experience

1. User taps the microphone icon in the note field
2. Permission prompt appears (first time only)
3. Microphone icon turns green and pulses
4. "Listening..." indicator appears below the note field
5. User speaks their note
6. Transcribed text appears in the note field
7. After 2 seconds of silence, listening stops automatically
8. User can tap the microphone again to continue dictating
9. User can tap the microphone while listening to stop manually

## Technical Architecture

### Hook: `useSpeechToText`
- Platform-specific implementations:
  - `hooks/useSpeechToText.ts` (Web)
  - `hooks/useSpeechToText.ios.ts` (iOS)
  - `hooks/useSpeechToText.android.ts` (Android)
- Returns:
  - `isListening`: Boolean indicating if currently listening
  - `transcript`: Current transcribed text
  - `error`: Error message if recognition fails
  - `startListening()`: Start speech recognition
  - `stopListening()`: Stop speech recognition
  - `resetTranscript()`: Clear the transcript

### Native Modules (iOS & Android)
- Module name: `SpeechRecognition`
- Methods:
  - `requestPermissions()`: Request microphone/speech permissions
  - `startSpeech(locale)`: Start listening
  - `stopSpeech()`: Stop listening
- Events:
  - `onSpeechResults`: Emitted when speech is recognized
  - `onSpeechError`: Emitted on error
  - `onSpeechEnd`: Emitted when listening stops

## Configuration

### app.json
```json
{
  "ios": {
    "infoPlist": {
      "NSSpeechRecognitionUsageDescription": "TOIL Bank uses speech recognition to convert your spoken notes into text.",
      "NSMicrophoneUsageDescription": "TOIL Bank needs access to your microphone for speech-to-text functionality."
    }
  },
  "android": {
    "permissions": ["RECORD_AUDIO"]
  },
  "plugins": ["./plugins/withSpeechRecognition"]
}
```

## Error Handling

- Permission denied: Silently falls back to manual typing
- Speech recognition unavailable: Silently falls back to manual typing
- Network errors (Web): Silently falls back to manual typing
- All errors are logged to console for debugging

## Future Enhancements

- Support for multiple languages
- Offline speech recognition (iOS 13+, Android 11+)
- Custom vocabulary for TOIL-specific terms
- Voice commands (e.g., "Add 30 minutes")
