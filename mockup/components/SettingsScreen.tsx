import React, { useState } from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  SafeAreaView 
} from "react-native";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { 
  ArrowLeft, 
  Wifi, 
  Bell, 
  Moon, 
  Globe, 
  HelpCircle, 
  Mail, 
  Shield, 
  ChevronRight 
} from "lucide-react-native";

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Helper for setting rows to keep the main JSX clean
  const SettingRow = ({ icon: Icon, color, title, sub, hasChevron, isSwitch, switchVal, onSwitch }: any) => (
    <TouchableOpacity 
      style={styles.row} 
      activeOpacity={isSwitch ? 1 : 0.7} 
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
      {/* Header */}
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
        {/* Device Settings */}
        <MotiView from={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 100 }}>
          <Text style={styles.sectionLabel}>Device Settings</Text>
          <View style={styles.card}>
            <SettingRow icon={Wifi} color="#5C6BC0" title="Wi-Fi Connection" sub="Home Network" hasChevron />
            <View style={styles.divider} />
            <SettingRow icon={Shield} color="#FFB74D" title="Firmware Update" sub="Version 2.4.0" hasChevron />
            <View style={styles.divider} />
            <SettingRow icon={Globe} color="#81C784" title="Location" sub="Living Room" hasChevron />
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
    </View>
  );
}

const styles = StyleSheet.create({
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
  logoutText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 }
});