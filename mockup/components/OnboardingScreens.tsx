import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { Clock, Video, TrendingUp, ChevronRight } from "lucide-react-native";

const { width } = Dimensions.get("window");

interface OnboardingScreensProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Clock,
    title: "Feed Smarter",
    description: "Automate feeding schedules and never miss a meal. Set custom portions and times for your pets.",
    color: "#5C6BC0",
  },
  {
    icon: Video,
    title: "Stay Connected",
    description: "Watch your pets eat with live video feed. Dispense food remotely with just a tap.",
    color: "#FFB74D",
  },
  {
    icon: TrendingUp,
    title: "Track Nutrition",
    description: "Monitor feeding patterns and track your pet's health with detailed analytics and history.",
    color: "#81C784",
  },
];

export function OnboardingScreens({ onComplete }: OnboardingScreensProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <View style={styles.container}>
      {/* Skip button - Replaces the top div */}
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={onComplete}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides Container */}
      <View style={styles.contentContainer}>
        <AnimatePresence exitBeforeEnter>
          <MotiView
            key={currentSlide}
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            exit={{ opacity: 0, translateX: -50 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.slide}
          >
            {/* Animated Icon Circle */}
            <MotiView 
              from={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 200 }}
              style={[styles.iconCircle, { backgroundColor: slides[currentSlide].color }]}
            >
              {React.createElement(slides[currentSlide].icon, {
                size: 64,
                color: "#FFFFFF",
              })}
            </MotiView>

            <Text style={styles.title}>{slides[currentSlide].title}</Text>
            <Text style={styles.description}>
              {slides[currentSlide].description}
            </Text>
          </MotiView>
        </AnimatePresence>
      </View>

      {/* Pagination dots - Clickable like your original */}
      <View style={styles.paginationRow}>
        {slides.map((_, index) => (
          <TouchableOpacity 
            key={index} 
            onPress={() => setCurrentSlide(index)}
          >
            <View
              style={[
                styles.dot,
                index === currentSlide ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handleNext} 
          activeOpacity={0.8}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            {currentSlide < slides.length - 1 ? "Continue" : "Get Started"}
          </Text>
          {currentSlide < slides.length - 1 && (
            <ChevronRight size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  skipContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  skipText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    alignItems: "center",
    width: width,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    // Android Shadow
    elevation: 10,
    // iOS Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 17,
    color: "#666",
    textAlign: "center",
    lineHeight: 26,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    transition: 'all',
  },
  activeDot: {
    width: 32,
    backgroundColor: "#5C6BC0",
  },
  inactiveDot: {
    width: 8,
    backgroundColor: "#E0E0E0",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: "#5C6BC0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    borderRadius: 100,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
