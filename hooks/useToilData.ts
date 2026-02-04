
import { useState, useEffect, useCallback } from 'react';
import { ToilEvent, ToilBalance } from '@/types/toil';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/api';

const STORAGE_KEY = '@toil_events';
const LAST_ACTION_KEY = '@toil_last_action';

// Custom hook for managing TOIL data with offline-first approach
export function useToilData() {
  const [events, setEvents] = useState<ToilEvent[]>([]);
  const [balance, setBalance] = useState<ToilBalance>({
    balance: 0,
    addMinutes: 0,
    takeMinutes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastAction, setLastAction] = useState<'ADD' | 'TAKE'>('ADD');
  const [syncing, setSyncing] = useState(false);

  // Load events from backend and sync with local storage
  const loadEvents = useCallback(async () => {
    try {
      console.log('[useToilData] Loading TOIL events...');
      setLoading(true);
      
      // First, load from local storage for immediate display
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const lastActionStored = await AsyncStorage.getItem(LAST_ACTION_KEY);
      
      if (stored) {
        const parsedEvents: ToilEvent[] = JSON.parse(stored);
        setEvents(parsedEvents);
        calculateBalance(parsedEvents);
        console.log('[useToilData] Loaded from local storage:', parsedEvents.length);
      }
      
      if (lastActionStored) {
        setLastAction(lastActionStored as 'ADD' | 'TAKE');
      }
      
      // Then sync with backend
      try {
        console.log('[useToilData] Syncing with backend...');
        const backendEvents = await authenticatedGet<ToilEvent[]>('/api/toil/events');
        console.log('[useToilData] Backend events:', backendEvents.length);
        
        // Update local storage with backend data
        setEvents(backendEvents);
        calculateBalance(backendEvents);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(backendEvents));
        
        // Also fetch balance from backend to verify
        const backendBalance = await authenticatedGet<ToilBalance>('/api/toil/balance');
        console.log('[useToilData] Backend balance:', backendBalance);
        setBalance(backendBalance);
      } catch (syncError) {
        console.error('[useToilData] Backend sync failed (using local data):', syncError);
        // Continue with local data if backend fails
      }
    } catch (error) {
      console.error('[useToilData] Error loading TOIL events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate balance from events
  const calculateBalance = (eventList: ToilEvent[]) => {
    const addMinutes = eventList
      .filter(e => e.type === 'ADD')
      .reduce((sum, e) => sum + e.minutes, 0);
    
    const takeMinutes = eventList
      .filter(e => e.type === 'TAKE')
      .reduce((sum, e) => sum + e.minutes, 0);
    
    const balance = addMinutes - takeMinutes;
    
    setBalance({ balance, addMinutes, takeMinutes });
    console.log('Balance calculated:', { balance, addMinutes, takeMinutes });
  };

  // Save events to local storage
  const saveEvents = async (eventList: ToilEvent[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(eventList));
      console.log('Events saved to local storage');
    } catch (error) {
      console.error('Error saving TOIL events:', error);
    }
  };

  // Add new TOIL event
  const addEvent = async (type: 'ADD' | 'TAKE', minutes: number, note?: string) => {
    console.log('[useToilData] Adding TOIL event:', { type, minutes, note });
    
    const timestamp = new Date().toISOString();
    
    // Optimistic update - add to local state immediately
    const tempEvent: ToilEvent = {
      id: `temp-${Date.now()}-${Math.random()}`, // Temporary ID
      timestamp,
      type,
      minutes,
      note,
      created_at: timestamp,
    };
    
    const updatedEvents = [tempEvent, ...events];
    setEvents(updatedEvents);
    calculateBalance(updatedEvents);
    await saveEvents(updatedEvents);
    
    // Remember last action
    setLastAction(type);
    await AsyncStorage.setItem(LAST_ACTION_KEY, type);
    
    // Sync with backend
    try {
      setSyncing(true);
      const backendEvent = await authenticatedPost<ToilEvent>('/api/toil/events', {
        timestamp,
        type,
        minutes,
        ...(note && { note }),
      });
      
      console.log('[useToilData] Event created on backend:', backendEvent);
      
      // Replace temp event with backend event (which has real ID)
      const finalEvents = updatedEvents.map(e => 
        e.id === tempEvent.id ? backendEvent : e
      );
      setEvents(finalEvents);
      await saveEvents(finalEvents);
      
      // Update balance from backend
      const backendBalance = await authenticatedGet<ToilBalance>('/api/toil/balance');
      setBalance(backendBalance);
      
      return backendEvent;
    } catch (error) {
      console.error('[useToilData] Failed to sync event with backend:', error);
      // Keep the temp event in local storage for later sync
      return tempEvent;
    } finally {
      setSyncing(false);
    }
  };

  // Delete event (for undo)
  const deleteEvent = async (eventId: string) => {
    console.log('[useToilData] Deleting TOIL event:', eventId);
    
    // Optimistic update - remove from local state immediately
    const updatedEvents = events.filter(e => e.id !== eventId);
    setEvents(updatedEvents);
    calculateBalance(updatedEvents);
    await saveEvents(updatedEvents);
    
    // Sync with backend
    try {
      setSyncing(true);
      await authenticatedDelete(`/api/toil/events/${eventId}`);
      console.log('[useToilData] Event deleted on backend');
      
      // Update balance from backend
      const backendBalance = await authenticatedGet<ToilBalance>('/api/toil/balance');
      setBalance(backendBalance);
    } catch (error) {
      console.error('[useToilData] Failed to delete event on backend:', error);
      // Revert local state if backend fails
      setEvents(events);
      calculateBalance(events);
      await saveEvents(events);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  // Update event (for editing today's entries)
  const updateEvent = async (
    eventId: string, 
    updates: Partial<Pick<ToilEvent, 'type' | 'minutes' | 'note' | 'timestamp'>>
  ) => {
    console.log('[useToilData] Updating TOIL event:', eventId, updates);
    
    // Optimistic update - update local state immediately
    const updatedEvents = events.map(e => 
      e.id === eventId ? { ...e, ...updates } : e
    );
    setEvents(updatedEvents);
    calculateBalance(updatedEvents);
    await saveEvents(updatedEvents);
    
    // Sync with backend
    try {
      setSyncing(true);
      const backendEvent = await authenticatedPut<ToilEvent>(`/api/toil/events/${eventId}`, updates);
      console.log('[useToilData] Event updated on backend:', backendEvent);
      
      // Update with backend response
      const finalEvents = events.map(e => 
        e.id === eventId ? backendEvent : e
      );
      setEvents(finalEvents);
      await saveEvents(finalEvents);
      
      // Update balance from backend
      const backendBalance = await authenticatedGet<ToilBalance>('/api/toil/balance');
      setBalance(backendBalance);
    } catch (error) {
      console.error('[useToilData] Failed to update event on backend:', error);
      // Revert local state if backend fails
      setEvents(events);
      calculateBalance(events);
      await saveEvents(events);
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    balance,
    loading,
    syncing,
    lastAction,
    addEvent,
    deleteEvent,
    updateEvent,
    refreshEvents: loadEvents,
  };
}
