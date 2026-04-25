import React, { useState, useEffect, useCallback } from "react";
import { getMessaging, onMessage } from '@react-native-firebase/messaging';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  SafeAreaView, 
  Modal,
  TextInput,
  Alert,
  TouchableWithoutFeedback,
  Dimensions 
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Home, 
  Video, 
  Heart,
  Archive, 
  Bell, 
  Utensils,
  UtensilsCrossed,
  Clock, 
  BarChart3, 
  Wifi,
  WifiOff,
  Settings,
  Camera,
  CameraOff,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Undo,
  X 
} from "lucide-react-native";
import { RPI_URL } from "../constants";

const { width } = Dimensions.get("window");
const GRAMS_PER_SECOND = 15;

// Add to separate utils file later
const getNextFeeding = (schedules: any[]) => {
  if (!schedules || schedules.length === 0) return { label: "None", time: "--:--" };

  // Use the first item provided by the backend
  const next = schedules[0];

  // Logic to extract data whether it's an object {id, time, pet, ...} or the old tuple [id, time, pet, ...]
  const isArray = Array.isArray(next);
  
  // Extract values using the keys defined in your Python @app.get("/get-next-schedules")
  const timeStr = isArray ? next[1] : next.time;
  const petName = isArray ? next[2] : next.pet; 

  // Fallback check: if somehow data is missing
  if (!timeStr) return { label: "None", time: "--:--" };

  return { 
    label: petName || "Unknown", 
    time: timeStr 
  };
};
// End of utils file

export function HomeDashboard({ onNavigate, routeParams }: { onNavigate: any, routeParams?: any }) {
  const [lastFeeding, setLastFeeding] = useState<any>(null);
  const [foodLevel, setFoodLevel] = useState<"normal" | "low">("normal");
  const insets = useSafeAreaInsets();
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [petName, setPetName] = useState("");
  const [portion, setPortion] = useState(15);
  const [schedules, setSchedules] = useState([]);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1597105888983-ae503ec1ef3e?q=80&w=1080";
  const [liveCardImage, setLiveCardImage] = useState(DEFAULT_IMAGE);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [camEnabled, setCamEnabled] = useState(true); // Default to true
  const [isConnected, setIsConnected] = useState(true);
  const [storedPets, setStoredPets] = useState<any[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);

  // Standalone pet loader
  const loadLocalPets = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('stored_pets');
      if (stored) {
        const parsed = JSON.parse(stored);
        setStoredPets(parsed);
        
        // Only set a default if the current petName is empty 
        // to avoid overwriting a user's manual selection
        if (parsed.length > 0 && !petName) {
          setPetName(parsed[0].name);
        }
      }
    } catch (e) {
      console.error("Failed to load local pets:", e);
    }
  }, [petName]);

  const fetchDashboardData = useCallback(async () => {
      try {
        // Fetch most recent feeding log
        const logsRes = await fetch(`${RPI_URL}/filtered-feeding-logs?limit=1`);
        if(logsRes.ok){
          const logs = await logsRes.json();
          setIsConnected(true);
          setLastFeeding(logs.length > 0 ? logs[0] : null);
        } else{
          setIsConnected(false);
        }
        
        // Fetch next schedule
        const schedRes = await fetch(`${RPI_URL}/get-next-schedules?next_only=true`);
        const nextSchedData = await schedRes.json();
        setSchedules(nextSchedData);

        // Fetch Food Level
        const levelRes = await fetch(`${RPI_URL}/get-food-level`);
        const levelData = await levelRes.json();
        if (levelData.status) {
          setFoodLevel(levelData.status);
        }

        // Fetch Camera Status
        const statusRes = await fetch(`${RPI_URL}/get-status`);
        const statusData = await statusRes.json();
        
        // Explicitly set the state based on cv_on
        setIsCameraRunning(statusData.cv_on === true);
        setCamEnabled(statusData.cam_state);

      } catch (e) {
        console.error("Dashboard sync failed:", e);
        setIsCameraRunning(false); 
        setIsConnected(false);
      }
    }, []);

  // Watch for incoming updatedImage from navigation
  useEffect(() => {
    if (routeParams?.updatedImage) {
      updateLiveCardImage(routeParams.updatedImage);
    }
  }, [routeParams?.updatedImage]);

  // Load the image from storage on mount
  useEffect(() => {
    const loadSavedImage = async () => {
      try {
        const savedImage = await AsyncStorage.getItem('@live_card_image');
        if (savedImage !== null) {
          setLiveCardImage(savedImage);
        }
      } catch (e) {
        console.error("Failed to load image from storage", e);
      }
    };

    loadSavedImage();
  }, []);

  // Create a helper to update and save the image
  const updateLiveCardImage = async (newUri: string) => {
    try {
      setLiveCardImage(newUri);
      await AsyncStorage.setItem('@live_card_image', newUri);
    } catch (e) {
      console.error("Failed to save image", e);
    }
  };

  // 2. Fetch current schedules from Raspberry Pi on mount
  useEffect(() => {
    loadLocalPets(); // Loads pets from phone storage immediately
    fetchDashboardData(); // Fetches data from RPi

    // Real-time Firebase Listener
    const messaging = getMessaging();
    const unsubscribe = onMessage(messaging, async (remoteMessage) => {
      const action = remoteMessage.data?.action;
      
      if (action === "vision_toggle") {
        // Wait 300ms for the Pi to settle its state before fetching
        setTimeout(() => {
          fetchDashboardData();
        }, 300);
      } else if (action === "refresh_logs" || action === "food_low" || action === "food_refilled") {
      // Re-run the fetch to update the stats cards automatically
      fetchDashboardData();
    }
    
    // Show a popup if the app is open so the user knows what happened
    if (remoteMessage.notification) {
      Alert.alert(
        remoteMessage.notification.title || "Feeder Update",
        remoteMessage.notification.body
      );
    }
    });

    return unsubscribe;
  }, [fetchDashboardData]);

  const handleUploadPicture = async () => {
    setShowImageOptions(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      // Navigate to Edit screen with the new image
      onNavigate(`editImage?uri=${encodeURIComponent(result.assets[0].uri)}`);
    }
  };

  const handleEditCurrent = () => {
    setShowImageOptions(false);
    onNavigate(`editImage?uri=${encodeURIComponent(liveCardImage)}`);
  };

  const getLastFeedingInfo = () => {
    if (!lastFeeding) {
      return { label: "No data", color: "#EF4444", value: "None" };
    }

    const lastTime = new Date(lastFeeding.date).getTime();
    const now = new Date().getTime();
    const hoursSince = (now - lastTime) / (1000 * 60 * 60);
    const isOld = hoursSince >= 12;
    
    return {
      label: `${lastFeeding.pet}`,
      value: `${lastFeeding.date}`,
      color: isOld ? "#EF4444" : "#81C784" 
    };
  };

  const lastFeedingInfo = getLastFeedingInfo();
  const nextFeeding = getNextFeeding(schedules);

  const stats = [
    { 
      id: "last", 
      icon: UtensilsCrossed, 
      label: "Last Feeding", 
      value: lastFeedingInfo.label === "No data" 
        ? "No data" 
        : `${lastFeedingInfo.label} • ${lastFeedingInfo.value}`, 
      color: lastFeedingInfo.color 
    },
    { 
      id: "next", // ID to identify the specific card
      icon: Clock, 
      label: "Next Scheduled", 
      value: `${nextFeeding.label} • ${nextFeeding.time}`, 
      color: "#5C6BC0" 
    },
    { 
      id: "remaining",
      icon: BarChart3, 
      label: "Food Level", 
      value: foodLevel === "low" ? "Low" : "Normal", 
      color: foodLevel === "low" ? "#EF4444" : "#81C784" // Red if low, Green if normal
    },
    { 
    id: "status", 
    icon: isConnected ? Wifi : WifiOff, 
    label: "Feeder Status", 
    value: isConnected ? "Online" : "Offline", 
    color: isConnected ? "#64B5F6" : "#EF4444" 
    },
  ];

  const handleInstantFeed = async () => {
    if (!petName.trim() || !selectedPetId) {
      Alert.alert("Missing Info", "Please select a pet.");
      return;
    }

    // 1. Calculate time: 15 seconds in the future
    const futureDate = new Date(Date.now() + 15000);
    const timeStr = futureDate.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });

    // Convert grams to seconds (Math.floor to match Pi logic)
    const durationSeconds = Math.floor(portion / GRAMS_PER_SECOND);

    try {
      const response = await fetch(`${RPI_URL}/add-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time_of_day: timeStr,
          pet_name: petName,
          pet_id: selectedPetId, // New field
          seconds: durationSeconds
        })
      });

      if (response.ok) {
        Alert.alert("Success", `Feeding ${petName} ${portion}g at ${timeStr}`);
        setShowFeedModal(false);
        setPetName(""); // Reset for next time
        setSelectedPetId(null); // Reset
      }
    } catch (e) {
      Alert.alert("Connection Error", "Could not reach the feeder.");
    }
  };

  const toggleCamera = async () => {
    try {
      const newState = !camEnabled;
      const response = await fetch(`${RPI_URL}/set-camera`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState }),
      });

      if (response.ok) {
        setCamEnabled(newState);
      }
    } catch (error) {
      console.error("Failed to toggle camera:", error);
      Alert.alert("Error", "Could not connect to the Pi to toggle camera.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#5C6BC0", "#7986CB"]} style={styles.header}>
        <View style={[
          styles.headerTop, 
          { paddingTop: insets.top + 10 } // Dynamically adjust for the notch
        ]}>
          <MotiView from={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Text style={styles.greeting}>PetByte IOT Pet Feeder🐈</Text>
            <Text style={styles.subGreeting}>Feed, Schedule, View clips and stats!</Text>
          </MotiView>
    
          <TouchableOpacity 
            onPress={() => onNavigate("settings")}
            style={styles.settingsBtn}
          >
            <Settings size={20} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Live Feed Card */}
        <MotiView 
          from={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          style={styles.liveCardWrapper}
        >
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => onNavigate("video")} 
            onLongPress={() => setShowImageOptions(true)} // Trigger modal
            delayLongPress={500}
            style={styles.liveCard}
          >
            <Image source={{ uri: liveCardImage }} style={styles.liveImage} />
            <AnimatePresence>
              {isCameraRunning && (
                <MotiView 
                  from={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  style={styles.liveBadge}
                >
                  <MotiView
                    from={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 1.2, opacity: 0.5 }}
                    transition={{
                      type: 'timing',
                      duration: 600,
                      loop: true,
                      repeatReverse: true,
                    }}
                    style={styles.liveDot}
                  />
                  <Text style={styles.liveText}>LIVE</Text>
                </MotiView>
              )}
            </AnimatePresence>
            <View style={styles.playOverlay}>
              <View style={styles.playBtnCircle}>
                <Video size={32} color="#5C6BC0" />
              </View>
            </View>
          </TouchableOpacity>
        </MotiView>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <TouchableOpacity
              key={stat.id}
              onPress={() => {
                if (stat.id === "next") onNavigate("pets");
                if (stat.id === "status") fetchDashboardData();
              }}
              activeOpacity={0.7}
              style={styles.statCardWrapper} // Use a wrapper for the animation
            >
              <MotiView 
                from={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 100 + (i * 50) }}
                style={styles.statCard}
              >
                <View style={[styles.statIconBox, { backgroundColor: `${stat.color}15` }]}>
                  <stat.icon size={20} color={stat.color} />
                </View>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue} numberOfLines={1}>{stat.value}</Text>
              </MotiView>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          activeOpacity={0.7}
          style={styles.actionCard}
          onPress={() => onNavigate("schedules")}
        >
          <View>
            <Text style={styles.actionTitle}>View Schedule</Text>
            <Text style={styles.actionSub}>Add, Edit, Delete feeding times</Text>
          </View>
          <View style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Schedule</Text>
          </View>
        </TouchableOpacity>

        {/* New Button Grid below Schedule */}
        <View style={styles.actionGrid}>
          {/* Camera Master Toggle */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[
              styles.gridBtn, 
              { backgroundColor: camEnabled ? '#81C784' : '#EF4444' }
            ]}
            onPress={toggleCamera}
          >
            {camEnabled ? (
              <Camera color="white" size={32} />
            ) : (
              <CameraOff color="white" size={32} />
            )}
          </TouchableOpacity>

          {/* Feed Modal Button */}
          <TouchableOpacity 
            activeOpacity={0.8}
            style={[styles.gridBtn, { backgroundColor: '#FFB74D' }]}
            onPress={() => setShowFeedModal(true)}
          >
            <Utensils size={32} color="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Selection Modal (Pop up) */}
      <Modal visible={showImageOptions} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowImageOptions(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <MotiView from={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={styles.imageOptionsBox}>
                <Text style={styles.modalTitle}>Update Card Image</Text>
                
                <TouchableOpacity style={styles.optionItem} onPress={handleUploadPicture}>
                  <ImageIcon size={20} color="#5C6BC0" />
                  <Text style={styles.optionText}>Upload picture</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.optionItem} onPress={handleEditCurrent}>
                  <Camera size={20} color="#5C6BC0" />
                  <Text style={styles.optionText}>Edit current picture</Text>
                </TouchableOpacity>
              </MotiView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Feed Modal */}
      <Modal 
        visible={showFeedModal} 
        transparent 
        animationType="fade"
        onRequestClose={() => setShowFeedModal(false)}
      >
        {/* Wrap the entire overlay to close when background is pressed */}
        <TouchableWithoutFeedback onPress={() => setShowFeedModal(false)}>
          <View style={styles.modalOverlay}>
            {/* Wrap content in another TouchableWithoutFeedback to prevent closing when clicking inside */}
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <MotiView 
                from={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                style={styles.modalContent}
              >
                <Text style={styles.modalTitle}>Feed Now</Text>
                
                {/* Pet Name Entry */}
                <Text style={[styles.modalSub, { marginBottom: 10 }]}>Select Pet</Text>
                <View style={styles.petSelectorContainer}>
                  {storedPets.length > 0 ? (
                    storedPets.map((pet) => (
                      <TouchableOpacity
                        key={pet.id}
                        onPress={() => {
                          setPetName(pet.name);
                          setSelectedPetId(pet.id); // Capture the ID
                        }}
                        style={[
                          styles.petChip,
                          petName === pet.name && styles.petChipActive
                        ]}
                      >
                        {pet.image && (
                          <Image source={{ uri: pet.image }} style={styles.petChipImage} />
                        )}
                        <Text style={[
                          styles.petChipText,
                          petName === pet.name && styles.petChipTextActive
                        ]}>
                          {pet.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noPetsText}>No pets found. Add one in Settings!</Text>
                  )}
                </View>

                <Text style={styles.modalSub}>Select portion size</Text>
                
                <View style={styles.portionRow}>
                  <Text style={styles.portionLabel}>Portion</Text>
                  <Text style={styles.portionValue}>{Math.round(portion)}g</Text>
                </View>

                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={15}   // Minimum 15g
                  maximumValue={200}  // Maximum 200g
                  step={1}
                  value={portion}
                  onValueChange={setPortion}
                  minimumTrackTintColor="#5C6BC0"
                  maximumTrackTintColor="#D1D5DB"
                  thumbTintColor="#5C6BC0"
                />

                <TouchableOpacity 
                  style={styles.dispenseBtn}
                  onPress={handleInstantFeed}
                >
                  <Text style={styles.dispenseBtnText}>Dispense Food</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelBtnLarge} 
                  onPress={() => setShowFeedModal(false)}
                >
                  <Text style={styles.cancelTextLarge}>Cancel</Text>
                </TouchableOpacity>
              </MotiView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FE" },
  header: { paddingBottom: 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { 
  flexDirection: 'row', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  paddingHorizontal: 24,
  paddingBottom: 12 // Keep some space below the text
  },
  petInput: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
    marginTop: 10,
    width: '100%',
  },
  cancelBtnLarge: {
    marginTop: 20,
    padding: 10,
    alignItems: 'center',
    width: '100%',
  },
  cancelTextLarge: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '500',
  },
  greeting: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  subGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  settingsBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 24 },
  liveCardWrapper: { 
    marginTop: 10,
    marginBottom: 24 
},
  liveCard: { height: 200, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  liveImage: { width: '100%', height: '100%' },
  liveBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 8, height: 8, backgroundColor: 'white', borderRadius: 4, marginRight: 6 },
  liveText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  playOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center' },
  playBtnCircle: { width: 64, height: 64, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  statCardWrapper: {
    width: '47%', // Moves the width constraint to the touchable
    marginBottom: 16,
  },
  statCard: { 
    width: '100%', // Card now fills the touchable
    backgroundColor: 'white', 
    padding: 16, 
    borderRadius: 24, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.05, 
    shadowRadius: 10 
  },
  statIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statLabel: { color: '#6B7280', fontSize: 12, marginBottom: 4 },
  statValue: { 
    fontSize: 14, // Slightly smaller to accommodate "Pet Name • Time"
    fontWeight: 'bold', 
    color: '#111827' 
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginVertical: 16 },
  actionCard: { backgroundColor: 'white', padding: 16, borderRadius: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  actionTitle: { fontWeight: '600', fontSize: 15 },
  actionSub: { color: '#6B7280', fontSize: 13, marginTop: 2 },
  actionBtn: { borderWidth: 1, borderColor: '#5C6BC0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
  actionBtnText: { color: '#5C6BC0', fontWeight: '600', fontSize: 13 },
  fabWrapper: { position: 'absolute', bottom: 15, right: 24 },
  fab: { backgroundColor: '#FFB74D', width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#FFB74D', shadowOpacity: 0.4, shadowRadius: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: 'white', width: '100%', padding: 24, borderRadius: 32 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSub: { color: '#6B7280', marginBottom: 24 },
  portionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  portionLabel: { color: '#6B7280' },
  portionValue: { fontWeight: 'bold', color: '#111827' },
  dispenseBtn: { backgroundColor: '#5C6BC0', padding: 16, borderRadius: 100, alignItems: 'center', marginTop: 24 },
  dispenseBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { marginTop: 12, alignItems: 'center' },
  cancelText: { color: '#9CA3AF' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 95, // Increased from 80
    backgroundColor: 'white',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingBottom: 25, // Increased padding to balance the larger height
  },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navText: { 
    fontSize: 12, // Increased from 10
    marginTop: 6, // Added more breathing room between icon and text
    color: '#9CA3AF' 
  },
  activeDot: { width: 4, height: 4, backgroundColor: '#5C6BC0', borderRadius: 2, marginTop: 4 },
  imageOptionsBox: {
    backgroundColor: 'white',
    width: '80%',
    padding: 24,
    borderRadius: 24,
    elevation: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 20,
  },
  gridBtn: {
    flex: 1,
    height: 100, // Matching the height feel of your stats cards
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4, // Space between the two buttons
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  petSelectorContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  petChipActive: {
    borderColor: '#5C6BC0',
    backgroundColor: '#EEF2FF',
  },
  petChipImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  petChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  petChipTextActive: {
    color: '#5C6BC0',
  },
  noPetsText: {
    color: '#EF4444',
    fontSize: 14,
    fontStyle: 'italic',
  },
});