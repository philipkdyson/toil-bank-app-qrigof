
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { PendingToilEvent } from '@/types/toil';
import { formatMinutes, formatDateGroup } from '@/types/toil';
import { authenticatedGet, authenticatedPut } from '@/utils/api';

interface EventSection {
  title: string;
  data: PendingToilEvent[];
}

export default function ApprovalsScreen() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const isDark = colorScheme === 'dark';

  const [pendingEvents, setPendingEvents] = useState<PendingToilEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    console.log('ApprovalsScreen: Checking user role and loading pending events');
    checkUserRole();
    loadPendingEvents();
  }, []);

  const checkUserRole = async () => {
    try {
      console.log('ApprovalsScreen: Fetching user role');
      const response = await authenticatedGet<{ role: string }>('/api/user/role');
      const userIsManager = response.role === 'manager';
      setIsManager(userIsManager);
      console.log('ApprovalsScreen: User role:', response.role, 'isManager:', userIsManager);
    } catch (error) {
      console.error('ApprovalsScreen: Failed to check user role:', error);
      setIsManager(false);
    }
  };

  const loadPendingEvents = async () => {
    try {
      console.log('ApprovalsScreen: Loading pending events');
      setLoading(true);
      const events = await authenticatedGet<PendingToilEvent[]>('/api/toil/events/pending');
      console.log('ApprovalsScreen: Loaded pending events:', events.length);
      setPendingEvents(events);
    } catch (error) {
      console.error('ApprovalsScreen: Failed to load pending events:', error);
      setPendingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId: string) => {
    try {
      console.log('ApprovalsScreen: Approving event:', eventId);
      setProcessingId(eventId);
      await authenticatedPut(`/api/toil/events/${eventId}/approve`, {});
      console.log('ApprovalsScreen: Event approved successfully');
      
      // Remove from pending list
      setPendingEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('ApprovalsScreen: Failed to approve event:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (eventId: string) => {
    try {
      console.log('ApprovalsScreen: Rejecting event:', eventId);
      setProcessingId(eventId);
      await authenticatedPut(`/api/toil/events/${eventId}/reject`, {});
      console.log('ApprovalsScreen: Event rejected successfully');
      
      // Remove from pending list
      setPendingEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('ApprovalsScreen: Failed to reject event:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const groupEventsByDate = (): EventSection[] => {
    const grouped = new Map<string, PendingToilEvent[]>();

    pendingEvents.forEach(event => {
      const dateGroup = formatDateGroup(event.timestamp);
      if (!grouped.has(dateGroup)) {
        grouped.set(dateGroup, []);
      }
      grouped.get(dateGroup)!.push(event);
    });

    const sections: EventSection[] = [];
    grouped.forEach((data, title) => {
      sections.push({ title, data });
    });

    return sections;
  };

  const renderEventItem = ({ item }: { item: PendingToilEvent }) => {
    const isProcessing = processingId === item.id;
    const typePrefix = item.type === 'ADD' ? '+' : '−';
    const typeColor = item.type === 'ADD' ? colors.success : colors.error;
    const formattedMinutes = formatMinutes(item.minutes);
    const userName = item.user_name || 'Unknown User';
    const userEmail = item.user_email || '';
    const noteText = item.note || '';

    return (
      <View
        style={[
          styles.eventItem,
          {
            backgroundColor: isDark ? colors.cardDark : colors.cardLight,
            borderColor: isDark ? colors.borderDark : colors.borderLight,
          },
        ]}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventTypeContainer}>
            <Text style={[styles.eventType, { color: typeColor }]}>
              {typePrefix}
            </Text>
            <Text style={[styles.eventMinutes, { color: typeColor }]}>
              {formattedMinutes}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userName}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
              {userEmail}
            </Text>
          </View>
        </View>

        {noteText.length > 0 && (
          <Text style={[styles.eventNote, { color: colors.textSecondary }]}>
            {noteText}
          </Text>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.rejectButton, { opacity: isProcessing ? 0.5 : 1 }]}
            onPress={() => handleReject(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={20}
                  color={colors.error}
                />
                <Text style={[styles.buttonText, { color: colors.error }]}>
                  Reject
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.approveButton, { opacity: isProcessing ? 0.5 : 1 }]}
            onPress={() => handleApprove(item.id)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.success} />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={20}
                  color={colors.success}
                />
                <Text style={[styles.buttonText, { color: colors.success }]}>
                  Approve
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: EventSection }) => {
    return (
      <View
        style={[
          styles.sectionHeader,
          { backgroundColor: isDark ? colors.backgroundDark : colors.backgroundLight },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {section.title}
        </Text>
      </View>
    );
  };

  const sections = groupEventsByDate();
  const pendingCount = pendingEvents.length;
  const headerTitle = isManager ? 'Pending Approvals' : 'Approvals';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          title: headerTitle,
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
      ) : !isManager ? (
        <View style={styles.centerContainer}>
          <IconSymbol
            ios_icon_name="lock.fill"
            android_material_icon_name="lock"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Manager Access Only
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            You need manager permissions to approve TOIL requests.
          </Text>
        </View>
      ) : pendingCount === 0 ? (
        <View style={styles.centerContainer}>
          <IconSymbol
            ios_icon_name="checkmark.circle.fill"
            android_material_icon_name="check-circle"
            size={64}
            color={colors.success}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            All Caught Up!
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            No pending TOIL requests to review.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
        />
      )}
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
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventItem: {
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventType: {
    fontSize: 24,
    fontWeight: '700',
    marginRight: 8,
  },
  eventMinutes: {
    fontSize: 20,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  eventNote: {
    fontSize: 14,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    gap: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.success,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
