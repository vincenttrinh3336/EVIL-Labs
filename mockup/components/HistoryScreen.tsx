import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, Share, Animated,
  PanResponder, Dimensions
} from 'react-native';
import { ArrowLeft, Trash2, Filter, ArrowUpDown, WifiOff } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { MotiView } from "moti";

import { RPI_URL } from "../constants";

const { width } = Dimensions.get('window');
const GRAMS_PER_SECOND = 15;

export function HistoryScreen({ onNavigate }) {
  const [isOffline, setIsOffline] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const insets = useSafeAreaInsets();
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [selectedPet, setSelectedPet] = useState('All');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'time' | 'name'>('time');

  // Animation value for the swipe-up gesture
  const panY = useRef(new Animated.Value(0)).current;

  // 2. Swipe-to-dismiss logic
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy < -10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) panY.setValue(gestureState.dy);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50) {
          Animated.timing(panY, { toValue: -100, duration: 200, useNativeDriver: true }).start(() => setShowOfflineAlert(false));
        } else {
          Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const fetchLogs = useCallback(async () => {
  setLoading(true); // Ensure loading shows
  try {
    const response = await fetch(`${RPI_URL}/feeding-logs`);
    if (response.ok) {
      const data = await response.json();
      setAllLogs(data);
      setIsOffline(false); // SUCCESS: We are online
    } else {
      setIsOffline(true); // Server responded but with error
    }
  } catch (err) {
    console.error("Fetch Error:", err);
    setIsOffline(true); // Network failed
    setShowOfflineAlert(true);
  } finally {
    setLoading(false);
  }
}, []);

  // Firebase listener for auto-refresh
  useEffect(() => {
    fetchLogs();
    const messaging = getMessaging(); // Gets the messaging instance
    const unsubscribe = onMessage(messaging, async remoteMessage => {
      if (remoteMessage.data?.action === 'refresh_logs') {
        fetchLogs(); 
      }
    });
    return unsubscribe;
  }, [fetchLogs]);

  // Combined Filter & Sort Logic
  useEffect(() => {
    let result = [...allLogs];
    
    // Filter
    if (selectedPet !== 'All') {
      result = result.filter(log => log.pet === selectedPet);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') return a.pet.localeCompare(b.pet);
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    setFilteredLogs(result);
  }, [selectedPet, allLogs, sortBy]);

  const handleDelete = (id: number) => {
    Alert.alert("Delete Log", "Remove this entry from history?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await fetch(`${RPI_URL}/delete-log/${id}`, { method: 'DELETE' });
          fetchLogs();
      }}
    ]);
  };

  const petTabs = ['All', ...new Set(allLogs.map(log => log.pet))];

  return (
    <View style={styles.container}>
       {/* The swipeable Offline Alert (only shows if isOffline is true) */}
       {isOffline && showOfflineAlert && (
         <Animated.View 
           {...panResponder.panHandlers}
           style={[styles.offlineHeader, { transform: [{ translateY: panY }] }]}
         >
           <WifiOff size={18} color="white" />
           <Text style={styles.offlineText}>Feeder Offline. Showing History.</Text>
         </Animated.View>
       )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate("home")}><ArrowLeft color="#111827" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Feeding History</Text>
        <TouchableOpacity onPress={() => setSortBy(sortBy === 'time' ? 'name' : 'time')}>
          <ArrowUpDown size={20} color="#5C6BC0" />
        </TouchableOpacity>
      </View>

      {/* Pet Filter Bar */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={petTabs}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedPet(item)}
              style={[styles.chip, selectedPet === item && styles.activeChip]}
            >
              <Text style={[styles.chipText, selectedPet === item && styles.activeText]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5C6BC0" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredLogs}
          contentContainerStyle={{ padding: 20 }}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <MotiView 
              from={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 50 }}
              style={styles.logCard}
            >
              <View style={styles.cardLeft}>
                <Text style={styles.petName}>{item.pet}</Text>
                <Text style={styles.timestamp}>{item.date}</Text>
                <Text style={styles.scheduledLabel}>Scheduled: {item.time}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.grams}>{item.duration * GRAMS_PER_SECOND}g</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </MotiView>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  offlineHeader: {
    backgroundColor: '#EF4444',
    paddingTop: 50, // Account for notch
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  offlineText: { color: 'white', fontWeight: '600', fontSize: 13 },
  swipeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  filterContainer: { paddingLeft: 20, marginBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E7EB', marginRight: 8 },
  activeChip: { backgroundColor: '#5C6BC0' },
  chipText: { color: '#6B7280', fontWeight: '600' },
  activeText: { color: '#FFF' },
  logCard: { 
    backgroundColor: '#FFF', padding: 16, borderRadius: 20, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2, shadowOpacity: 0.05
  },
  cardLeft: { flex: 1 },
  petName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  timestamp: { fontSize: 12, color: '#6B7280', marginVertical: 2 },
  scheduledLabel: { fontSize: 11, color: '#9CA3AF' },
  cardRight: { alignItems: 'flex-end', gap: 10 },
  grams: { fontSize: 16, fontWeight: 'bold', color: '#5C6BC0' }
});