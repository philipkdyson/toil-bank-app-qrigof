
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useToilData } from '@/hooks/useToilData';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { formatMinutes, snapToFiveMinutes } from '@/types/toil';
import { colors } from '@/styles/commonStyles';

export default function LoggingScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  const { balance, lastAction, addEvent, deleteEvent } = useToilData();
  const { isListening, transcript, error: speechError, startListening, stopListening, resetTranscript } = useSpeechToText();
  
  const [actionType, setActionType] = useState<'ADD' | 'TAKE'>(lastAction);
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [customHours, setCustomHours] = useState('0');
  const [customMinutes, setCustomMinutes] = useState('0');
  const [note, setNote] = useState('');
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  const snackbarAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;

  // Update action type when lastAction changes
  useEffect(() => {
    setActionType(lastAction);
  }, [lastAction]);

  // Update note when transcript changes
  useEffect(() => {
    if (transcript) {
      setNote(prev => {
        const newNote = prev ? `${prev} ${transcript}` : transcript;
        return newNote.trim();
      });
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Animate microphone when listening
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      micPulseAnim.setValue(1);
    }
  }, [isListening, micPulseAnim]);

  // Quick time buttons (in minutes)
  const quickTimes = [15, 30, 45, 60, 90, 120];

  const totalBalanceDisplay = formatMinutes(balance.balance);
  const availableBalanceDisplay = formatMinutes(balance.availableBalance);
  const selectedDisplay = formatMinutes(selectedMinutes);

  const handleQuickTimeSelect = (minutes: number) => {
    console.log('User selected quick time:', minutes);
    setSelectedMinutes(minutes);
    setShowCustomTime(false);
  };

  const handleCustomTimeChange = () => {
    const hours = parseInt(customHours) || 0;
    const mins = parseInt(customMinutes) || 0;
    const totalMinutes = hours * 60 + mins;
    const snappedMinutes = snapToFiveMinutes(totalMinutes);
    
    console.log('Custom time changed:', { hours, mins, totalMinutes, snappedMinutes });
    setSelectedMinutes(snappedMinutes);
  };

  const handleMicPress = async () => {
    console.log('User tapped microphone button');
    
    if (isListening) {
      console.log('Stopping speech recognition');
      stopListening();
    } else {
      console.log('Starting speech recognition');
      try {
        await startListening();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        // Silently fail - user can still type manually
      }
    }
  };

  const handleSubmit = async () => {
    const now = Date.now();
    
    // Prevent double-tap (within 2 seconds)
    if (now - lastSubmitTime < 2000) {
      console.log('Ignoring double-tap');
      return;
    }
    
    console.log('User tapped submit button:', { actionType, selectedMinutes, note });
    setLastSubmitTime(now);

    if (selectedMinutes === 0) {
      console.log('Cannot submit 0 minutes');
      return;
    }

    // Stop listening if still active
    if (isListening) {
      stopListening();
    }

    try {
      const event = await addEvent(actionType, selectedMinutes, note || undefined);
      setLastEventId(event.id);
      
      // Clear note after submission
      setNote('');
      
      // Show snackbar with undo option
      setShowSnackbar(true);
      Animated.sequence([
        Animated.timing(snackbarAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(10000),
        Animated.timing(snackbarAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSnackbar(false);
        setLastEventId(null);
      });
    } catch (error) {
      console.error('Error submitting TOIL event:', error);
    }
  };

  const handleUndo = async () => {
    console.log('User tapped undo');
    if (lastEventId) {
      await deleteEvent(lastEventId);
      setShowSnackbar(false);
      setLastEventId(null);
      Animated.timing(snackbarAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const actionTypeText = actionType === 'ADD' ? 'ADD' : 'TAKE';
  const buttonLabel = `${actionTypeText} ${selectedDisplay}`;
  const buttonColor = actionType === 'ADD' ? themeColors.success : themeColors.warning;

  const snackbarMessage = `TOIL updated · Available ${availableBalanceDisplay}`;
  const micIconColor = isListening ? themeColors.success : themeColors.primary;

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Balance */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: themeColors.textSecondary }]}>
              Total Balance
            </Text>
            <Text style={[styles.balanceText, { color: themeColors.text }]}>
              {totalBalanceDisplay}
            </Text>
            <View style={styles.availableBalanceContainer}>
              <Text style={[styles.availableBalanceLabel, { color: themeColors.textSecondary }]}>
                Available Balance
              </Text>
              <Text style={[styles.availableBalanceText, { color: themeColors.success }]}>
                {availableBalanceDisplay}
              </Text>
            </View>
          </View>

          {/* Segmented Control - ADD/TAKE */}
          <View style={[styles.segmentedControl, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <TouchableOpacity
              style={[
                styles.segment,
                actionType === 'ADD' && { backgroundColor: themeColors.success },
              ]}
              onPress={() => {
                console.log('User switched to ADD');
                setActionType('ADD');
              }}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: actionType === 'ADD' ? '#FFFFFF' : themeColors.text },
                ]}
              >
                ADD TIME
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segment,
                actionType === 'TAKE' && { backgroundColor: themeColors.warning },
              ]}
              onPress={() => {
                console.log('User switched to TAKE');
                setActionType('TAKE');
              }}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: actionType === 'TAKE' ? '#FFFFFF' : themeColors.text },
                ]}
              >
                TAKE TIME
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Time Buttons */}
          <View style={styles.quickTimesContainer}>
            {quickTimes.map((minutes) => {
              const isSelected = selectedMinutes === minutes && !showCustomTime;
              const displayText = formatMinutes(minutes);
              
              return (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.quickTimeButton,
                    { 
                      backgroundColor: isSelected ? themeColors.primary : themeColors.card,
                      borderColor: themeColors.border,
                    },
                  ]}
                  onPress={() => handleQuickTimeSelect(minutes)}
                >
                  <Text
                    style={[
                      styles.quickTimeText,
                      { color: isSelected ? '#FFFFFF' : themeColors.text },
                    ]}
                  >
                    {displayText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Time Toggle */}
          <TouchableOpacity
            style={styles.customTimeToggle}
            onPress={() => {
              console.log('User toggled custom time');
              setShowCustomTime(!showCustomTime);
            }}
          >
            <Text style={[styles.customTimeToggleText, { color: themeColors.primary }]}>
              {showCustomTime ? 'Hide' : 'Custom time'}
            </Text>
            <IconSymbol
              ios_icon_name={showCustomTime ? 'chevron.up' : 'chevron.down'}
              android_material_icon_name={showCustomTime ? 'expand-less' : 'expand-more'}
              size={20}
              color={themeColors.primary}
            />
          </TouchableOpacity>

          {/* Custom Time Input */}
          {showCustomTime && (
            <View style={[styles.customTimeContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
              <View style={styles.customTimeRow}>
                <View style={styles.customTimeInput}>
                  <TextInput
                    style={[styles.customTimeTextInput, { color: themeColors.text, borderColor: themeColors.border }]}
                    value={customHours}
                    onChangeText={(text) => {
                      setCustomHours(text);
                      handleCustomTimeChange();
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="0"
                    placeholderTextColor={themeColors.textSecondary}
                  />
                  <Text style={[styles.customTimeLabel, { color: themeColors.textSecondary }]}>
                    hours
                  </Text>
                </View>
                <View style={styles.customTimeInput}>
                  <TextInput
                    style={[styles.customTimeTextInput, { color: themeColors.text, borderColor: themeColors.border }]}
                    value={customMinutes}
                    onChangeText={(text) => {
                      setCustomMinutes(text);
                      handleCustomTimeChange();
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="0"
                    placeholderTextColor={themeColors.textSecondary}
                  />
                  <Text style={[styles.customTimeLabel, { color: themeColors.textSecondary }]}>
                    minutes
                  </Text>
                </View>
              </View>
              <Text style={[styles.customTimeNote, { color: themeColors.textSecondary }]}>
                Minutes snap down to 5-min increments
              </Text>
            </View>
          )}

          {/* Note Input */}
          <View style={[styles.noteContainer, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <TextInput
              style={[styles.noteInput, { color: themeColors.text }]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              placeholderTextColor={themeColors.textSecondary}
              multiline
              maxLength={200}
            />
            <TouchableOpacity
              style={styles.micButton}
              onPress={handleMicPress}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: micPulseAnim }] }}>
                <IconSymbol
                  ios_icon_name={isListening ? 'mic.fill' : 'mic.fill'}
                  android_material_icon_name={isListening ? 'mic' : 'mic'}
                  size={24}
                  color={micIconColor}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>

          {/* Listening indicator */}
          {isListening && (
            <View style={styles.listeningIndicator}>
              <Text style={[styles.listeningText, { color: themeColors.success }]}>
                Listening...
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: buttonColor }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {buttonLabel}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Snackbar */}
        {showSnackbar && (
          <Animated.View
            style={[
              styles.snackbar,
              { 
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
                transform: [
                  {
                    translateY: snackbarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [100, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={[styles.snackbarText, { color: themeColors.text }]}>
              {snackbarMessage}
            </Text>
            <TouchableOpacity onPress={handleUndo}>
              <Text style={[styles.snackbarUndo, { color: themeColors.primary }]}>
                UNDO
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 60,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  availableBalanceContainer: {
    marginTop: 16,
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    width: '100%',
  },
  availableBalanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  availableBalanceText: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  quickTimesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  quickTimeButton: {
    width: '30%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  quickTimeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  customTimeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  customTimeToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  customTimeContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
  },
  customTimeRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  customTimeInput: {
    flex: 1,
  },
  customTimeTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  customTimeLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  customTimeNote: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  noteInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 40,
  },
  micButton: {
    padding: 8,
  },
  listeningIndicator: {
    alignItems: 'center',
    marginBottom: 16,
  },
  listeningText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  snackbar: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  snackbarText: {
    fontSize: 14,
    fontWeight: '500',
  },
  snackbarUndo: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
