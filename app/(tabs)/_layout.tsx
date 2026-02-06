
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            height: 88,
            paddingBottom: 32,
            paddingTop: 8,
            backgroundColor: colorScheme === 'dark' ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          },
          default: {
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
            backgroundColor: colorScheme === 'dark' ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          },
        }),
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
          fontWeight: '500',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}>
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Log',
          tabBarIcon: ({ color }) => <IconSymbol android_material_icon_name="add" ios_icon_name="plus" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <IconSymbol android_material_icon_name="history" ios_icon_name="clock" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: 'Approvals',
          tabBarIcon: ({ color }) => <IconSymbol android_material_icon_name="check-circle" ios_icon_name="checkmark.circle" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol android_material_icon_name="person" ios_icon_name="person" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
