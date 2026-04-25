import React, { useState, useEffect } from "react";
import { 
  StyleSheet, View, Text, TouchableOpacity, ScrollView, 
  Modal, TextInput, Alert, ActivityIndicator, Image
} from "react-native";
import Slider from "@react-native-community/slider"; // Ensure this is installed
import { ArrowLeft, Plus, Trash2, Clock } from "lucide-react-native";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RPI_URL } from "../constants";

const GRAMS_PER_SECOND = 15;

// Assuming storedPets is passed as a prop or fetched from your storage context
export function SchedulesScreen({ onBack, storedPets = [] }: { onBack: () => void, storedPets?: any[] }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [pets, setPets] = useState<any[]>([]); // New local state
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  // Form State
  const [selectedPet, setSelectedPet] = useState<{id: string, name: string} | null>(null);
  const [hour, setHour] = useState("08");
  const [minute, setMinute] = useState("00");
  const [portion, setPortion] = useState(15);

  // Logic to filter the schedules based on selection
  const filteredSchedules = activeFilter 
    ? schedules.filter(item => item.pet_id === activeFilter)
    : schedules;

  useEffect(() => { 
    const initializeData = async () => {
      // Fetching both in parallel is faster than awaiting them one by one
      await Promise.all([fetchSchedules(), loadPets()]);
      setLoading(false);
    };
    initializeData();
  }, []);

  const loadPets = async () => {
    try {
      const savedPets = await AsyncStorage.getItem("stored_pets");
      if (savedPets) setPets(JSON.parse(savedPets));
    } catch (e) {
      console.log("Storage error:", e);
    }
  };

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`${RPI_URL}/get-schedules`);
      const data = await response.json();
      // data format: [id, time, pet, pet_id, seconds]
      const formatted = data.map(item => ({
        id: item[0],
        time: item[1],
        pet: item[2],
        pet_id: item[3],
        grams: item[4] * GRAMS_PER_SECOND // item[4] is seconds
      }));
      setSchedules(formatted);
    } catch (e) {
      Alert.alert("Error", "Could not connect to feeder.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedPet) {
      Alert.alert("Missing Info", "Please select a pet.");
      return;
    }

    const timeStr = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
    const seconds = Math.floor(portion / GRAMS_PER_SECOND);

    try {
      const response = await fetch(`${RPI_URL}/add-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_of_day: timeStr,
          pet_name: selectedPet.name,
          pet_id: selectedPet.id,
          seconds: seconds
        })
      });

      if (response.ok) {
        setModalVisible(false);
        fetchSchedules();
        // Reset form
        setSelectedPet(null);
        setPortion(15);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to save schedule.");
    }
  };

  const deleteSchedule = (id: number) => {
    Alert.alert("Delete Schedule", "Are you sure?", [
      { text: "Cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await fetch(`${RPI_URL}/delete-schedule/${id}`, { method: 'DELETE' });
        fetchSchedules();
      }}
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><ArrowLeft color="#111827" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Feeding Schedules</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Pet Filter Bar */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, activeFilter === null && styles.filterChipActive]}
            onPress={() => setActiveFilter(null)}
          >
            <Text style={[styles.filterText, activeFilter === null && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>

          {pets.map(pet => (
            <TouchableOpacity 
              key={pet.id}
              style={[styles.filterChip, activeFilter === pet.id && styles.filterChipActive]}
              onPress={() => setActiveFilter(pet.id)}
            >
              <Text style={[styles.filterText, activeFilter === pet.id && styles.filterTextActive]}>
                {pet.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List - Now using filteredSchedules instead of schedules */}
      {loading ? <ActivityIndicator size="large" color="#5C6BC0" style={{marginTop: 50}} /> : (
        <ScrollView contentContainerStyle={styles.list}>
          {filteredSchedules.length > 0 ? (
            filteredSchedules.map((item, index) => (
              <MotiView 
                key={item.id} 
                from={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                style={styles.card}
              >
              <View>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Clock size={14} color="#5C6BC0" />
                  <Text style={styles.cardTime}>{item.time}</Text>
                </View>
                <Text style={styles.cardPet}>{item.pet}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardGrams}>{item.grams}g</Text>
                <TouchableOpacity onPress={() => deleteSchedule(item.id)}>
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </MotiView>
          ))
        ) : (
          <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No schedules for this pet.</Text>
            </View>
        )}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color="white" size={30} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>New Feeding</Text>
            
            {/* Pet Selector Chips */}
            <Text style={styles.label}>Select Pet</Text>
            <View style={styles.petSelector}>
              {storedPets.map(pet => (
                <TouchableOpacity 
                  key={pet.id}
                  style={[styles.petChip, selectedPet?.id === pet.id && styles.petChipActive]}
                  onPress={() => setSelectedPet({id: pet.id, name: pet.name})}
                >
                  <Text style={[styles.petChipText, selectedPet?.id === pet.id && styles.petChipTextActive]}>
                    {pet.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Time Picker */}
            <Text style={styles.label}>Feeding Time (24h)</Text>
            <View style={styles.timeInputRow}>
              <TextInput 
                style={styles.timeInput}
                value={hour}
                onChangeText={(v) => setHour(v.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="numeric"
                maxLength={2}
                placeholder="HH"
              />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput 
                style={styles.timeInput}
                value={minute}
                onChangeText={(v) => setMinute(v.replace(/[^0-9]/g, '').slice(0, 2))}
                keyboardType="numeric"
                maxLength={2}
                placeholder="MM"
              />
            </View>

            {/* Grams Slider */}
            <View style={styles.portionHeader}>
              <Text style={styles.label}>Portion Size</Text>
              <Text style={styles.portionValue}>{portion}g</Text>
            </View>
            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={15}
              maximumValue={200}
              step={5}
              value={portion}
              onValueChange={setPortion}
              minimumTrackTintColor="#5C6BC0"
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor="#5C6BC0"
            />
            
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
              <Text style={styles.submitText}>Save Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... existing styles ...
  container: { flex: 1, backgroundColor: "#F8F9FE" },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  list: { padding: 20 },
  card: { 
    backgroundColor: 'white', padding: 20, borderRadius: 24, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8
  },
  cardTime: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  cardPet: { color: '#6B7280', marginTop: 2, fontSize: 14 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  cardGrams: { fontWeight: 'bold', color: '#5C6BC0', fontSize: 16 },
  fab: { 
    position: 'absolute', bottom: 40, right: 30, width: 60, height: 60, 
    borderRadius: 30, backgroundColor: '#5C6BC0', justifyContent: 'center', 
    alignItems: 'center', elevation: 5 
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 32, padding: 24 },
  modalHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  petSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  petChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  petChipActive: { backgroundColor: '#5C6BC0' },
  petChipText: { color: '#4B5563', fontWeight: '500' },
  petChipTextActive: { color: 'white' },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  timeInput: { backgroundColor: '#F3F4F6', width: 60, padding: 12, borderRadius: 12, textAlign: 'center', fontSize: 18, fontWeight: 'bold' },
  timeSeparator: { fontSize: 20, fontWeight: 'bold', color: '#9CA3AF' },
  portionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  portionValue: { fontSize: 18, fontWeight: 'bold', color: '#5C6BC0' },
  submitBtn: { backgroundColor: '#5C6BC0', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 25 },
  submitText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { marginTop: 15, padding: 10, alignItems: 'center' },
  cancelText: { color: '#9CA3AF', fontWeight: '500' },
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: "#F8F9FE",
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#5C6BC0',
    borderColor: '#5C6BC0',
  },
  filterText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 13,
  },
  filterTextActive: {
    color: 'white',
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});