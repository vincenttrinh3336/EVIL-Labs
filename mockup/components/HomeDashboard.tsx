import React, { useState, useEffect } from "react";
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
import { 
  Home, 
  Video, 
  Heart,
  Archive, 
  Bell, 
  Utensils, 
  Clock, 
  BarChart3, 
  Wifi, 
  Settings 
} from "lucide-react-native";
import { RPI_URL } from "../constants";

const { width } = Dimensions.get("window");
const GRAMS_PER_SECOND = 15;

// Add to separate utils file later
  const getNextFeeding = (schedules: any[]) => {
  if (!schedules || schedules.length === 0) return { label: "None", time: "--:--" };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Convert all schedules to minutes from midnight
  const mappedSchedules = schedules.map(s => {
    // Handling both tuple [id, time, pet, sec] and object {time, pet} formats
    const timeStr = Array.isArray(s) ? s[1] : s.time;
    const petName = Array.isArray(s) ? s[2] : s.pet;

    const [hrs, mins] = timeStr.split(':').map(Number);
    return { label: petName, time: timeStr, totalMinutes: hrs * 60 + mins };
  });

  // Filter for feedings later today
  let futureFeedings = mappedSchedules.filter(s => s.totalMinutes > currentMinutes);

  // Sort by time
  futureFeedings.sort((a, b) => a.totalMinutes - b.totalMinutes);

  // If no more feedings today, the next one is the first one tomorrow (the smallest totalMinutes)
  const next = futureFeedings.length > 0 
    ? futureFeedings[0] 
    : mappedSchedules.sort((a, b) => a.totalMinutes - b.totalMinutes)[0];

  return { label: next.label, time: next.time };
};
// End of utils file

export function HomeDashboard({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [lastFeeding, setLastFeeding] = useState<any>(null);
  const [foodLevel, setFoodLevel] = useState<"normal" | "low">("normal");
  const insets = useSafeAreaInsets();
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [petName, setPetName] = useState("");
  const [portion, setPortion] = useState(15);
  const [schedules, setSchedules] = useState([]); 

  // 2. Fetch current schedules from Raspberry Pi on mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Feeding Logs for the "Last Feeding" stat
        const logsRes = await fetch(`${RPI_URL}/feeding-logs`);
        const logs = await logsRes.json();
        
        if (logs && logs.length > 0) {
          // Sort by date/time to ensure we have the absolute newest entry
          const sortedLogs = [...logs].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setLastFeeding(sortedLogs[0]);
        } else {
          setLastFeeding(null);
        }

        const schedRes = await fetch(`${RPI_URL}/get-schedules`);
        const schedulesData = await schedRes.json();
        setSchedules(await schedulesData);

        // Fetch current food level from DB
        const levelRes = await fetch(`${RPI_URL}/get-food-level`);
        const levelData = await levelRes.json();
        if (levelData.status) {
          setFoodLevel(levelData.status);
        }
      } catch (e) {
        console.error("Initial fetch failed:", e);
      }
    };
    fetchDashboardData();



    // 2. Real-time Firebase Listener
    const messaging = getMessaging();
    const unsubscribe = onMessage(messaging, async (remoteMessage) => {
      const action = remoteMessage.data?.action;
      
      if (action === "refresh_logs" || action === "food_low" || action === "food_refilled") {
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
  }, []);

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
      value: `${lastFeeding.time}`,
      color: isOld ? "#EF4444" : "#81C784" 
    };
  };

  const lastFeedingInfo = getLastFeedingInfo();
  const nextFeeding = getNextFeeding(schedules);

  const stats = [
    { 
      id: "last", 
      icon: Utensils, 
      label: "Last Feeding", 
      value: lastFeedingInfo.label === "No data" 
        ? "No data" 
        : `${lastFeedingInfo.label} • ${lastFeedingInfo.value}`, 
      color: lastFeedingInfo.color 
    },
    { 
      id: "next", // Added ID to identify the specific card
      icon: Clock, 
      label: "Next Scheduled", 
      value: `${nextFeeding.label} • ${nextFeeding.time}`, 
      color: "#5C6BC0" 
    },
    { 
      id: "remaining", // This is your Bottom Right item
      icon: BarChart3, 
      label: "Food Level", 
      value: foodLevel === "low" ? "Low" : "Normal", 
      color: foodLevel === "low" ? "#EF4444" : "#81C784" // Red if low, Green if normal
    },
    { id: "status", icon: Wifi, label: "Feeder Status", value: "Online", color: "#64B5F6" },
  ];

  const handleInstantFeed = async () => {
  if (!petName.trim()) {
    Alert.alert("Missing Info", "Please enter a pet name.");
    return;
  }

  // 1. Calculate time: 15 seconds in the future
  const futureDate = new Date(Date.now() + 15000);
  const timeStr = futureDate.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });

  // 2. Convert grams to seconds (Math.floor to match Pi logic)
  const durationSeconds = Math.floor(portion / GRAMS_PER_SECOND);

  try {
    const response = await fetch(`${RPI_URL}/add-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        time_of_day: timeStr,
        pet_name: petName,
        seconds: durationSeconds
      })
    });

    if (response.ok) {
      Alert.alert("Success", `Feeding ${petName} ${portion}g at ${timeStr}`);
      setShowFeedModal(false);
      setPetName(""); // Reset for next time
    }
  } catch (e) {
    Alert.alert("Connection Error", "Could not reach the feeder.");
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
            <Text style={styles.greeting}>Welcome Back! 👋</Text>
            <Text style={styles.subGreeting}>Pet feeder is online 🐕</Text>
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
            onPress={() => onNavigate("live")} 
            style={styles.liveCard}
          >
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1597105888983-ae503ec1ef3e?q=80&w=1080" }} 
              style={styles.liveImage} 
            />
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
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
              disabled={stat.id !== "next"} // Only the 'next' card is clickable for now
              onPress={() => stat.id === "next" && onNavigate("pets")}
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
          onPress={() => onNavigate("schedules")} // Triggers navigation to the new screen
        >
          <View>
            <Text style={styles.actionTitle}>View Schedule</Text>
            <Text style={styles.actionSub}>Add, Edit, Delete feeding times</Text>
          </View>
          <View style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Schedule</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Floating Action Button */}
      <MotiView 
        from={{ scale: 0 }} 
        animate={{ scale: 1 }} 
        transition={{ type: 'spring', delay: 500 }}
        style={styles.fabWrapper}
      >
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => setShowFeedModal(true)}
        >
          <Utensils size={28} color="white" />
        </TouchableOpacity>
      </MotiView>

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
                <TextInput
                  style={styles.petInput}
                  placeholder="Enter Pet Name"
                  value={petName}
                  onChangeText={setPetName}
                  placeholderTextColor="#9CA3AF"
                />

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
  header: { paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
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
    fontSize: 18, // Slightly bigger as requested
    fontWeight: '500',
  },
  greeting: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  subGreeting: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 },
  settingsBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 24 },
  liveCardWrapper: { marginTop: -20, marginBottom: 24 },
  liveCard: { height: 200, borderRadius: 24, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15 },
  liveImage: { width: '100%', height: '100%' },
  liveBadge: { position: 'absolute', top: 16, left: 16, backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  liveDot: { width: 8, height: 8, backgroundColor: 'white', borderRadius: 4, marginRight: 6 },
  liveText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
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
  fabWrapper: { position: 'absolute', bottom: 100, right: 24 },
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
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'white', flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: 20 },
  navItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navText: { fontSize: 10, marginTop: 4, color: '#9CA3AF' },
  activeDot: { width: 4, height: 4, backgroundColor: '#5C6BC0', borderRadius: 2, marginTop: 4 }
});