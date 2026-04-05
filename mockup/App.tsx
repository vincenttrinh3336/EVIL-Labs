import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, StatusBar } from 'react-native';
import { CirclePause, Settings, LayoutDashboard } from 'lucide-react-native';

// Import your screens (we will convert these next)
// import Dashboard from './screens/Dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header Area */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Pet Feeder Pro</Text>
        <Settings color="#333" size={24} />
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {currentScreen === 'dashboard' ? (
          <View style={styles.placeholder}>
            <LayoutDashboard size={48} color="#6366f1" />
            <Text>Dashboard Screen Ready for Conversion</Text>
          </View>
        ) : (
          <Text>Other Screen</Text>
        )}
      </View>

      {/* Simple Navigation Bar (Replacing Web Tabs) */}
      <View style={styles.tabBar}>
        <Text onPress={() => setCurrentScreen('dashboard')}>Dashboard</Text>
        <Text onPress={() => setCurrentScreen('settings')}>Settings</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  tabBar: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  }
});