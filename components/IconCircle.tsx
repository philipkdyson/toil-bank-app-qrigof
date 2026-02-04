import React from "react";
import { View, ViewStyle, Text, Modal, StyleSheet, useColorScheme } from "react-native";
import { colors } from '@/styles/commonStyles';
import { Button } from '@/components/button';

interface IconCircleProps {
  emoji: string;
  backgroundColor?: string;
  size?: number;
  style?: ViewStyle;
}

export function IconCircle({
  emoji,
  backgroundColor = "lightblue",
  size = 48,
  style,
}: IconCircleProps) {
  return (
    <View
      style={[
        {
          backgroundColor,
          width: size,
          height: size,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
    </View>
  );
}

// Custom Modal Component for confirmations (replaces Alert.alert)
interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'filled' | 'outline';
}

export function ConfirmModal({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'filled',
}: ConfirmModalProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={modalStyles.overlay}>
        <View style={[modalStyles.container, { backgroundColor: themeColors.card }]}>
          <Text style={[modalStyles.title, { color: themeColors.text }]}>{title}</Text>
          <Text style={[modalStyles.message, { color: themeColors.textSecondary }]}>
            {message}
          </Text>
          <View style={modalStyles.buttons}>
            <Button
              onPress={onCancel}
              variant="outline"
              style={modalStyles.button}
            >
              {cancelText}
            </Button>
            <Button
              onPress={onConfirm}
              variant={confirmVariant}
              style={modalStyles.button}
            >
              {confirmText}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
