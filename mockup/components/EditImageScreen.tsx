import React, { useState, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Animated, PanResponder } from 'react-native';
import { RotateCcw, RotateCw, Undo, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TARGET_WIDTH = SCREEN_WIDTH * 0.9;
const TARGET_HEIGHT = 200;

export function EditImageScreen({ route, onNavigate }) {
  const insets = useSafeAreaInsets();
  const initialUri = route.params?.uri;
  
  const [rotation, setRotation] = useState(0);
  
  // Translation (Movement) State
  const pan = useRef(new Animated.ValueXY()).current;
  // Scale (Zoom) State
  const scale = useRef(new Animated.Value(1)).current;

  // 1. Gesture Handling for Moving the Image
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const rotateClockwise = () => setRotation(prev => prev + 90);
  const rotateCounter = () => setRotation(prev => prev - 90);
  
  const resetImage = () => {
    setRotation(0);
    pan.setValue({ x: 0, y: 0 });
    scale.setValue(1);
  };

  // 2. The Cropping Logic
  const handleCropAndSave = async () => {
    try {
      // 1. Get the actual pixel dimensions of the source image
      const { width: realWidth, height: realHeight } = await new Promise((resolve, reject) => {
        Image.getSize(
          initialUri, 
          (w, h) => resolve({ width: w, height: h }),
          (err) => reject(err)
        );
      });

      // 2. Account for rotation: if rotated 90 or 270 degrees, width and height swap
      const isVerticalRotation = (rotation / 90) % 2 !== 0;
      const actualW = isVerticalRotation ? realHeight : realWidth;
      const actualH = isVerticalRotation ? realWidth : realHeight;

      // 3. Define a safe crop area (e.g., center 80% of the image)
      // This ensures we never exceed the "Invalid crop" boundary
      const cropWidth = Math.floor(actualW * 0.8);
      const cropHeight = Math.floor(actualH * 0.5); // Keeping it shorter for the "Live Card" look
      
      const originX = Math.floor((actualW - cropWidth) / 2);
      const originY = Math.floor((actualH - cropHeight) / 2);

      const result = await ImageManipulator.manipulateAsync(
        initialUri,
        [
          { rotate: rotation },
          { 
            crop: { 
              originX, 
              originY, 
              width: cropWidth, 
              height: cropHeight 
            } 
          }
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      onNavigate(`home?updatedImage=${encodeURIComponent(result.uri)}`);
    } catch (e) {
      console.error("Crop failed", e);
      // Fallback: navigate back with the original image if manipulation fails
      onNavigate(`home?updatedImage=${encodeURIComponent(initialUri)}`);
    }
  };

  return (
    <View style={[styles.editContainer, { paddingTop: insets.top }]}>
      <View style={styles.editHeader}>
        <TouchableOpacity onPress={() => onNavigate("home")}>
          <X color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.editText}>Adjust Photo</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.cropperArea}>
        {/* The Image is moved via the PanResponder */}
        <Animated.View 
          {...panResponder.panHandlers}
          style={{ 
            transform: [
              { translateX: pan.x }, 
              { translateY: pan.y }, 
              { rotate: `${rotation}deg` }, 
              { scale: scale }
            ] 
          }}
        >
          <Image source={{ uri: initialUri }} style={styles.imageToEdit} resizeMode="contain" />
        </Animated.View>
        
        {/* PointerEvents="none" allows gestures to pass THROUGH the overlay to the image */}
        <View style={styles.cropOverlay} pointerEvents="none">
          <View style={styles.targetFrame} />
        </View>
      </View>

      <View style={[styles.editFooter, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.zoomContainer}>
          <Text style={styles.zoomText}>Zoom</Text>
          {/* Simple zoom control since Pinch is complex to build from scratch */}
          <TouchableOpacity onPress={() => scale.setValue(scale._value + 0.1)} style={styles.zoomBtn}>
            <Text style={{color: 'white'}}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scale.setValue(Math.max(0.5, scale._value - 0.1))} style={styles.zoomBtn}>
            <Text style={{color: 'white'}}>-</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toolRow}>
          <TouchableOpacity onPress={rotateCounter} style={styles.iconBtn}><RotateCcw color="white" size={24} /></TouchableOpacity>
          <TouchableOpacity onPress={resetImage} style={styles.iconBtn}><Undo color="white" size={24} /></TouchableOpacity>
          <TouchableOpacity onPress={rotateClockwise} style={styles.iconBtn}><RotateCw color="white" size={24} /></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.chooseBtn} onPress={handleCropAndSave}>
          <Text style={styles.chooseText}>Choose</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editContainer: { flex: 1, backgroundColor: '#000' },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  editText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cropperArea: { flex: 1, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  imageToEdit: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.5 },
  cropOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  targetFrame: {
    width: TARGET_WIDTH,
    height: TARGET_HEIGHT,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
  },
  editFooter: { paddingHorizontal: 20, paddingTop: 20, backgroundColor: '#111' },
  zoomContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  zoomText: { color: 'white', marginRight: 15 },
  zoomBtn: { backgroundColor: '#333', padding: 10, borderRadius: 5, marginHorizontal: 5, width: 40, alignItems: 'center' },
  toolRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 },
  iconBtn: { padding: 10 },
  chooseBtn: { backgroundColor: '#5C6BC0', paddingVertical: 14, borderRadius: 100, alignItems: 'center' },
  chooseText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});