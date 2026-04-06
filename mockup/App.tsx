import React, { useState } from "react";
import { StyleSheet, View, SafeAreaView, StatusBar } from "react-native";

// Note: You will need to convert these components next!
import { SplashScreen } from "./components/SplashScreen";
import { OnboardingScreens } from "./components/OnboardingScreens";
import { LoginScreen } from "./components/LoginScreen";
import { HomeDashboard } from "./components/HomeDashboard";
import { LiveFeedScreen } from "./components/LiveFeedScreen";
import { PetProfilesScreen } from "./components/PetProfilesScreen";
import { NotificationsScreen } from "./components/NotificationsScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";

type Screen =
  | "splash"
  | "onboarding"
  | "login"
  | "home"
  | "live"
  | "pets"
  | "notifications"
  | "settings"
  | "analytics";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");

  const renderScreen = () => {
    switch (currentScreen) {
      case "splash":
        return <SplashScreen onGetStarted={() => setCurrentScreen("onboarding")} />;
      case "onboarding":
        return <OnboardingScreens onComplete={() => setCurrentScreen("login")} />;
      case "login":
        return <LoginScreen onLogin={() => setCurrentScreen("home")} />;
      case "home":
        return <HomeDashboard onNavigate={(screen) => setCurrentScreen(screen as Screen)} />;
      case "live":
        return <LiveFeedScreen onBack={() => setCurrentScreen("home")} />;
      case "pets":
        return <PetProfilesScreen onBack={() => setCurrentScreen("home")} />;
      case "notifications":
        return <NotificationsScreen onBack={() => setCurrentScreen("home")} />;
      case "settings":
        return <SettingsScreen onBack={() => setCurrentScreen("home")} />;
      case "analytics":
        return <AnalyticsScreen onBack={() => setCurrentScreen("home")} />;
      default:
        return <HomeDashboard onNavigate={(screen) => setCurrentScreen(screen as Screen)} />;
    }
  };

  return (
    // SafeAreaView prevents the UI from going under the iPhone notch
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.wrapper}>
        {renderScreen()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // Matches your bg-background
  },
  wrapper: {
    flex: 1,
    // Mobile apps are "size-full" by default with flex: 1
  },
});