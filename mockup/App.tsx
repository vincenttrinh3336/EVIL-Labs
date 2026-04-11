import React, { useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Home, Video, Archive, Bell, ChartNoAxesColumn } from "lucide-react-native";
import { 
  getMessaging, 
  requestPermission, 
  subscribeToTopic,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  AuthorizationStatus 
} from '@react-native-firebase/messaging';

// Import your components
import { SplashScreen } from "./components/SplashScreen";
import { OnboardingScreens } from "./components/OnboardingScreens";
import { LoginScreen } from "./components/LoginScreen";
import { HomeDashboard } from "./components/HomeDashboard";
import { VideoListScreen } from "./components/VideoListScreen";
import { NotificationsScreen } from "./components/NotificationsScreen";
import { HistoryScreen } from "./components/HistoryScreen";
import { SchedulesScreen } from "./components/SchedulesScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";

type Screen = "splash" | "onboarding" | "login" | "home" | "video" | "history" | "notifications" | "settings" | "schedules" | "history";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");

  useEffect(() => {
    const messaging = getMessaging(); // Get the instance
    const setupCloudMessaging = async () => {

    // 2. Request permission (required for iOS)
      const authStatus = await requestPermission(messaging);
      const enabled = 
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // 3. Subscribe to your Python topic
        await subscribeToTopic(messaging, 'feeder_updates');
        console.log('Subscribed to feeder_updates');
      }
    };

  setupCloudMessaging();

  // 1. Handle notification tap when app was in BACKGROUND
  const unsubscribeOpenedApp = onNotificationOpenedApp(messaging, (remoteMessage) => {
    console.log('App opened via notification:', remoteMessage.data);

    const action = remoteMessage.data?.action;

    if (action === 'refresh_logs') {
      setCurrentScreen('history'); 
    } else if (action === 'video_available') {
    // Navigate to the new VideoList screen and pass the filename
    setCurrentScreen('video'); 
    // If you use a state manager or global props, save remoteMessage.data.file_name here
  }
  });

  // 2. Handle notification tap when app was completely CLOSED (Quit state)
  getInitialNotification(messaging).then((remoteMessage) => {
    if (remoteMessage) {
      const action = remoteMessage.data?.action;
      console.log('App launched from quit state:', remoteMessage.data);

      if (action === 'refresh_logs') {
        setCurrentScreen('history');
      } else if (action === 'video_available') {
      setCurrentScreen('video');
      // Ensure the UI knows which specific video triggered the launch
    }
    }
  });

  return unsubscribeOpenedApp; // Cleanup listener on unmount
}, []);

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "analytics", icon: ChartNoAxesColumn, label: "Analytics" },
    { id: "history", icon: Archive, label: "History" },
    { id: "notifications", icon: Bell, label: "Alerts" },
  ];

  // Helper to determine if we should show the bottom nav
  const showNav = !["splash", "onboarding", "login"].includes(currentScreen);

  const renderContent = () => {
    switch (currentScreen) {
      case "splash": return <SplashScreen onGetStarted={() => setCurrentScreen("onboarding")} />;
      case "onboarding": return <OnboardingScreens onComplete={() => setCurrentScreen("login")} />;
      case "login": return <LoginScreen onLogin={() => setCurrentScreen("home")} />;
      case "home": return <HomeDashboard onNavigate={setCurrentScreen} />;
      case "analytics": return <AnalyticsScreen onBack={() => setCurrentScreen("home")} />;
      case "history": return <HistoryScreen onNavigate={setCurrentScreen} />;
      case "video": return <VideoListScreen onBack={() => setCurrentScreen("home")} />;
      case "notifications": return <NotificationsScreen onBack={() => setCurrentScreen("home")} />;
      case "schedules": return <SchedulesScreen onBack={() => setCurrentScreen("home")} />;
      case "settings": return <SettingsScreen onBack={() => setCurrentScreen("home")} />;
      default: return <HomeDashboard onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <View style={styles.content}>
          {renderContent()}
        </View>

        {showNav && (
          <View style={styles.bottomNav}>
            {navItems.map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setCurrentScreen(item.id as Screen)}
                  style={styles.navItem}
                >
                  <item.icon size={24} color={isActive ? "#5C6BC0" : "#9CA3AF"} />
                  <Text style={[styles.navText, isActive && { color: "#5C6BC0" }]}>
                    {item.label}
                  </Text>
                  {isActive && <View style={styles.activeDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FE" },
  content: { flex: 1 },
  bottomNav: {
    height: 80,
    backgroundColor: "white",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingBottom: 20,
  },
  navItem: { flex: 1, justifyContent: "center", alignItems: "center" },
  navText: { fontSize: 10, marginTop: 4, color: "#9CA3AF" },
  activeDot: { width: 4, height: 4, backgroundColor: "#5C6BC0", borderRadius: 2, marginTop: 4 },
});