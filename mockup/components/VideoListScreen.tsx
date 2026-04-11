import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions ,
  Modal,
  Animated,
  PanResponder,
  Image
} from 'react-native';
import RNFS from 'react-native-fs';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Video from 'react-native-video';
import { ArrowLeft, Download, CheckCircle, WifiOff, PlayCircle } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RPI_URL } from "../constants"; // Make sure URL is correct

import { MotiView } from "moti";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function VideoListScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();

  // States
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [downloadingItems, setDownloadingItems] = useState({}); // Tracks progress by filename
  const [playingVideo, setPlayingVideo] = useState(null);
  const translateY = useRef(new Animated.Value(0)).current;

  // Gesture Handler for Swipe-to-Close
  const videoPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
      onPanResponderMove: (_, gesture) => {
        // Only allow downward swiping
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 150) {
          // If swiped far enough, slide off screen and close
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setPlayingVideo(null);
            translateY.setValue(0);
          });
        } else {
          // Reset to center if swipe wasn't far enough
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const playVideo = (fileName) => {
    const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    setPlayingVideo(`file://${localPath}`);
  };

  // Handle download function
  const handleDownload = async (fileName) => {
      const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      const url = `${RPI_URL}/videos/${fileName}`;

      try {
          const download = RNFS.downloadFile({
              fromUrl: url,
              toFile: localPath,
              progress: (res) => {
                  const progress = (res.bytesWritten / res.contentLength) * 100;
                  // Update progress in state
                  setDownloadingItems(prev => ({
                      ...prev,
                      [fileName]: progress
                  }));
              },
              progressDivider: 1,
          });

          await download.promise;
          
          // Finalize state
          setDownloadingItems(prev => ({
              ...prev,
              [fileName]: 100 // Finished
          }));
          
          console.log("Download complete to:", localPath);
      } catch (error) {
          console.error("Download failed:", error);
          setDownloadingItems(prev => {
              const newState = { ...prev };
              delete newState[fileName];
              return newState;
          });
      }
    };

  // Fetch video function
  const fetchVideoList = useCallback(async () => {
    setLoading(true);
    try {
        // Use a timeout to detect if the Pi is truly unreachable
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${RPI_URL}/list-videos`, { 
            signal: controller.signal 
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            setVideos(data);
            setIsOffline(false);
            // CHECK FOR LOCAL FILES
            const statusMap = {};
            for (const video of data) {
              const path = `${RNFS.DocumentDirectoryPath}/${video.file_name}`;
              const exists = await RNFS.exists(path);
              if (exists) {
                statusMap[video.file_name] = 100; // Mark as downloaded
              }
            }
      setDownloadingItems(statusMap);
      setIsOffline(false);
        } else {
            setIsOffline(true);
        }
    } catch (err) {
        console.error("Failed to sync videos:", err);
        setIsOffline(true);
    } finally {
        setLoading(false);
    }
  }, []);

  // Sync on mount
  useEffect(() => {
    fetchVideoList();
  }, [fetchVideoList]);

  // UI
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate("home")}>
          <ArrowLeft color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recorded Clips</Text>
        <View style={{ width: 24 }} /> {/* Spacer to keep title centered */}
      </View>

      {/* Offline Alert */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={16} color="white" />
          <Text style={styles.offlineText}>Cannot connect to feeder</Text>
        </View>
      )}

      {/* Flatlist */}
      <FlatList
        data={videos}
        keyExtractor={(item) => item.file_name}
        renderItem={({ item }) => {
        const progress = downloadingItems[item.file_name] || 0;
        const isDownloaded = progress === 100;

        const thumbnailUri = `${RPI_URL}/videos/${item.file_name.replace('.mp4', '.jpg')}`;
        
        return (
            <View style={styles.videoCard}>
              <Image 
                source={{ uri: thumbnailUri}} 
                style={styles.thumbnail}
                resizeMode="cover"
              />
              <View style={styles.cardRightArea}>
                <View style={styles.textContainer}>
                  <Text style={styles.videoDate}>
                    {new Date(item.timestamp * 1000).toLocaleString([], { 
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </Text>
                  <Text style={styles.fileName} numberOfLines={1}>{item.file_name}</Text>
                </View>

                <AnimatedCircularProgress
                  size={42}
                  width={3}
                  fill={progress}
                  tintColor="#5C6BC0"
                  backgroundColor="#E5E7EB"
                >
                  {(fill) => (
                    <TouchableOpacity 
                      onPress={() => isDownloaded ? playVideo(item.file_name) : handleDownload(item.file_name)}
                      style={styles.downloadButton}
                    >
                      {isDownloaded ? (
                        <PlayCircle size={22} color="#5C6BC0" /> 
                      ) : progress > 0 ? (
                        <Text style={styles.progressText}>{Math.round(fill)}%</Text>
                      ) : (
                        <Download size={20} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  )}
                </AnimatedCircularProgress>
              </View>
            </View>
            );
        }}
        onRefresh={fetchVideoList}
        refreshing={loading}
      />
      <Modal visible={!!playingVideo} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            {...videoPanResponder.panHandlers}
            style={[
              styles.videoContainer,
              { transform: [{ translateY: translateY }] }
            ]}
          >
            {/* Visual handle to indicate swipeable area */}
            <View style={styles.swipeHandle} />
            
            {playingVideo && (
              <Video
                source={{ uri: playingVideo }}
                style={styles.fullVideo}
                controls={true}
                resizeMode="contain"
                onEnd={() => setPlayingVideo(null)}
              />
            )}
            
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setPlayingVideo(null)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  offlineBanner: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    gap: 8
  },
  offlineText: { color: 'white', fontSize: 12, fontWeight: '600' },
  videoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 20,
    flexDirection: 'row', // Align thumbnail and text horizontally
    overflow: 'hidden',    // Ensures thumbnail corners follow border radius
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  videoDate: { 
    fontSize: 11, 
    fontWeight: '600',
    color: '#9CA3AF', 
    marginBottom: 2 
  },
  fileName: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#1F2937' 
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#5C6BC0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  videoContainer: {
    height: '90%',
    backgroundColor: '#000',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: 'hidden',
    alignItems: 'center',
  },
  swipeHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#666',
    borderRadius: 3,
    marginTop: 12,
    marginBottom: 20,
  },
  fullVideo: {
    width: '100%',
    flex: 1,
  },
  closeButton: {
    padding: 20,
    marginBottom: 20,
  },
  closeText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  thumbnail: {
    width: 100,
    height: 80,
    backgroundColor: '#E5E7EB', // Placeholder color while loading
  },
  cardRightArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
});
