import React, { useState, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import { useSafeAreaInsets, SafeAreaProvider } from "react-native-safe-area-context";
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
import { EditImageScreen } from "./components/EditImageScreen";

type Screen = string;


// "MainLayout" component to hold the UI logic
function MainLayout({ currentScreen, setCurrentScreen, renderContent, showNav, navItems }) {
  const insets = useSafeAreaInsets(); // Child of SafeAreaProvider

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderContent()}
      </View>

      {showNav && (
        <View style={[
          styles.bottomNav, 
          { 
            height: 70 + insets.bottom, 
            paddingBottom: insets.bottom, 
            // Center the content vertically within the available space
            justifyContent: 'center'
          }
        ]}>
          {navItems.map((item) => {
            const isActive = currentScreen.split('?')[0] === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setCurrentScreen(item.id)}
                style={styles.navItem}
              >
                <item.icon size={28} color={isActive ? "#5C6BC0" : "#9CA3AF"} />
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
  );
}


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
  const showNav = !["splash", "onboarding", "login"].includes(currentScreen.split('?')[0]);

  const renderContent = () => {
    // 1. Handle base screen name
    const [screenName, queryString] = currentScreen.split('?');
  
    // 2. Parse parameters if they exist
    const params: any = {};
    if (queryString) {
      queryString.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        params[key] = decodeURIComponent(value);
      });
    }
    switch (screenName) {
      case "splash": return <SplashScreen onGetStarted={() => setCurrentScreen("onboarding")} />;
      case "onboarding": return <OnboardingScreens onComplete={() => setCurrentScreen("login")} />;
      case "login": return <LoginScreen onLogin={() => setCurrentScreen("home")} />;
      case "home": return <HomeDashboard onNavigate={setCurrentScreen} routeParams={params} />;
      case "analytics": return <AnalyticsScreen onBack={() => setCurrentScreen("home")} />;
      case "history": return <HistoryScreen onNavigate={setCurrentScreen} />;
      case "video": return <VideoListScreen onNavigate={setCurrentScreen} />;
      case "editImage":
        return (
          <EditImageScreen 
            route={{ params }} 
            onNavigate={setCurrentScreen} 
          />
      );
      case "notifications": return <NotificationsScreen onBack={() => setCurrentScreen("home")} />;
      case "schedules": return <SchedulesScreen onBack={() => setCurrentScreen("home")} />;
      case "settings": return <SettingsScreen onBack={() => setCurrentScreen("home")} />;
      default: return <HomeDashboard onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <SafeAreaProvider>
      {/* This is the ONLY thing App should return. 
          MainLayout now handles the View, the Content, and the BottomNav.
      */}
      <MainLayout 
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        renderContent={renderContent}
        showNav={showNav}
        navItems={navItems}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FE" },
  content: { flex: 1 },
  bottomNav: {
    //height: 80,
    backgroundColor: "white",
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    //paddingBottom: 20,
  },
  navItem: { flex: 1, justifyContent: "center", alignItems: "center" },
  navText: { fontSize: 10, marginTop: 2, color: "#9CA3AF" },
  activeDot: { width: 4, height: 4, backgroundColor: "#5C6BC0", borderRadius: 2, marginTop: 4 },
});