
import { useState, useEffect, useRef } from 'react';
import { NativeModules, NativeEventEmitter, PermissionsAndroid } from 'react-native';

interface UseSpeechToTextResult {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechToText(): UseSpeechToTextResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if native speech recognition module is available
    const SpeechRecognition = NativeModules.SpeechRecognition;
    
    if (SpeechRecognition) {
      const eventEmitter = new NativeEventEmitter(SpeechRecognition);
      
      const resultListener = eventEmitter.addListener('onSpeechResults', (event: any) => {
        console.log('Android Speech recognition result:', event);
        if (event.value && event.value.length > 0) {
          const newTranscript = event.value[0];
          setTranscript(prev => prev + newTranscript + ' ');
          
          // Reset silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          // Auto-stop after 2 seconds of silence
          silenceTimerRef.current = setTimeout(() => {
            console.log('Auto-stopping after silence');
            SpeechRecognition.stopSpeech();
          }, 2000);
        }
      });

      const errorListener = eventEmitter.addListener('onSpeechError', (event: any) => {
        console.error('Android Speech recognition error:', event);
        setError(event.error?.message || 'Speech recognition error');
        setIsListening(false);
      });

      const endListener = eventEmitter.addListener('onSpeechEnd', () => {
        console.log('Android Speech recognition ended');
        setIsListening(false);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
      });

      recognitionRef.current = SpeechRecognition;

      return () => {
        resultListener.remove();
        errorListener.remove();
        endListener.remove();
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
      };
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'TOIL Bank needs access to your microphone for speech-to-text functionality.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting microphone permission:', err);
      return false;
    }
  };

  const startListening = async () => {
    console.log('Starting Android speech recognition');
    setError(null);
    setTranscript('');

    try {
      const SpeechRecognition = NativeModules.SpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Speech recognition module not available');
      }

      // Request microphone permission
      const hasPermission = await requestMicrophonePermission();
      
      if (!hasPermission) {
        throw new Error('Microphone permission denied');
      }

      // Start recognition
      await SpeechRecognition.startSpeech('en-US');
      setIsListening(true);
    } catch (err: any) {
      console.error('Error starting Android speech recognition:', err);
      setError(err.message || 'Failed to start speech recognition');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    console.log('Stopping Android speech recognition');
    const SpeechRecognition = NativeModules.SpeechRecognition;
    
    if (SpeechRecognition && isListening) {
      SpeechRecognition.stopSpeech();
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    
    setIsListening(false);
  };

  const resetTranscript = () => {
    setTranscript('');
    setError(null);
  };

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
