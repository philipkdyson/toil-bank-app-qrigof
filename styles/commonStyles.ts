
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Calm, professional color palette for TOIL Bank
export const colors = {
  // Light theme (default)
  light: {
    primary: '#4A90E2',      // Calm blue
    secondary: '#5C6BC0',    // Muted indigo
    accent: '#7E57C2',       // Soft purple
    background: '#F8F9FA',   // Off-white
    card: '#FFFFFF',         // Pure white
    text: '#2C3E50',         // Dark slate
    textSecondary: '#7F8C8D', // Gray
    border: '#E0E0E0',       // Light gray
    success: '#27AE60',      // Green for ADD
    warning: '#E67E22',      // Orange for TAKE
    error: '#E74C3C',        // Red for errors
  },
  // Dark theme
  dark: {
    primary: '#5C9FD6',      // Lighter blue
    secondary: '#7986CB',    // Lighter indigo
    accent: '#9575CD',       // Lighter purple
    background: '#1A1D23',   // Dark background
    card: '#252930',         // Dark card
    text: '#E8EAED',         // Light text
    textSecondary: '#9AA0A6', // Gray text
    border: '#3C4043',       // Dark border
    success: '#34C759',      // Green for ADD
    warning: '#FF9500',      // Orange for TAKE
    error: '#FF3B30',        // Red for errors
  }
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  card: {
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.light.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    color: colors.light.text,
    lineHeight: 24,
  },
  textSecondary: {
    fontSize: 14,
    color: colors.light.textSecondary,
    lineHeight: 20,
  },
});
