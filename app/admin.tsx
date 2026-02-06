
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { apiPut } from '@/utils/api';

export default function AdminScreen() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'manager'>('manager');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handlePromoteUser = async () => {
    if (!email.trim()) {
      setMessage('Please enter an email address');
      setMessageType('error');
      return;
    }

    console.log('AdminScreen: Promoting user:', email, 'to role:', role);
    setLoading(true);
    setMessage('');

    try {
      const response = await apiPut<{
        success: boolean;
        user: { id: string; email: string; name: string; role: string };
      }>('/api/admin/promote-user', {
        email: email.trim(),
        role: role,
      });

      console.log('AdminScreen: User promoted successfully:', response);
      const userName = response.user.name || 'User';
      const roleDisplay = response.user.role === 'manager' ? 'Manager' : 'User';
      setMessage(`✓ ${userName} (${response.user.email}) promoted to ${roleDisplay}`);
      setMessageType('success');
      setEmail('');
    } catch (error) {
      console.error('AdminScreen: Failed to promote user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessage(`✗ Failed to promote user: ${errorMessage}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Admin Panel',
          headerShown: true,
          headerStyle: {
            backgroundColor: isDark ? colors.backgroundDark : colors.backgroundLight,
          },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: Platform.OS === 'ios' ? 0 : 16 }}
            >
              <IconSymbol
                ios_icon_name="chevron.left"
                android_material_icon_name="arrow-back"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isDark ? colors.cardDark : colors.cardLight },
              ]}
            >
              <IconSymbol
                ios_icon_name="person.badge.shield.checkmark.fill"
                android_material_icon_name="admin-panel-settings"
                size={48}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              User Role Management
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Promote users to manager role
            </Text>
          </View>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: isDark ? colors.cardDark : colors.cardLight,
                borderColor: isDark ? colors.borderDark : colors.borderLight,
              },
            ]}
          >
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Email Address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark
                      ? colors.backgroundDark
                      : colors.backgroundLight,
                    color: colors.text,
                    borderColor: isDark ? colors.borderDark : colors.borderLight,
                  },
                ]}
                placeholder="user@example.com"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                Target Role
              </Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor:
                        role === 'user'
                          ? colors.primary
                          : isDark
                          ? colors.backgroundDark
                          : colors.backgroundLight,
                      borderColor: role === 'user' ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => setRole('user')}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      { color: role === 'user' ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    User
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor:
                        role === 'manager'
                          ? colors.primary
                          : isDark
                          ? colors.backgroundDark
                          : colors.backgroundLight,
                      borderColor: role === 'manager' ? colors.primary : colors.borderLight,
                    },
                  ]}
                  onPress={() => setRole('manager')}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      { color: role === 'manager' ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    Manager
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: loading ? colors.textSecondary : colors.primary,
                },
              ]}
              onPress={handlePromoteUser}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <IconSymbol
                    ios_icon_name="checkmark.shield.fill"
                    android_material_icon_name="verified"
                    size={24}
                    color="#FFFFFF"
                  />
                  <Text style={styles.submitButtonText}>Update Role</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {message ? (
            <View
              style={[
                styles.messageCard,
                {
                  backgroundColor: isDark ? colors.cardDark : colors.cardLight,
                  borderColor:
                    messageType === 'success' ? colors.success : colors.error,
                },
              ]}
            >
              <IconSymbol
                ios_icon_name={
                  messageType === 'success'
                    ? 'checkmark.circle.fill'
                    : 'exclamationmark.triangle.fill'
                }
                android_material_icon_name={
                  messageType === 'success' ? 'check-circle' : 'error'
                }
                size={24}
                color={messageType === 'success' ? colors.success : colors.error}
              />
              <Text
                style={[
                  styles.messageText,
                  {
                    color: messageType === 'success' ? colors.success : colors.error,
                  },
                ]}
              >
                {message}
              </Text>
            </View>
          ) : null}

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? colors.cardDark : colors.cardLight,
                borderColor: isDark ? colors.borderDark : colors.borderLight,
              },
            ]}
          >
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color={colors.primary}
            />
            <View style={styles.infoTextContainer}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                About Roles
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • <Text style={{ fontWeight: '600' }}>Manager:</Text> Can approve/reject TOIL requests from team members
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                • <Text style={{ fontWeight: '600' }}>User:</Text> Can log TOIL but requires manager approval
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 40,
  },
  content: {
    paddingTop: Platform.OS === 'android' ? 24 : 0,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  formCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});
