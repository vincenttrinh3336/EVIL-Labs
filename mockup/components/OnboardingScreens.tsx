import React, { useState } from "react";
import { 
  StyleSheet, View, Text, TouchableOpacity, Dimensions, 
  TextInput, Image, Alert, ScrollView 
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { Clock, TrendingUp, ChevronRight, Plus, Minus, Camera } from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");

interface PetData {
  id: string; // Permanent unique ID
  name: string;
  image: string | null;
}

export function OnboardingScreens({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pets, setPets] = useState<PetData[]>([
    { 
      id: `initial-${Date.now()}`, 
      name: "", 
      image: null 
    }
  ]);

  const slides = [
    {
      icon: Clock,
      title: "Feed Smarter and Stay Connected",
      description: "Set custom portions and feeding times for your pets, view video clips, and dispense with just a tap.",
      color: "#5C6BC0",
    },
    {
      icon: TrendingUp,
      title: "Track Nutrition",
      description: "Monitor feeding patterns and track your pet's health with detailed analytics and history.",
      color: "#81C784",
    },
    {
      title: "Your Pet Family",
      description: "The app allows at least 1 and at most 3 unique pets. Set their info now or later in Settings.",
      isPetGrid: true,
    }
  ];

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

  const handleRemovePet = () => {
    if (pets.length > 1) setPets(pets.slice(0, -1));
  };

  const pickImage = async (index: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square crop as requested
      quality: 1,
    });

    if (!result.canceled) {
      const newPets = [...pets];
      newPets[index].image = result.assets[0].uri;
      setPets(newPets);
    }
  };

  const updateName = (text: string, index: number) => {
    const newPets = [...pets];
    newPets[index].name = text;
    setPets(newPets);
  };

  const handleFinalize = async () => {
    try {
      await AsyncStorage.setItem('stored_pets', JSON.stringify(pets));
      onComplete();
    } catch (e) {
      Alert.alert("Error", "Could not save pet data.");
    }
  };

  const renderPetGrid = () => (
    <View style={styles.gridWrapper}>
      <View style={styles.gridControls}>
        <TouchableOpacity onPress={handleRemovePet} style={styles.controlBtn}><Minus color="#EF4444" /></TouchableOpacity>
        <TouchableOpacity onPress={handleAddPet} style={styles.controlBtn}><Plus color="#5C6BC0" /></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.gridBody}>
        {pets.map((pet, index) => (
          <View key={index} style={styles.gridRow}>
            <TextInput 
              style={styles.nameInput} 
              placeholder={`Pet ${index + 1} Name`}
              value={pet.name}
              onChangeText={(t) => updateName(t, index)}
            />
            <TouchableOpacity style={styles.imageBox} onPress={() => pickImage(index)}>
              {pet.image ? (
                <Image source={{ uri: pet.image }} style={styles.petThumb} />
              ) : (
                <Camera color="#9CA3AF" />
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={onComplete}><Text style={styles.skipText}>Skip</Text></TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={currentSlide}
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -50 }}
            style={styles.slide}
          >
            {!slides[currentSlide].isPetGrid && (
              <View style={[styles.iconCircle, { backgroundColor: slides[currentSlide].color }]}>
                {React.createElement(slides[currentSlide].icon as any, { size: 64, color: "#FFF" })}
              </View>
            )}
            
            <Text style={styles.title}>{slides[currentSlide].title}</Text>
            <Text style={styles.description}>{slides[currentSlide].description}</Text>
            
            {slides[currentSlide].isPetGrid && renderPetGrid()}
          </MotiView>
        </AnimatePresence>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={currentSlide === slides.length - 1 ? handleFinalize : () => setCurrentSlide(currentSlide + 1)} 
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {currentSlide < slides.length - 1 ? "Continue" : "Get Started"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  skipContainer: { padding: 20, alignItems: 'flex-end' },
  skipText: { color: "#666", fontSize: 16 },
  contentContainer: { flex: 1, justifyContent: "center" },
  slide: { width: width, paddingHorizontal: 24, alignItems: "center" },
  iconCircle: { width: 128, height: 128, borderRadius: 64, justifyContent: "center", alignItems: "center", marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  description: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 20 },
  footer: { padding: 24, paddingBottom: 40 },
  primaryButton: { backgroundColor: "#5C6BC0", padding: 18, borderRadius: 100, alignItems: "center" },
  primaryButtonText: { color: "#FFF", fontWeight: "600", fontSize: 18 },
  // Grid Styles
  gridWrapper: { width: '100%', marginTop: 20 },
  gridControls: { flexDirection: 'row', gap: 20, marginBottom: 10 },
  controlBtn: { padding: 10, backgroundColor: '#F3F4F6', borderRadius: 12 },
  gridBody: { gap: 12 },
  gridRow: { flexDirection: 'row', gap: 10, height: 80 },
  nameInput: { flex: 2, backgroundColor: '#F3F4F6', borderRadius: 15, paddingHorizontal: 15, fontSize: 16 },
  imageBox: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  petThumb: { width: '100%', height: '100%' }
});