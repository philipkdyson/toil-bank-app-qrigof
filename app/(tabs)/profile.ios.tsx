
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
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

  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const roleDisplay = userRole === 'manager' ? 'Manager' : 'Team Member';
  const roleIcon = userRole === 'manager' ? 'verified' : 'person';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerShown: true,
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.backgroundLight,
          },
          headerTintColor: colors.text,
        }}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.profileHeader}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: isDark ? colors.cardDark : colors.cardLight },
              ]}
            >
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userName}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {userEmail}
            </Text>
          </View>

          <View style={styles.infoSection}>
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDark ? colors.cardDark : colors.cardLight,
                  borderColor: isDark ? colors.borderDark : colors.borderLight,
                },
              ]}
            >
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="person.badge.shield.checkmark.fill"
                  android_material_icon_name={roleIcon}
                  size={24}
                  color={userRole === 'manager' ? colors.success : colors.primary}
                />
                <View style={styles.infoText}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    Role
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
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
                    backgroundColor: isDark ? colors.cardDark : colors.cardLight,
                    borderColor: colors.success,
                  },
                ]}
              >
                <IconSymbol
                  ios_icon_name="checkmark.shield.fill"
                  android_material_icon_name="verified"
                  size={20}
                  color={colors.success}
                />
                <Text style={[styles.managerNoteText, { color: colors.text }]}>
                  You have manager permissions to approve TOIL requests
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.signOutButton,
                {
                  backgroundColor: isDark ? colors.cardDark : colors.cardLight,
                  borderColor: colors.error,
                },
              ]}
              onPress={() => setShowSignOutModal(true)}
            >
              <IconSymbol
                ios_icon_name="rectangle.portrait.and.arrow.right"
                android_material_icon_name="logout"
                size={24}
                color={colors.error}
              />
              <Text style={[styles.signOutText, { color: colors.error }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  },
  signOutText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
