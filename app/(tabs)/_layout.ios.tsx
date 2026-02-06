
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(home)">
        <Label>Log</Label>
        <Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} drawable="add-circle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <Label>History</Label>
        <Icon sf={{ default: 'clock', selected: 'clock.fill' }} drawable="history" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="approvals">
        <Label>Approvals</Label>
        <Icon sf={{ default: 'checkmark.circle', selected: 'checkmark.circle.fill' }} drawable="check-circle" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf={{ default: 'person.circle', selected: 'person.circle.fill' }} drawable="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
