
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const { completeOnboarding } = useOnboarding();

  const handleStart = async () => {
    console.log('User tapped Start using TOIL');
    await completeOnboarding();
    router.replace('/auth');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="clock.fill"
            android_material_icon_name="schedule"
            size={80}
            color={themeColors.primary}
          />
          <Text style={[styles.title, { color: themeColors.text }]}>
            Welcome to TOIL Bank
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Track your Time Off In Lieu with ease
          </Text>
        </View>

        {/* How it works */}
        <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[styles.cardTitle, { color: themeColors.text }]}>
            How it works
          </Text>
          
          <View style={styles.bulletPoint}>
            <View style={[styles.bulletIcon, { backgroundColor: themeColors.success }]}>
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={20}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.bulletText}>
              <Text style={[styles.bulletTitle, { color: themeColors.text }]}>
                Add time
              </Text>
              <Text style={[styles.bulletDescription, { color: themeColors.textSecondary }]}>
                Log extra hours you work beyond your normal schedule
              </Text>
            </View>
          </View>

          <View style={styles.bulletPoint}>
            <View style={[styles.bulletIcon, { backgroundColor: themeColors.warning }]}>
              <IconSymbol
                ios_icon_name="minus"
                android_material_icon_name="remove"
                size={20}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.bulletText}>
              <Text style={[styles.bulletTitle, { color: themeColors.text }]}>
                Take time
              </Text>
              <Text style={[styles.bulletDescription, { color: themeColors.textSecondary }]}>
                Record when you use your banked time for time off
              </Text>
            </View>
          </View>

          <View style={styles.bulletPoint}>
            <View style={[styles.bulletIcon, { backgroundColor: themeColors.primary }]}>
              <IconSymbol
                ios_icon_name="chart.bar.fill"
                android_material_icon_name="bar-chart"
                size={20}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.bulletText}>
              <Text style={[styles.bulletTitle, { color: themeColors.text }]}>
                Track balance
              </Text>
              <Text style={[styles.bulletDescription, { color: themeColors.textSecondary }]}>
                Your balance is always calculated from your event history
              </Text>
            </View>
          </View>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.feature}>
            <IconSymbol
              ios_icon_name="wifi.slash"
              android_material_icon_name="cloud-off"
              size={24}
              color={themeColors.textSecondary}
            />
            <Text style={[styles.featureText, { color: themeColors.textSecondary }]}>
              Works offline
            </Text>
          </View>
          <View style={styles.feature}>
            <IconSymbol
              ios_icon_name="lock.fill"
              android_material_icon_name="lock"
              size={24}
              color={themeColors.textSecondary}
            />
            <Text style={[styles.featureText, { color: themeColors.textSecondary }]}>
              Private & secure
            </Text>
          </View>
          <View style={styles.feature}>
            <IconSymbol
              ios_icon_name="bolt.fill"
              android_material_icon_name="flash-on"
              size={24}
              color={themeColors.textSecondary}
            />
            <Text style={[styles.featureText, { color: themeColors.textSecondary }]}>
              Fast logging
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.footer, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: themeColors.primary }]}
          onPress={handleStart}
        >
          <Text style={styles.primaryButtonText}>
            Start using TOIL
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: Platform.OS === 'android' ? 60 : 80,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  bulletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bulletText: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bulletDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  feature: {
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 1,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
