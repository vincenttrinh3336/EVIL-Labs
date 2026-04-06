import React, { useState, useEffect } from "react";
import { 
  StyleSheet, View, Text, TouchableOpacity, ScrollView, 
  Modal, TextInput, Alert, ActivityIndicator 
} from "react-native";
import { ArrowLeft, Plus, Trash2, Clock, MapPin, Scale } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RPI_URL = "http://192.168.1.XX:8000"; // Replace with your Pi's IP
const GRAMS_PER_SECOND = 15;

export function SchedulesScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [petName, setPetName] = useState("");
  const [time, setTime] = useState("");
  const [grams, setGrams] = useState("");

  useEffect(() => { fetchSchedules(); }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`${RPI_URL}/get-schedules`);
      const data = await response.json();
      // Convert seconds from DB to grams for the UI
      const formatted = data.map(item => ({
        id: item[0],
        time: item[1],
        pet: item[2],
        grams: item[3] * GRAMS_PER_SECOND
      }));
      setSchedules(formatted);
    } catch (e) {
      Alert.alert("Error", "Could not connect to feeder.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const weight = parseInt(grams);
    if (weight < 15) {
      Alert.alert("Invalid Amount", "Minimum portion is 15g (1 second).");
      return;
    }

    const seconds = Math.floor(weight / GRAMS_PER_SECOND);

    try {
      await fetch(`${RPI_URL}/add-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_of_day: time,
          pet_name: petName,
          seconds: seconds
        })
      });
      setModalVisible(false);
      fetchSchedules();
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

      {loading ? <ActivityIndicator size="large" color="#5C6BC0" style={{marginTop: 50}} /> : (
        <ScrollView contentContainerStyle={styles.list}>
          {schedules.map((item, index) => (
            <MotiView 
              key={item.id} 
              from={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 100 }}
              style={styles.card}
            >
              <View>
                <Text style={styles.cardTime}>{item.time}</Text>
                <Text style={styles.cardPet}>{item.pet}</Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardGrams}>{item.grams}g</Text>
                <TouchableOpacity onPress={() => deleteSchedule(item.id)}>
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </MotiView>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Plus color="white" size={30} />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>New Feeding</Text>
            <TextInput placeholder="Pet Name (e.g. Luna)" style={styles.input} onChangeText={setPetName} />
            <TextInput placeholder="Time (e.g. 08:30)" style={styles.input} onChangeText={setTime} />
            <TextInput placeholder="Grams (min 15g)" keyboardType="numeric" style={styles.input} onChangeText={setGrams} />
            
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
              <Text style={styles.submitText}>Save Schedule</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
              <Text>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FE" },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  list: { padding: 20 },
  card: { 
    backgroundColor: 'white', padding: 20, borderRadius: 20, marginBottom: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    elevation: 2, shadowOpacity: 0.05
  },
  cardTime: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  cardPet: { color: '#6B7280', marginTop: 2 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  cardGrams: { fontWeight: 'bold', color: '#5C6BC0', fontSize: 16 },
  fab: { 
    position: 'absolute', bottom: 40, right: 30, width: 60, height: 60, 
    borderRadius: 30, backgroundColor: '#5C6BC0', justifyContent: 'center', 
    alignItems: 'center', elevation: 5 
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', borderRadius: 30, padding: 30 },
  modalHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 12, marginBottom: 15 },
  submitBtn: { backgroundColor: '#5C6BC0', padding: 18, borderRadius: 12, alignItems: 'center' },
  submitText: { color: 'white', fontWeight: 'bold' },
  cancelBtn: { marginTop: 15, alignItems: 'center' }
});