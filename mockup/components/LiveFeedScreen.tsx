import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image, Dimensions, SafeAreaView } from "react-native";
import { MotiView } from "moti";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Video, Camera, Volume2, VolumeX, Radio } from "lucide-react-native";

const { width } = Dimensions.get("window");

interface LiveFeedScreenProps {
  onBack: () => void;
}

export function LiveFeedScreen({ onBack }: LiveFeedScreenProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  return (
    <View style={styles.container}>
      {/* Video Feed Area */}
      <View style={styles.videoContainer}>
        <Image
          source={{ uri: "https://images.unsplash.com/photo-1597105888983-ae503ec1ef3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwZWF0aW5nfGVufDF8fHx8MTc2MDIzNTM5NXww&ixlib=rb-4.1.0&q=80&w=1080" }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />

        {/* Top Gradient & Navigation */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.topGradient}
        >
          <SafeAreaView style={styles.headerRow}>
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.liveBadge}>
              <MotiView
                from={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                transition={{ loop: true, duration: 1000, type: 'timing' }}
                style={styles.liveDot}
              />
              <Text style={styles.liveText}>LIVE</Text>
            </View>

            <View style={styles.statusIndicator}>
              <Radio size={20} color="white" />
            </View>
          </SafeAreaView>
        </LinearGradient>

        {/* Detection Overlay */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.detectionCard}
        >
          <View style={styles.detectionInner}>
            <View style={styles.petAvatar}>
              <Text style={{ fontSize: 24 }}>🐕</Text>
            </View>
            <View>
              <Text style={styles.detectionTitle}>Detected: Luna</Text>
              <Text style={styles.detectionSub}>RFID Tag: #A4F2B8</Text>
            </View>
            <MotiView
              from={{ scale: 1 }}
              animate={{ scale: 1.2 }}
              transition={{ loop: true, type: 'timing', duration: 1000 }}
              style={styles.activePulse}
            />
          </View>
        </MotiView>

        {/* Bottom Controls Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.bottomGradient}
        >
          <View style={styles.controlsRow}>
            <TouchableOpacity 
              onPress={() => setIsRecording(!isRecording)}
              style={[styles.actionBtn, isRecording && styles.recordingActive]}
            >
              <Video size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.snapshotBtn}>
              <Camera size={28} color="#5C6BC0" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setIsMuted(!isMuted)}
              style={styles.actionBtn}
            >
              {isMuted ? <VolumeX size={24} color="white" /> : <Volume2 size={24} color="white" />}
            </TouchableOpacity>
          </View>

          <View style={styles.infoBar}>
            <View style={{ flex: 1 }}>
              {isRecording && (
                <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.recordingTextRow}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.infoText}>Recording...</Text>
                </MotiView>
              )}
            </View>
            <Text style={styles.infoText}>Quality: HD 1080p</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Quick Actions Panel */}
      <MotiView
        from={{ translateY: 100 }}
        animate={{ translateY: 0 }}
        style={styles.quickActions}
      >
        <Text style={styles.panelTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridBtn}>
            <Camera size={24} color="#5C6BC0" />
            <Text style={styles.gridBtnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridBtn}>
            <Video size={24} color="#FFB74D" />
            <Text style={styles.gridBtnText}>Start Recording</Text>
          </TouchableOpacity>
        </View>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  videoContainer: {
    flex: 1,
  },
  topGradient: {
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    backgroundColor: 'white',
    borderRadius: 4,
  },
  liveText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusIndicator: {
    width: 44,
    height: 44,
    backgroundColor: '#22C55E',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionCard: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
  },
  detectionInner: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petAvatar: {
    width: 48,
    height: 48,
    backgroundColor: '#5C6BC0',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectionTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1A1A1A',
  },
  detectionSub: {
    fontSize: 12,
    color: '#666',
  },
  activePulse: {
    marginLeft: 'auto',
    width: 12,
    height: 12,
    backgroundColor: '#22C55E',
    borderRadius: 6,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 30,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  actionBtn: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingActive: {
    backgroundColor: '#EF4444',
  },
  snapshotBtn: {
    width: 64,
    height: 64,
    backgroundColor: 'white',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  infoBar: {
    flexDirection: 'row',
    marginTop: 24,
  },
  infoText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  recordingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 10,
    height: 10,
    backgroundColor: '#EF4444',
    borderRadius: 5,
  },
  quickActions: {
    backgroundColor: 'white',
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  gridBtnText: {
    fontSize: 12,
    color: '#374151',
  },
});