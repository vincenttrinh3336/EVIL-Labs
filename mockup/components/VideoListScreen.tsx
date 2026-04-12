import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Modal,
  Animated,
  PanResponder,
  Image,
  Alert
} from 'react-native';
import RNFS from 'react-native-fs';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import Video from 'react-native-video';
import { ArrowLeft, Download, WifiOff, PlayCircle, Trash2, Save } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import * as MediaLibrary from 'expo-media-library';
import { RPI_URL } from "../constants";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Video row component
const VideoItem = ({ item, progress, onPlay, onDownload, onDelete, onSaveGallery }) => {
  const isDownloaded = progress === 100;
  const thumbnailUri = `${RPI_URL}/videos/${item.file_name.replace('.mp4', '.jpg')}`;

  const renderRightActions = () => (
    <View style={styles.swipeActionContainer}>
      <TouchableOpacity 
        style={[styles.swipeButton, styles.saveButton]} 
        onPress={() => onSaveGallery(item.file_name)}
      >
        <Save size={20} color="white" />
        <Text style={styles.swipeButtonText}>Save</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.swipeButton, styles.deleteButton]} 
        onPress={() => onDelete(item.file_name)}
      >
        <Trash2 size={20} color="white" />
        <Text style={styles.swipeButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} friction={2}>
      <View style={styles.videoCard}>
        <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} resizeMode="cover" />
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
            size={42} width={3} fill={progress}
            tintColor="#5C6BC0" backgroundColor="#E5E7EB"
          >
            {(fill) => (
              <TouchableOpacity 
                onPress={() => isDownloaded ? onPlay(item.file_name) : onDownload(item.file_name)}
                style={styles.downloadButton}
              >
                {isDownloaded ? <PlayCircle size={22} color="#5C6BC0" /> 
                : progress > 0 ? <Text style={styles.progressText}>{Math.round(fill)}%</Text> 
                : <Download size={20} color="#9CA3AF" />}
              </TouchableOpacity>
            )}
          </AnimatedCircularProgress>
        </View>
      </View>
    </Swipeable>
  );
};

// Main screen
export function VideoListScreen({ onNavigate }) {
  const insets = useSafeAreaInsets();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [downloadingItems, setDownloadingItems] = useState({});
  const [playingVideo, setPlayingVideo] = useState(null);
  const translateY = useRef(new Animated.Value(0)).current;

  // Fetch & Auto-Cleanup
  const fetchVideoList = useCallback(async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`${RPI_URL}/list-videos`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        let data = await response.json();
        const statusMap = {};
        const now = Date.now() / 1000;
        const threeDaysInSecs = 3 * 24 * 60 * 60;

        // Filter and check local status
        const filteredVideos = [];
        for (const video of data) {
          const localPath = `${RNFS.DocumentDirectoryPath}/${video.file_name}`;
          const exists = await RNFS.exists(localPath);
          
          // Auto-delete logic: If older than 3 days and not downloaded, skip it
          if (!exists && (now - video.timestamp) > threeDaysInSecs) continue;
          
          if (exists) statusMap[video.file_name] = 100;
          filteredVideos.push(video);
        }

        setVideos(filteredVideos);
        setDownloadingItems(statusMap);
        setIsOffline(false);
      } else { setIsOffline(true); }
    } catch (err) { setIsOffline(true); } 
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVideoList(); }, [fetchVideoList]);

  // Save to Gallery Action
  const handleSaveToGallery = async (fileName) => {
    const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    const exists = await RNFS.exists(localPath);
    
    if (!exists) {
      Alert.alert("Not Downloaded", "Please download the video to the app first.");
      return;
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === 'granted') {
      try {
        await MediaLibrary.saveToLibraryAsync(`file://${localPath}`);
        Alert.alert("Saved!", "Video is now in your photo gallery.");
      } catch (e) { Alert.alert("Error", "Could not export to gallery."); }
    }
  };

  // Delete Action (App + Pi)
  const handleDelete = (fileName) => {
    Alert.alert("Delete Video", "Remove from app and Raspberry Pi?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          try {
            // Delete from Pi
            await fetch(`${RPI_URL}/delete-video/${fileName}`, { method: 'DELETE' });
            // Delete Local
            const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
            if (await RNFS.exists(localPath)) await RNFS.unlink(localPath);
            // Update UI
            setVideos(prev => prev.filter(v => v.file_name !== fileName));
          } catch (e) { Alert.alert("Error", "Could not delete video."); }
      }}
    ]);
  };

  const handleDownload = async (fileName) => {
    const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    const url = `${RPI_URL}/videos/${fileName}`;
    try {
      await RNFS.downloadFile({
        fromUrl: url, toFile: localPath,
        progress: (res) => {
          setDownloadingItems(prev => ({ ...prev, [fileName]: (res.bytesWritten / res.contentLength) * 100 }));
        },
        progressDivider: 1,
      }).promise;
      setDownloadingItems(prev => ({ ...prev, [fileName]: 100 }));
    } catch (error) { console.error(error); }
  };

  // Existing PanResponder logic...
  const videoPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
      onPanResponderMove: (_, gesture) => gesture.dy > 0 && translateY.setValue(gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 150) {
          Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }).start(() => {
            setPlayingVideo(null);
            translateY.setValue(0);
          });
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => onNavigate("home")}><ArrowLeft color="#111827" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Recorded Clips</Text>
          <View style={{ width: 24 }} />
        </View>

        {isOffline && (
          <View style={styles.offlineBanner}>
            <WifiOff size={16} color="white" /><Text style={styles.offlineText}>Cannot connect to feeder</Text>
          </View>
        )}

        <FlatList
          data={videos}
          keyExtractor={(item) => item.file_name}
          renderItem={({ item }) => (
            <VideoItem 
              item={item} 
              progress={downloadingItems[item.file_name] || 0}
              onPlay={(fn) => setPlayingVideo(`file://${RNFS.DocumentDirectoryPath}/${fn}`)}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onSaveGallery={handleSaveToGallery}
            />
          )}
          onRefresh={fetchVideoList}
          refreshing={loading}
        />

        <Modal visible={!!playingVideo} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animated.View {...videoPanResponder.panHandlers} style={[styles.videoContainer, { transform: [{ translateY }] }]}>
              <View style={styles.swipeHandle} />
              {playingVideo && <Video source={{ uri: playingVideo }} style={styles.fullVideo} controls resizeMode="contain" />}
              <TouchableOpacity style={styles.closeButton} onPress={() => setPlayingVideo(null)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  offlineBanner: { backgroundColor: '#EF4444', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 8, gap: 8 },
  offlineText: { color: 'white', fontSize: 12, fontWeight: '600' },
  videoCard: {
    backgroundColor: '#FFF', borderRadius: 16, marginBottom: 12, marginHorizontal: 20,
    flexDirection: 'row', overflow: 'hidden', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  thumbnail: { width: 100, height: 80, backgroundColor: '#E5E7EB' },
  cardRightArea: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, justifyContent: 'space-between' },
  textContainer: { flex: 1, marginRight: 8 },
  videoDate: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', marginBottom: 2 },
  fileName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  downloadButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  progressText: { fontSize: 9, fontWeight: 'bold', color: '#5C6BC0' },
  // SWIPE STYLES
  swipeActionContainer: { flexDirection: 'row', marginBottom: 12, marginRight: 20 },
  swipeButton: { justifyContent: 'center', alignItems: 'center', width: 70, borderRadius: 12, marginLeft: 8 },
  saveButton: { backgroundColor: '#10B981' },
  deleteButton: { backgroundColor: '#EF4444' },
  swipeButtonText: { color: 'white', fontSize: 10, fontWeight: '700', marginTop: 4 },
  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  videoContainer: { height: '90%', backgroundColor: '#000', borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden', alignItems: 'center' },
  swipeHandle: { width: 40, height: 5, backgroundColor: '#666', borderRadius: 3, marginTop: 12, marginBottom: 20 },
  fullVideo: { width: '100%', flex: 1 },
  closeButton: { padding: 20, marginBottom: 20 },
  closeText: { color: '#FFF', fontWeight: 'bold' },
});