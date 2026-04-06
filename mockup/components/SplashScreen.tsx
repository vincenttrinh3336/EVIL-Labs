import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from "react-native";
import { MotiView } from "moti"; 
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface SplashScreenProps {
  onGetStarted: () => void;
}

export function SplashScreen({ onGetStarted }: SplashScreenProps) {
  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#5C6BC0", "#7986CB"]}
        style={StyleSheet.absoluteFill}
      />

      {/* Paw print background pattern */}
      <View style={StyleSheet.absoluteFill}>
        {[...Array(20)].map((_, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ delay: i * 100, duration: 500 }}
            style={[
              styles.paw,
              {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              },
            ]}
          >
            <Text style={{ fontSize: 40 }}>🐾</Text>
          </MotiView>
        ))}
      </View>

      {/* Logo Animation */}
      <MotiView
        from={{ scale: 0, rotate: "-180deg" }}
        animate={{ scale: 1, rotate: "0deg" }}
        transition={{ type: "spring", duration: 800 }}
        style={styles.logoContainer}
      >
        <View style={styles.logoCircle}>
          <MotiView
            from={{ translateY: -10 }}
            animate={{ translateY: 10 }}
            transition={{
              type: "timing",
              duration: 1500,
              loop: true,
              repeatReverse: true,
            }}
          >
            <Text style={{ fontSize: 70 }}>🍽️</Text>
          </MotiView>
        </View>
      </MotiView>

      {/* Food dropping animation */}
      <MotiView
        from={{ translateY: -50, opacity: 0 }}
        animate={{ translateY: 100, opacity: 1 }}
        transition={{
          type: "timing",
          duration: 2000,
          loop: true,
          repeatDelay: 1000,
        }}
        style={styles.bone}
      >
        <Text style={{ fontSize: 40 }}>🦴</Text>
      </MotiView>

      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 500 }}
        style={styles.textCenter}
      >
        <Text style={styles.title}>Feed Smarter</Text>
        <Text style={styles.subtitle}>
          Automate and monitor your pet's meals.
        </Text>

        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={onGetStarted}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </MotiView>

      {/* Bottom decoration */}
      <MotiView
        from={{ translateY: 100 }}
        animate={{ translateY: 0 }}
        transition={{ delay: 800, duration: 600 }}
        style={styles.bottomWave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  paw: {
    position: "absolute",
  },
  logoContainer: {
    zIndex: 10,
    marginBottom: 32,
  },
  logoCircle: {
    backgroundColor: "#fff",
    borderRadius: 100,
    padding: 32,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  bone: {
    position: "absolute",
    top: "30%",
    left: "50%",
    marginLeft: -20, // Center the emoji
  },
  textCenter: {
    alignItems: "center",
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 50,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  buttonText: {
    color: "#5C6BC0",
    fontSize: 18,
    fontWeight: "600",
  },
  bottomWave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
});
