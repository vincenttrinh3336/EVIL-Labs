import React, { useState, useEffect } from "react";
import { 
  StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch, 
  SafeAreaView, Modal, TextInput, Image, Alert 
} from "react-native";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { 
  ArrowLeft, Bell, Moon, Globe, HelpCircle, Mail, 
  Shield, ChevronRight, Plus, Minus, Camera, X 
} from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PetData {
  id: string; // Permanent unique ID
  name: string;
  image: string | null;
}

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pets, setPets] = useState<PetData[]>([]);

  // Load pets from storage when modal opens
  const loadPets = async () => {
    try {
      const stored = await AsyncStorage.getItem('stored_pets');
      if (stored) {
        setPets(JSON.parse(stored));
      } else {
        // Ensure the default pet has a unique ID
        setPets([{ 
          id: `initial-${Date.now()}`, 
          name: "", 
          image: null 
        }]);
      }
    } catch (e) {
      Alert.alert("Error", "Could not load pet data.");
    }
  };

  const savePets = async () => {
    try {
      await AsyncStorage.setItem('stored_pets', JSON.stringify(pets));
      setModalVisible(false);
    } catch (e) {
      Alert.alert("Error", "Could not save changes.");
    }
  };

  const handleAddPet = () => {
    if (pets.length < 3) {
      const newPet: PetData = {
        // Create a unique ID: timestamp + random string
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: "",
        image: null 
      };
      setPets([...pets, newPet]);
    }
  };

  const handleRemovePet = (idToRemove: string) => {
    if (pets.length > 1) {
      // Filter by the unique ID instead of the index
      const newPets = pets.filter(pet => pet.id !== idToRemove);
      setPets(newPets);
    } else {
      Alert.alert("Minimum Requirement", "You must have at least one pet.");
    }
  };

  const pickImage = async (id: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPets(prevPets => 
        prevPets.map(pet => 
          pet.id === id ? { ...pet, image: result.assets[0].uri } : pet
        )
      );
    }
  };

  const updateName = (text: string, id: string) => {
    setPets(prevPets => 
      prevPets.map(pet => 
        pet.id === id ? { ...pet, name: text } : pet
      )
    );
  };

  const SettingRow = ({ icon: Icon, color, title, sub, hasChevron, isSwitch, switchVal, onSwitch, onPress }: any) => (
    <TouchableOpacity 
      style={styles.row} 
      activeOpacity={isSwitch ? 1 : 0.7} 
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={styles.rowLead}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <Icon size={20} color={color} />
        </View>
        <View>
          <Text style={styles.rowTitle}>{title}</Text>
          {sub && <Text style={styles.rowSub}>{sub}</Text>}
        </View>
      </View>
      {hasChevron && <ChevronRight size={20} color="#9CA3AF" />}
      {isSwitch && (
        <Switch 
          value={switchVal} 
          onValueChange={onSwitch}
          trackColor={{ false: "#D1D5DB", true: "#5C6BC0" }}
          thumbColor="white"
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#5C6BC0", "#7986CB"]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 100 }}>
          <Text style={styles.sectionLabel}>Device Settings</Text>
          <View style={styles.card}>
            <SettingRow 
              icon={Globe} 
              color="#5C6BC0" 
              title="Edit stored pet info" 
              sub="Manage names and photos" 
              hasChevron 
              onPress={() => {
                loadPets();
                setModalVisible(true);
              }} 
            />
            <View style={styles.divider} />
            <SettingRow icon={Shield} color="#FFB74D" title="Firmware Update" sub="Version 2.4.0" hasChevron />
          </View>
        </MotiView>

         {/* App Preferences */}
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 200 }}>
          <Text style={styles.sectionLabel}>App Preferences</Text>
          <View style={styles.card}>
            <SettingRow 
              icon={Bell} color="#5C6BC0" title="Push Notifications" sub="Get feeding alerts" 
              isSwitch switchVal={pushEnabled} onSwitch={setPushEnabled} 
            />
            <View style={styles.divider} />
            <SettingRow 
              icon={Moon} color="#64B5F6" title="Dark Mode" sub="Use system theme" 
              isSwitch switchVal={darkMode} onSwitch={setDarkMode} 
            />
            <View style={styles.divider} />
            <SettingRow icon={Globe} color="#FFB74D" title="Units" sub="Grams (g)" hasChevron />
          </View>
        </MotiView>

        {/* Support */}
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 300 }}>
          <Text style={styles.sectionLabel}>Support & About</Text>
          <View style={styles.card}>
            <SettingRow icon={HelpCircle} color="#5C6BC0" title="Help Center" hasChevron />
            <View style={styles.divider} />
            <SettingRow icon={Mail} color="#81C784" title="Contact Support" hasChevron />
            <View style={styles.divider} />
            <SettingRow icon={Shield} color="#FFB74D" title="Privacy Policy" hasChevron />
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={styles.rowLead}>
                <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}>
                  <Text style={{ fontSize: 20 }}>🍽️</Text>
                </View>
                <View>
                  <Text style={styles.rowTitle}>Smart Pet Feeder</Text>
                  <Text style={styles.rowSub}>Version 1.0.0</Text>
                </View>
              </View>
            </View>
          </View>
        </MotiView>


        <TouchableOpacity style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Pet Editor Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Manage Pets</Text>
            <TouchableOpacity onPress={savePets}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.gridControls}>
              <Text style={styles.gridHint}>Add up to 3 pets</Text>
              <TouchableOpacity onPress={handleAddPet} style={styles.addBtn}>
                <Plus size={20} color="#5C6BC0" />
                <Text style={styles.addBtnText}>Add Pet</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 20, paddingBottom: 40 }}>
              {pets.map((pet) => (
                <View key={pet.id} style={styles.petEditRow}>
                  <View style={styles.petInputGroup}>
                    <TextInput 
                      style={styles.petNameInput}
                      placeholder="Pet Name"
                      value={pet.name}
                      onChangeText={(t) => updateName(t, pet.id)}
                    />
                    <TouchableOpacity onPress={() => handleRemovePet(pet.id)}>
                      <Text style={styles.removeText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.imageEditBox} onPress={() => pickImage(pet.id)}>
                    {pet.image ? (
                      <Image source={{ uri: pet.image }} style={styles.fullImage} />
                    ) : (
                      <Camera color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Existing Styles
  container: { flex: 1, backgroundColor: "#F8F9FE" },
  header: { paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 20 },
  sectionLabel: { fontSize: 16, fontWeight: '600', color: '#4B5563', marginTop: 24, marginBottom: 12, marginLeft: 4 },
  card: { backgroundColor: 'white', borderRadius: 24, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  rowLead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  rowSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 68 },
  logoutBtn: { marginTop: 32, backgroundColor: '#FEE2E2', padding: 18, borderRadius: 20, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },

  // New Modal Styles
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  saveText: { color: '#5C6BC0', fontWeight: 'bold', fontSize: 16 },
  modalBody: { flex: 1, padding: 20 },
  gridControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  gridHint: { color: '#6B7280', fontSize: 14 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  addBtnText: { color: '#5C6BC0', fontWeight: '600' },
  petEditRow: { flexDirection: 'row', gap: 15, height: 100, alignItems: 'center' },
  petInputGroup: { flex: 2, gap: 8 },
  petNameInput: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, fontSize: 16 },
  removeText: { color: '#EF4444', fontSize: 12, fontWeight: '600', marginLeft: 5 },
  imageEditBox: { width: 100, height: 100, backgroundColor: '#F3F4F6', borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  fullImage: { width: '100%', height: '100%' }
});