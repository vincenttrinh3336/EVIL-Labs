import React, { useState } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  SafeAreaView, 
  Modal,
  Dimensions 
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import Slider from '@react-native-community/slider';
import { 
  Home, 
  Video, 
  Heart, 
  Bell, 
  Utensils, 
  Clock, 
  BarChart3, 
  Wifi, 
  Settings 
} from "lucide-react-native";

const { width } = Dimensions.get("window");

export function HomeDashboard({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const [showFeedModal, setShowFeedModal] = useState(false);
  const [portion, setPortion] = useState(50);
  const [activeTab, setActiveTab] = useState("home");

  const stats = [
    { icon: Utensils, label: "Last Feeding", value: "2h ago", color: "#FFB74D" },
    { icon: Clock, label: "Next Scheduled", value: "6:00 PM", color: "#5C6BC0" },
    { icon: BarChart3, label: "Food Remaining", value: "65%", color: "#81C784" },
    { icon: Wifi, label: "Feeder Status", value: "Online", color: "#64B5F6" },
  ];

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "live", icon: Video, label: "Live" },
    { id: "pets", icon: Heart, label: "Pets" },
    { id: "notifications", icon: Bell, label: "Alerts" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#5C6BC0", "#7986CB"]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <MotiView from={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Text style={styles.greeting}>Hi, Welcome Back! 👋</Text>
              <Text style={styles.subGreeting}>Luna's feeder is ready 🐕</Text>
            </MotiView>
            <TouchableOpacity 
              onPress={() => onNavigate("settings")}
              style={styles.settingsBtn}
            >
              <Settings size={20} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
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
            <MotiView 
              key={stat.label}
              from={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 100 + (i * 50) }}
              style={styles.statCard}
            >
              <View style={[styles.statIconBox, { backgroundColor: `${stat.color}15` }]}>
                <stat.icon size={20} color={stat.color} />
              </View>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
            </MotiView>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionCard}>
          <View>
            <Text style={styles.actionTitle}>Schedule Next Meal</Text>
            <Text style={styles.actionSub}>Set a custom feeding time</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Schedule</Text>
          </TouchableOpacity>
        </View>
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
      <Modal visible={showFeedModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>Feed Now</Text>
            <Text style={styles.modalSub}>Select portion size</Text>
            
            <View style={styles.portionRow}>
              <Text style={styles.portionLabel}>Portion</Text>
              <Text style={styles.portionValue}>{Math.round(portion)}g</Text>
            </View>

            <Slider
              style={{ width: '100%', height: 40 }}
              minimumValue={0}
              maximumValue={100}
              step={5}
              value={portion}
              onValueChange={setPortion}
              minimumTrackTintColor="#5C6BC0"
              maximumTrackTintColor="#D1D5DB"
              thumbTintColor="#5C6BC0"
            />

            <TouchableOpacity 
              style={styles.dispenseBtn}
              onPress={() => setShowFeedModal(false)}
            >
              <Text style={styles.dispenseBtnText}>Dispense Food</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => setShowFeedModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => setActiveTab(item.id)}
              style={styles.navItem}
            >
              <item.icon size={24} color={isActive ? "#5C6BC0" : "#9CA3AF"} />
              <Text style={[styles.navText, isActive && { color: "#5C6BC0" }]}>{item.label}</Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FE" },
  header: { paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 12 },
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '47%', backgroundColor: 'white', padding: 16, borderRadius: 24, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  statIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statLabel: { color: '#6B7280', fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
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