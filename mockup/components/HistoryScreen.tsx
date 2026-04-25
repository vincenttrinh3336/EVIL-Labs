import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, FlatList, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, Animated, PanResponder, Dimensions 
} from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ArrowLeft, Trash2, ArrowUpDown, WifiOff } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { MotiView } from "moti";
import { RPI_URL } from "../constants";

const GRAMS_PER_SECOND = 15;

export function HistoryScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const [isOffline, setIsOffline] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [allLogs, setAllLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [pets, setPets] = useState([]); // Added to store pets from storage
  const [selectedPetId, setSelectedPetId] = useState('All'); // Changed to track ID
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'time' | 'name'>('time');

  const panY = useRef(new Animated.Value(0)).current;

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
    try {
      const response = await fetch(`${RPI_URL}/feeding-logs`);
      if (response.ok) {
        const data = await response.json();
        setAllLogs(data);
        setIsOffline(false);
      } else {
        setIsOffline(true);
      }
    } catch (err) {
      setIsOffline(true);
      setShowOfflineAlert(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPets = async () => {
    try {
      const savedPets = await AsyncStorage.getItem("stored_pets");
      if (savedPets) {
        setPets(JSON.parse(savedPets));
      }
    } catch (e) {
      console.error("Error loading pets", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), loadPets()]);
    };
    init();

    const messaging = getMessaging();
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
    
    // Filter by pet_id instead of name
    if (selectedPetId !== 'All') {
      result = result.filter(log => log.pet_id === selectedPetId);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') return a.pet.localeCompare(b.pet);
      // Date sort (newest first)
      return new Date(b.date.replace(' ', 'T')).getTime() - new Date(a.date.replace(' ', 'T')).getTime();
    });

    setFilteredLogs(result);
  }, [selectedPetId, allLogs, sortBy]);

  const handleDelete = (id: number) => {
    Alert.alert("Delete Log", "Remove this entry from history?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await fetch(`${RPI_URL}/delete-log/${id}`, { method: 'DELETE' });
          fetchLogs();
      }}
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
        <TouchableOpacity 
          style={styles.sortBtn} 
          onPress={() => setSortBy(sortBy === 'time' ? 'name' : 'time')}
        >
          <ArrowUpDown size={20} color={sortBy === 'name' ? "#5C6BC0" : "#9CA3AF"} />
        </TouchableOpacity>
      </View>

      {/* Pet Filter Bar - Updated to use pets from Storage */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={[{ id: 'All', name: 'All' }, ...pets]}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedPetId(item.id)}
              style={[styles.chip, selectedPetId === item.id && styles.activeChip]}
            >
              <Text style={[styles.chipText, selectedPetId === item.id && styles.activeText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#5C6BC0" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredLogs}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <MotiView 
              from={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }}
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  offlineText: { color: 'white', fontWeight: '600', fontSize: 13 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  sortBtn: { padding: 8, borderRadius: 12, backgroundColor: '#FFF', elevation: 2, shadowOpacity: 0.05 },
  filterContainer: { paddingLeft: 20, marginBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFF', marginRight: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  activeChip: { backgroundColor: '#5C6BC0', borderColor: '#5C6BC0' },
  chipText: { color: '#6B7280', fontWeight: '600' },
  activeText: { color: '#FFF' },
  logCard: { 
    backgroundColor: '#FFF', padding: 16, borderRadius: 24, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10
  },
  cardLeft: { flex: 1 },
  petName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  timestamp: { fontSize: 12, color: '#6B7280', marginVertical: 2 },
  scheduledLabel: { fontSize: 11, color: '#9CA3AF' },
  cardRight: { alignItems: 'flex-end', gap: 10 },
  grams: { fontSize: 16, fontWeight: 'bold', color: '#5C6BC0' }
});