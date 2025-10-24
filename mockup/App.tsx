import { useState } from "react";
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
    <div className="size-full max-w-md mx-auto bg-background shadow-2xl overflow-hidden">
      {renderScreen()}
    </div>
  );
}
