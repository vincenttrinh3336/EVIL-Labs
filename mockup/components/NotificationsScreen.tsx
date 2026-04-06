import React from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView 
} from "react-native";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { Swipeable, GestureHandlerRootView } from "react-native-gesture-handler";
import { 
  ArrowLeft, 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Trash2 
} from "lucide-react-native";

const notifications = [
  { id: 1, type: "success", icon: CheckCircle, title: "Luna has eaten", message: "Your pet completed their meal at 2:45 PM", time: "2h ago", color: "#81C784", unread: true },
  { id: 2, type: "warning", icon: AlertCircle, title: "Food reservoir low", message: "Only 10% food remaining. Please refill soon.", time: "5h ago", color: "#FFB74D", unread: true },
  { id: 3, type: "info", icon: Info, title: "Software update available", message: "Version 2.4.1 is ready to install", time: "1d ago", color: "#64B5F6", unread: false },
  { id: 4, type: "success", icon: CheckCircle, title: "Charlie has eaten", message: "Your pet completed their meal at 8:30 AM", time: "1d ago", color: "#81C784", unread: false },
  { id: 5, type: "info", icon: Bell, title: "Schedule reminder", message: "Next feeding scheduled for 6:00 PM today", time: "2d ago", color: "#5C6BC0", unread: false },
];

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  
  const renderRightActions = () => (
    <TouchableOpacity style={styles.deleteAction}>
      <Trash2 size={24} color="white" />
    </TouchableOpacity>
  );

  const NotificationCard = ({ item, index }: any) => {
    const Icon = item.icon;
    return (
      <MotiView
        from={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 100 }}
        style={styles.cardContainer}
      >
        <Swipeable renderRightActions={renderRightActions} friction={2}>
          <View style={[styles.card, item.unread ? styles.unreadShadow : styles.readShadow]}>
            <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
              <Icon size={24} color={item.color} />
            </View>
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.unread && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardMessage}>{item.message}</Text>
              <Text style={styles.cardTime}>{item.time}</Text>
            </View>
          </View>
        </Swipeable>
      </MotiView>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={["#5C6BC0", "#7986CB"]} style={styles.header}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                <ArrowLeft size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Notifications</Text>
              <TouchableOpacity>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionLabel}>Today</Text>
          {notifications.slice(0, 2).map((item, i) => (
            <NotificationCard key={item.id} item={item} index={i} />
          ))}

          <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Earlier</Text>
          {notifications.slice(2).map((item, i) => (
            <NotificationCard key={item.id} item={item} index={i + 2} />
          ))}
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FE" },
  header: { paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  clearText: { color: 'white', fontSize: 14, opacity: 0.9 },
  content: { flex: 1, paddingHorizontal: 20 },
  sectionLabel: { color: '#9CA3AF', fontSize: 14, marginVertical: 16, marginLeft: 4 },
  cardContainer: { marginBottom: 12, borderRadius: 20, overflow: 'hidden' },
  card: { flexDirection: 'row', padding: 16, backgroundColor: 'white', borderRadius: 20, alignItems: 'start' },
  unreadShadow: { elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 },
  readShadow: { elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardContent: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  unreadDot: { width: 8, height: 8, backgroundColor: '#5C6BC0', borderRadius: 4 },
  cardMessage: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 8 },
  cardTime: { fontSize: 12, color: '#9CA3AF' },
  deleteAction: { backgroundColor: '#EF4444', width: 80, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
});