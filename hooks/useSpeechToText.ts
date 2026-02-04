
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

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
    // Initialize speech recognition based on platform
    if (Platform.OS === 'web') {
      // Web Speech API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          console.log('Speech recognition result received');
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + ' ';
            } else {
              interimTranscript += transcriptPiece;
            }
          }

          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
            // Reset silence timer on new speech
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
            }
            // Auto-stop after 2 seconds of silence
            silenceTimerRef.current = setTimeout(() => {
              console.log('Auto-stopping after silence');
              recognition.stop();
            }, 2000);
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  const startListening = async () => {
    console.log('Starting speech recognition');
    setError(null);
    setTranscript('');

    try {
      if (Platform.OS === 'web') {
        if (!recognitionRef.current) {
          throw new Error('Speech recognition not supported');
        }
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        // For native platforms, we'll use a native module approach
        // This requires expo-speech-recognition or a custom native module
        // For now, we'll show an error message
        console.log('Native speech recognition not yet implemented');
        setError('Speech recognition is currently only available on web');
      }
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setError(err.message || 'Failed to start speech recognition');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    console.log('Stopping speech recognition');
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
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
