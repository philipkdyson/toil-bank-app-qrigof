
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmModal } from '@/components/IconCircle';
import { authenticatedGet } from '@/utils/api';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const themeColors = isDark ? colors.dark : colors.light;

  const { user, signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('ProfileScreen: Loading user role');
    loadUserRole();
  }, []);

  const loadUserRole = async () => {
    try {
      console.log('ProfileScreen: Fetching user role');
      const response = await authenticatedGet<{ role: string }>('/api/user/role');
      setUserRole(response.role);
      console.log('ProfileScreen: User role loaded:', response.role);
    } catch (error) {
      console.error('ProfileScreen: Failed to load user role:', error);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('ProfileScreen: User signing out');
      await signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('ProfileScreen: Sign out error:', error);
    }
  };

  const handleAdminPanel = () => {
    console.log('ProfileScreen: Navigating to admin panel');
    router.push('/admin');
  };

  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const roleDisplay = userRole === 'manager' ? 'Manager' : 'Team Member';
  const roleIcon = userRole === 'manager' ? 'verified' : 'person';

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerShown: true,
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTintColor: themeColors.text,
        }}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
          <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          <View style={styles.profileHeader}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: themeColors.card },
              ]}
            >
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={48}
                color={themeColors.primary}
              />
            </View>
            <Text style={[styles.userName, { color: themeColors.text }]}>
              {userName}
            </Text>
            <Text style={[styles.userEmail, { color: themeColors.textSecondary }]}>
              {userEmail}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="person.badge.shield.checkmark.fill"
                  android_material_icon_name={roleIcon}
                  size={24}
                  color={userRole === 'manager' ? themeColors.success : themeColors.primary}
                />
                <View style={styles.infoText}>
                  <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]}>
                    Role
                  </Text>
                  <Text style={[styles.infoValue, { color: themeColors.text }]}>
                    {roleDisplay}
                  </Text>
                </View>
              </View>
            </View>

            {userRole === 'manager' && (
              <View
                style={[
                  styles.managerNote,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.success,
                  },
                ]}
              >
                <IconSymbol
                  ios_icon_name="checkmark.shield.fill"
                  android_material_icon_name="verified"
                  size={20}
                  color={themeColors.success}
                />
                <Text style={[styles.managerNoteText, { color: themeColors.text }]}>
                  You have manager permissions to approve TOIL requests
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            {userRole === 'manager' && (
              <TouchableOpacity
                style={[
                  styles.adminButton,
                  {
                    backgroundColor: themeColors.card,
                    borderColor: themeColors.primary,
                  },
                ]}
                onPress={handleAdminPanel}
              >
                <IconSymbol
                  ios_icon_name="person.badge.shield.checkmark.fill"
                  android_material_icon_name="admin-panel-settings"
                  size={24}
                  color={themeColors.primary}
                />
                <Text style={[styles.adminButtonText, { color: themeColors.primary }]}>
                  Admin Panel
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.signOutButton,
                {
                  backgroundColor: themeColors.card,
                  borderColor: themeColors.error,
                },
              ]}
              onPress={() => setShowSignOutModal(true)}
            >
              <IconSymbol
                ios_icon_name="rectangle.portrait.and.arrow.right"
                android_material_icon_name="logout"
                size={24}
                color={themeColors.error}
              />
              <Text style={[styles.signOutText, { color: themeColors.error }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <ConfirmModal
        visible={showSignOutModal}
        title="Sign Out"
        message="Are you sure you want to sign out? Your data will remain saved."
        onConfirm={() => {
          setShowSignOutModal(false);
          handleSignOut();
        }}
        onCancel={() => setShowSignOutModal(false)}
        confirmText="Sign Out"
        cancelText="Cancel"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  infoCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  managerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  managerNoteText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 100,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  adminButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  signOutText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
