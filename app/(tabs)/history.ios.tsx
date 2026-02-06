
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SectionList,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useToilData } from '@/hooks/useToilData';
import { formatMinutes, formatDateGroup, isToday } from '@/types/toil';
import { colors } from '@/styles/commonStyles';
import { ToilEvent } from '@/types/toil';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmModal } from '@/components/IconCircle';

interface EventSection {
  title: string;
  data: ToilEvent[];
}

export default function HistoryScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? colors.dark : colors.light;
  const router = useRouter();

  const { events, balance } = useToilData();
  const { user, signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const balanceDisplay = formatMinutes(balance.balance);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Group events by date
  const groupedEvents: EventSection[] = React.useMemo(() => {
    const groups: { [key: string]: ToilEvent[] } = {};
    
    events.forEach(event => {
      const dateKey = formatDateGroup(event.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    
    return Object.entries(groups).map(([title, data]) => ({
      title,
      data,
    }));
  }, [events]);

  const renderEventItem = ({ item }: { item: ToilEvent }) => {
    const eventIsToday = isToday(item.timestamp);
    const eventDate = new Date(item.timestamp);
    const timeString = eventDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
    });
    
    const prefix = item.type === 'ADD' ? '+' : '−';
    const displayMinutes = formatMinutes(item.minutes);
    const eventColor = item.type === 'ADD' ? themeColors.success : themeColors.warning;
    
    const statusText = item.status || 'PENDING';
    let statusColor = themeColors.textSecondary;
    let statusIconIos = 'clock.fill';
    let statusIconAndroid = 'schedule';
    
    if (statusText === 'APPROVED') {
      statusColor = themeColors.success;
      statusIconIos = 'checkmark.circle.fill';
      statusIconAndroid = 'check-circle';
    } else if (statusText === 'REJECTED') {
      statusColor = themeColors.error;
      statusIconIos = 'xmark.circle.fill';
      statusIconAndroid = 'cancel';
    }

    return (
      <TouchableOpacity
        style={[styles.eventItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
        onPress={() => {
          console.log('User tapped event:', item.id);
          // TODO: Implement edit for today's events or correction for older events
        }}
      >
        <View style={styles.eventLeft}>
          <View style={styles.eventHeader}>
            <Text style={[styles.eventAmount, { color: eventColor }]}>
              {prefix}
            </Text>
            <Text style={[styles.eventAmount, { color: eventColor }]}>
              {displayMinutes}
            </Text>
            <Text style={[styles.eventTime, { color: themeColors.textSecondary }]}>
              {timeString}
            </Text>
          </View>
          {item.note && (
            <Text style={[styles.eventNote, { color: themeColors.text }]} numberOfLines={2}>
              {item.note}
            </Text>
          )}
          <View style={styles.statusBadge}>
            <IconSymbol
              ios_icon_name={statusIconIos}
              android_material_icon_name={statusIconAndroid}
              size={14}
              color={statusColor}
            />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>
        </View>
        <View style={styles.eventRight}>
          {eventIsToday ? (
            <IconSymbol
              ios_icon_name="pencil"
              android_material_icon_name="edit"
              size={20}
              color={themeColors.textSecondary}
            />
          ) : (
            <IconSymbol
              ios_icon_name="arrow.right"
              android_material_icon_name="arrow-forward"
              size={20}
              color={themeColors.textSecondary}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: EventSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
        {section.title}
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* Header with Balance */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: themeColors.textSecondary }]}>
                Current Balance
              </Text>
              <Text style={[styles.balanceText, { color: themeColors.text }]}>
                {balanceDisplay}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.signOutButton, { borderColor: themeColors.border }]}
              onPress={() => setShowSignOutModal(true)}
            >
              <IconSymbol
                ios_icon_name="rectangle.portrait.and.arrow.right"
                android_material_icon_name="logout"
                size={20}
                color={themeColors.error}
              />
              <Text style={[styles.signOutText, { color: themeColors.error }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
          {user?.email && (
            <Text style={[styles.userEmail, { color: themeColors.textSecondary }]}>
              {user.email}
            </Text>
          )}
        </View>

        {/* Events List */}
        {groupedEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="clock"
              android_material_icon_name="schedule"
              size={64}
              color={themeColors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
              No TOIL events yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: themeColors.textSecondary }]}>
              Start tracking your time off in lieu
            </Text>
          </View>
        ) : (
          <SectionList
            sections={groupedEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEventItem}
            renderSectionHeader={renderSectionHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={true}
          />
        )}

        {/* Sign Out Confirmation Modal */}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  balanceText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 4,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  eventLeft: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  eventAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventNote: {
    fontSize: 14,
    marginTop: 4,
  },
  eventRight: {
    marginLeft: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
