#!/usr/bin/env python3

# General dependencies for pet feeder script
from gpiozero import DistanceSensor, Servo, MotionSensor
from time import sleep, time
from datetime import datetime, timedelta
from signal import pause
from threading import Thread, Lock

# Dependencies for receival of schedule updates (FastAPI, sqlite3)
import sqlite3
from fastapi import FastAPI, HTTPException  # pip install fastapi uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import uvicorn


# Dependencies for notifications using Firebase
import os
import firebase_admin   # pip install firebase-admin
from firebase_admin import credentials, messaging

# Setting up necessary directory and file paths
base_dir = os.path.dirname(os.path.abspath(__file__))

video_folder = os.path.join(base_dir, "captured_videos")
# Create the folder immediately if it doesn't exist
if not os.path.exists(video_folder):
    os.makedirs(video_folder)

key_path = os.path.join(base_dir, "serviceAccountKey.json")


# Dependencies for computer vision functionality
"""
Raspberry Pi Pet Detection Module
Real-time cat and dog detection using TFLite and Pi Camera
"""
import time
import numpy as np
import cv2
import json
import argparse
from pathlib import Path
from typing import List, Tuple, Optional
from dataclasses import dataclass, asdict
from collections import deque

# Initializations for FastAPI and DB
app = FastAPI()
DB_PATH = "feeder_schedule.db"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all devices (your phone) to connect
    allow_credentials=True,
    allow_methods=["*"], # Allows GET, POST, etc.
    allow_headers=["*"], # Allows all headers
)

try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    import tensorflow.lite as tflite

try:
    from picamera2 import Picamera2
except ImportError:
    Picamera2 = None

# GLOBAL Declarations and Initializations
detector = None
args = None

feeding_times = []
lowfood = False # True if food level is low, else False
vision_active = False   # True if CV model should be running (depends on cam_state)
vision_stop_time = 0
lock = Lock()
cam_state = True
last_dispense_time = ""
servo_angle = -240

servo = None
sensor = None
pir = None

# This function will be called by main() once to safely set up hardware
def initialize_hardware():
    global servo, sensor, pir
    try:
        if servo is None:
            servo = Servo(27)
            servo.value = 0.2
        if sensor is None:
            sensor = DistanceSensor(echo=24, trigger=23)
        if pir is None:
            pir = MotionSensor(17)
            pir.when_motion = onMotion
        print("Hardware initialized successfully.")
    except Exception as e:
        print(f"Hardware already initialized or Error: {e}")

# Initializations for notifications
cred = credentials.Certificate(key_path)    # Get json from firebase console


@dataclass
class Detection:
    """Detection result container"""
    class_id: int
    class_name: str
    confidence: float
    bbox: Tuple[int, int, int, int]  # (x1, y1, x2, y2)


@dataclass
class RPiPerformanceMetrics:
    """Performance metrics for Raspberry Pi inference."""
    preprocess_ms: float
    inference_ms: float
    postprocess_ms: float
    total_ms: float
    fps: float
    frame_count: int

class PetDetector:
    """TFLite-based pet detector for Raspberry Pi"""
    
    def __init__(self, model_path: str, conf_threshold: float = 0.5, enable_metrics: bool = False, classes_file: Optional[str] = None):
        """
        Initialize TFLite interpreter and load model
        
        Args:
            model_path: Path to TFLite model file
            conf_threshold: Confidence threshold for detections (0.0-1.0)
            enable_metrics: Enable detailed performance metrics tracking
            classes_file: Optional path to classes.txt file (defaults to same directory as model)
        """
        self.conf_threshold = conf_threshold
        self.enable_metrics = enable_metrics
        
        # Load class names from file
        if classes_file is None:
            classes_file = Path(model_path).parent / 'classes.txt'
        
        if Path(classes_file).exists():
            with open(classes_file, 'r') as f:
                self.class_names = [line.strip() for line in f.readlines()]
            print(f"Loaded {len(self.class_names)} classes from {classes_file}")
        else:
            print(f"Warning: classes.txt not found at {classes_file}. Using default classes.")
            self.class_names = ['cat', 'dog']
        
        # Performance tracking
        if enable_metrics:
            self.preprocess_times = deque(maxlen=100)
            self.inference_times = deque(maxlen=100)
            self.postprocess_times = deque(maxlen=100)
            self.total_times = deque(maxlen=100)
        
        # Initialize TFLite interpreter
        try:
            self.interpreter = tflite.Interpreter(model_path=model_path)
            self.interpreter.allocate_tensors()
        except Exception as e:
            raise RuntimeError(f"Failed to load TFLite model from {model_path}: {e}")
        
        # Get input and output tensor details
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        
        # Extract input shape
        input_shape = self.input_details[0]['shape']
        self.input_height = input_shape[1]
        self.input_width = input_shape[2]
        self.input_dtype = self.input_details[0]['dtype']

        # Check if model is quantized (INT8 or UINT8)
        self.is_quantized = self.input_dtype in (np.int8, np.uint8)
        
        print(f"Model loaded successfully")
        print(f"Input size: {self.input_width}x{self.input_height}")
        print(f"Confidence threshold: {self.conf_threshold}")
        if enable_metrics:
            print(f"Performance metrics: ENABLED")

    def preprocess(self, frame: np.ndarray) -> np.ndarray:
        # Resize to model input size
        resized = cv2.resize(frame, (self.input_width, self.input_height), interpolation=cv2.INTER_LINEAR)
        
        # Convert BGR to RGB
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        
        # Handle quantized vs float models
        if self.is_quantized:
            if self.input_dtype == np.int8:
                # INT8 quantized model expects int8 input [-128, 127]
                # Convert to float, shift by 128, then cast to int8
                input_data = np.expand_dims((rgb.astype(np.float32) - 128).astype(np.int8), axis=0)
            else:
                # UINT8 quantized model expects uint8 input [0, 255]
                input_data = np.expand_dims(rgb.astype(np.uint8), axis=0)
        else:
            # Float model expects normalized float32 input [0.0, 1.0]
            normalized = rgb.astype(np.float32) / 255.0
            input_data = np.expand_dims(normalized, axis=0)
    
        return input_data

    def detect(self, frame: np.ndarray) -> List[Detection]:
        """
        Run detection on a frame
        
        Args:
            frame: Input frame (BGR format)
            
        Returns:
            List of Detection objects
        """
        frame_start = time.time()
        
        # Preprocess frame
        preprocess_start = time.time()
        input_data = self.preprocess(frame)
        preprocess_time = (time.time() - preprocess_start) * 1000
        
        # Set input tensor
        self.interpreter.set_tensor(self.input_details[0]['index'], input_data)
        
        # Run inference
        inference_start = time.time()
        self.interpreter.invoke()
        inference_time = (time.time() - inference_start) * 1000
        
        # Get output tensor
        output_data = self.interpreter.get_tensor(self.output_details[0]['index'])

        # Dequantize output if model is quantized
        if self.is_quantized:
            output_scale = self.output_details[0]['quantization_parameters']['scales'][0]
            output_zero_point = self.output_details[0]['quantization_parameters']['zero_points'][0]
            output_data = (output_data.astype(np.float32) - output_zero_point) * output_scale
        
        # Postprocess results
        postprocess_start = time.time()
        detections = self.postprocess(output_data, frame.shape)
        postprocess_time = (time.time() - postprocess_start) * 1000
        
        # Track metrics
        if self.enable_metrics:
            total_time = (time.time() - frame_start) * 1000
            self.preprocess_times.append(preprocess_time)
            self.inference_times.append(inference_time)
            self.postprocess_times.append(postprocess_time)
            self.total_times.append(total_time)
        
        return detections
    
    def postprocess(self, output: np.ndarray, frame_shape: Tuple[int, int, int]) -> List[Detection]:
        """
        Postprocess model output to extract detections
        
        Args:
            output: Raw model output
            frame_shape: Original frame shape (height, width, channels)
            
        Returns:
            List of Detection objects after NMS and filtering
        """
        detections = []
        frame_height, frame_width = frame_shape[:2]
        
        # YOLOv8 output format: [batch, num_predictions, 6]
        # Each prediction: [x_center, y_center, width, height, confidence, class_id]
        # Or transposed format: [batch, 6, num_predictions]
        
        # Handle different output shapes
        if len(output.shape) == 3:
            if output.shape[1] > output.shape[2]:
                # Transpose if needed: [batch, num_predictions, features]
                predictions = output[0]
            else:
                # Format: [batch, features, num_predictions]
                predictions = output[0].T
        else:
            predictions = output
        
        # Extract boxes, scores, and class IDs
        boxes = []
        scores = []
        class_ids = []
        
        for pred in predictions:
            # YOLOv8 format varies, handle common cases
            if len(pred) >= 6:
                # Format: [x, y, w, h, conf, class_scores...]
                x_center, y_center, width, height = pred[:4]
                confidence = pred[4]
                
                # Get class with highest score
                if len(pred) > 6:
                    class_scores = pred[5:]
                    class_id = np.argmax(class_scores)
                    class_conf = class_scores[class_id]
                    final_conf = confidence * class_conf
                else:
                    class_id = int(pred[5]) if len(pred) > 5 else 0
                    final_conf = confidence
                
                # Filter by confidence threshold
                if final_conf >= self.conf_threshold:
                    # Convert from normalized to pixel coordinates
                    x_center_px = x_center * frame_width
                    y_center_px = y_center * frame_height
                    width_px = width * frame_width
                    height_px = height * frame_height
                    
                    # Convert to corner format (x1, y1, x2, y2)
                    x1 = int(x_center_px - width_px / 2)
                    y1 = int(y_center_px - height_px / 2)
                    x2 = int(x_center_px + width_px / 2)
                    y2 = int(y_center_px + height_px / 2)
                    
                    # Clip to frame boundaries
                    x1 = max(0, min(x1, frame_width))
                    y1 = max(0, min(y1, frame_height))
                    x2 = max(0, min(x2, frame_width))
                    y2 = max(0, min(y2, frame_height))
                    
                    boxes.append([x1, y1, x2, y2])
                    scores.append(float(final_conf))
                    class_ids.append(int(class_id))
        
        # Apply Non-Maximum Suppression
        if len(boxes) > 0:
            indices = self._nms(boxes, scores, iou_threshold=0.45)
            
            for idx in indices:
                class_id = class_ids[idx]
                class_name = self.class_names[class_id] if class_id < len(self.class_names) else f"class_{class_id}"
                
                detections.append(Detection(
                    class_id=class_id,
                    class_name=class_name,
                    confidence=scores[idx],
                    bbox=tuple(boxes[idx])
                ))
        
        return detections
    
    def _nms(self, boxes: List[List[int]], scores: List[float], iou_threshold: float = 0.45) -> List[int]:
        """
        Non-Maximum Suppression to filter overlapping boxes
        
        Args:
            boxes: List of bounding boxes [x1, y1, x2, y2]
            scores: Confidence scores for each box
            iou_threshold: IoU threshold for suppression
            
        Returns:
            Indices of boxes to keep
        """
        if len(boxes) == 0:
            return []
        
        boxes = np.array(boxes)
        scores = np.array(scores)
        
        x1 = boxes[:, 0]
        y1 = boxes[:, 1]
        x2 = boxes[:, 2]
        y2 = boxes[:, 3]
        
        areas = (x2 - x1 + 1) * (y2 - y1 + 1)
        order = scores.argsort()[::-1]
        
        keep = []
        while order.size > 0:
            i = order[0]
            keep.append(i)
            
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])
            
            w = np.maximum(0.0, xx2 - xx1 + 1)
            h = np.maximum(0.0, yy2 - yy1 + 1)
            inter = w * h
            
            iou = inter / (areas[i] + areas[order[1:]] - inter)
            
            inds = np.where(iou <= iou_threshold)[0]
            order = order[inds + 1]
        
        return keep

    def draw_detections(self, frame: np.ndarray, detections: List[Detection]) -> np.ndarray:
        """
        Draw bounding boxes and labels on frame
        
        Args:
            frame: Input frame
            detections: List of Detection objects
            
        Returns:
            Frame with drawn detections
        """
        for det in detections:
            x1, y1, x2, y2 = det.bbox
            
            # Choose color based on class (use hash for consistent colors)
            color_idx = hash(det.class_name) % 10
            colors = [
                (0, 255, 0), (255, 0, 0), (0, 0, 255), (255, 255, 0), (255, 0, 255),
                (0, 255, 255), (128, 0, 255), (255, 128, 0), (0, 128, 255), (128, 255, 0)
            ]
            color = colors[color_idx]
            
            # Draw bounding box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Create label with class name and confidence
            label = f"{det.class_name}: {det.confidence:.2f}"
            
            # Get label size for background
            (label_width, label_height), baseline = cv2.getTextSize(
                label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1
            )
            
            # Draw label background
            cv2.rectangle(
                frame,
                (x1, y1 - label_height - baseline - 5),
                (x1 + label_width, y1),
                color,
                -1
            )
            
            # Draw label text
            cv2.putText(
                frame,
                label,
                (x1, y1 - baseline - 5),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (255, 255, 255),
                1
            )
        
        return frame


    def get_performance_metrics(self) -> Optional[RPiPerformanceMetrics]:
        """
        Get current performance metrics.
        
        Returns:
            RPiPerformanceMetrics or None if metrics not enabled
        """
        if not self.enable_metrics or not self.total_times:
            return None
        
        avg_preprocess = np.mean(self.preprocess_times)
        avg_inference = np.mean(self.inference_times)
        avg_postprocess = np.mean(self.postprocess_times)
        avg_total = np.mean(self.total_times)
        fps = 1000.0 / avg_total if avg_total > 0 else 0.0
        
        return RPiPerformanceMetrics(
            preprocess_ms=avg_preprocess,
            inference_ms=avg_inference,
            postprocess_ms=avg_postprocess,
            total_ms=avg_total,
            fps=fps,
            frame_count=len(self.total_times)
        )
    
    def print_performance_summary(self):
        """Print performance metrics summary."""
        metrics = self.get_performance_metrics()
        if not metrics:
            print("Performance metrics not enabled")
            return
        
        print(f"\n{'='*60}")
        print("RASPBERRY PI PERFORMANCE SUMMARY")
        print(f"{'='*60}")
        print(f"Frames processed: {metrics.frame_count}")
        print(f"Average FPS: {metrics.fps:.2f}")
        print(f"\nLatency Breakdown:")
        print(f"  Preprocessing:  {metrics.preprocess_ms:6.2f} ms ({metrics.preprocess_ms/metrics.total_ms*100:5.1f}%)")
        print(f"  Inference:      {metrics.inference_ms:6.2f} ms ({metrics.inference_ms/metrics.total_ms*100:5.1f}%)")
        print(f"  Postprocessing: {metrics.postprocess_ms:6.2f} ms ({metrics.postprocess_ms/metrics.total_ms*100:5.1f}%)")
        print(f"  Total:          {metrics.total_ms:6.2f} ms")
        print(f"{'='*60}")
    
    def save_performance_metrics(self, output_path: str):
        """
        Save performance metrics to JSON file.
        
        Args:
            output_path: Path to save metrics JSON
        """
        metrics = self.get_performance_metrics()
        if not metrics:
            print("Performance metrics not enabled")
            return
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(asdict(metrics), f, indent=2)
        
        print(f"\nMetrics saved to: {output_path}")


def levelCheck():
    global lowfood

    print("Checking food level...")

    # Get the distance in meters and convert to centimeters
    distance_cm = sensor.distance * 100
    print('Distance: {:.2f} cm'.format(distance_cm))

    if distance_cm > 6:
        if not lowfood: # Only notify once when it FIRST goes low
            send_push_notification(
                title="Feeder Alert! ⚠️",
                body="Food level is low. Please refill the container soon!",
                data_payload={"action": "food_low"} # Tells the app to update food level ui
            )
            update_db_food_status("low")
        lowfood = True
    else:
        if lowfood: # Reset status if you refilled it
            send_push_notification(
                title="Feeder Refilled! ⬆️",
                body="You can safely dispense",
                data_payload={"action": "food_refilled"} # Tells the app to update food level ui
            )
            update_db_food_status("normal")
        lowfood = False


def getSchedule():
    conn = sqlite3.connect("feeder_schedule.db")
    cursor = conn.execute("SELECT time, pet, seconds FROM schedules")
    data = cursor.fetchall()
    conn.close()
    return data # list of tuples, (Time, Pet name, Seconds)


def dispenseFood(time_str, pet, duration):
    global cam_state, servo_angle, servo, sensor
    feed_time = time_str
    pet_name = pet
    wait_time = float(duration) # Convert to float
    print("Dispensing food...")

    # Store original position before moving
    original_value = servo.value

    # Clamp angle to valid range (0-360)
    clamped_angle = max(0, min(360, servo_angle))

    # Convert angle (0–360) to gpiozero range (-1 to 1)
    value = (clamped_angle / 180) - 1  # 0°=-1, 180°=0, 360°=1

    # Move to target angle
    servo.value = value
    sleep(wait_time)

    # Move back to original position
    servo.value = original_value
    sleep(wait_time)

    # Stop sending signal (prevents jitter)
    servo.detach()
    print(f"{feed_time} feeding for {pet_name} dispensed!")    # NOTIFY APP

    # 1. Log to Database
    log_feeding(time_str, pet, duration)

    # 2. Notify App via Firebase
    send_push_notification(
        title="Food Dispensed!",
        body=f"{pet_name} has been fed their {feed_time} meal.",
        data_payload={"action": "refresh_logs"} # Tells the app to update the list
    )

    levelCheck()
    if cam_state:
        activateVision()


def onMotion():
    global lock, cam_state
    print("Motion detected!")
    
    with lock:
        active = vision_active
    
    if not active and cam_state:
        activateVision()


def schedulerLoop():
    global last_dispense_time
    while True:
        now = time.strftime("%H:%M")
        
        if now != last_dispense_time:
            # Freshly fetch the list from the DB in case the app changed something
            schedules = getSchedule()
            for time_str, pet, duration in schedules:
                if time_str == now:
                    dispenseFood(time_str, pet, duration)
                    last_dispense_time = now
        
        time.sleep(10)


# For user to change camera state
class CameraToggle(BaseModel):
    enabled: bool


def activateVision():
    global vision_active, vision_stop_time, lock, cam_state
    
    if cam_state:
        with lock:
            vision_active = True
            vision_stop_time = time.time() + (30 * 60)  # 30 minutes
    
        print("Vision activated for 30 minutes")
    else: print("CV deactivated by user")


# To delete old clips stored on the pi after days_to_keep number of days
def cleanup_old_videos(days_to_keep=3):
    """
    Deletes video files in the video_folder that are older than the specified days.
    """
    print(f"Running video cleanup (keeping last {days_to_keep} days)...")
    
    # Calculate the cutoff time in seconds
    now = time.time()
    cutoff = now - (days_to_keep * 86400) # 86400 seconds in a day

    files_deleted = 0
    
    try:
        # List all files in the video directory
        for filename in os.listdir(video_folder):
            file_path = os.path.join(video_folder, filename)
            
            # Only look at files (not folders) ending in .mp4
            if os.path.isfile(file_path) and filename.endswith(".mp4"):
                file_creation_time = os.path.getmtime(file_path)
                
                if file_creation_time < cutoff:
                    os.remove(file_path)
                    files_deleted += 1
                    print(f"Deleted old video: {filename}")
        
        print(f"Cleanup complete. Removed {files_deleted} files.")
    except Exception as e:
        print(f"Error during video cleanup: {e}")


# To convert cached video clip of pet into a mp4 for transfer
def save_and_send_clip(frames):
    """
    Converts a list of frames into an .mp4 video and notifies the app.
    """
    if not frames:
        return

    # 1. Define the filename and path
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    video_filename = f"pet_clip_{timestamp}.mp4"

    video_path = os.path.join(video_folder, video_filename)

    # 2. Get frame dimensions from the first frame
    height, width, layers = frames[0].shape
    size = (width, height)

    # 3. Initialize VideoWriter 
    # 'avc1' or 'mp4v' are common codecs for .mp4 files
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    playback_fps = 20
    out = cv2.VideoWriter(video_path, fourcc, playback_fps, size) # fps_number = fps calculated in run_detection_loop

    print(f"Stitching {len(frames)} frames into {video_filename}...")
    
    try:
        for frame in frames:
            out.write(frame)
        out.release()
        cv2.imwrite(video_path.replace(".mp4", ".jpg"), frames[0])
        print(f"Video saved successfully at {video_path}")

        # 4. Notify the App via Firebase
        # Note: In a production setup, you would typically upload this file 
        # to cloud storage and send the download URL in the data_payload.
        send_push_notification(
            title="Video Clip Ready! 🎥",
            body="A 10-second clip of your pet has been recorded.", # Update to match clip length
            data_payload={
                "action": "video_available",
                "file_name": video_filename
            }
        )
    except Exception as e:
        print(f"Error saving video: {e}")
    
    # After saving the new one, check if old ones need to go within a new thread
    Thread(target=cleanup_old_videos, args=(3,), daemon=True).start()


# Runs the tflite model based on cam_state and if current_time <= current_stop_limit
def run_detection_loop(camera, detector, args, stop_time):
    global vision_stop_time, lock, cam_state
    # Initialize local loop variables
    fps_counter = 0
    fps_start_time = time.time()
    fps = 9.0
    low_fps_warning_shown = False
    no_detection_count = 0
    no_detection_warning_interval = 100

    # Initialize buffers
    # Loop usually runs at 1.6 fps. 30 frame buffer = 20 seconds of real time video
    video_cache = deque(maxlen=160) # Change maxlen based on framerate
    detection_timestamps = deque()

    last_notification_time = 0  # Keeps track of the time of the last "Pet spotted" notif

    print("\nStarting detection loop...")
    print("Press Ctrl+C to stop")
    if args.metrics:
        print(f"Performance metrics will be printed every {args.print_metrics_interval} frames\n")

    try:
        while True:
            # Check if we should still be running
            current_time = time.time()

            # We check the GLOBAL stop_time in case activateVision() updated it
            with lock:
                current_stop_limit = vision_stop_time
                current_cam_state = cam_state

            if current_time > current_stop_limit:
                print("30 minutes elapsed. Closing detection loop...")
                break # This exits the function and returns to visionLoop's 'finally' block

            if current_cam_state == False:
                print("CV deactivated by user. Closing detection loop...")
                break # This exits the function and returns to visionLoop's 'finally' block

            # Capture frame
            frame = camera.capture_array()
            frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            
            # Cache the current frame
            video_cache.append(frame.copy())

            # Run detection
            detections = detector.detect(frame_bgr)
            
            if len(detections) > 0:
                current_t = time.time()
                detection_timestamps.append(current_t)
                
                # 2. Clean up old timestamps (older than 10s)
                while detection_timestamps and detection_timestamps[0] < current_t - 30:
                    detection_timestamps.popleft()
                
                # 3. Check the trigger condition
                if len(detection_timestamps) >= 4 and len(video_cache) > 30:
                    print("Pet detected! Recording 8 more seconds of footage...")
                    # Record for 5 more seconds (roughly 8 more frames at 1.6 FPS)
                    for _ in range(13):
                        frame = camera.capture_array()
                        video_cache.append(frame.copy())
                        sleep(0.5) # Small delay to match your processing speed

                    print("Saving full clip.")
                    save_and_send_clip(list(video_cache)) # Function to stitch and send
                    
                    with lock:
                        cam_state = False # Stop the model/loop
                    break

            # Track no detections
            if len(detections) == 0:
                no_detection_count += 1
            else:
                no_detection_count = 0
            
            # Draw detections
            frame_bgr = detector.draw_detections(frame_bgr, detections)
            
            # Update FPS
            fps_counter += 1
            if fps_counter >= 10:
                fps_end_time = time.time()
                fps = fps_counter / (fps_end_time - fps_start_time)
                fps_counter = 0
                fps_start_time = time.time()
                
                if fps < 5.0 and not low_fps_warning_shown:
                    print(f"\n⚠️  WARNING: Low FPS detected ({fps:.1f} FPS)")
                    low_fps_warning_shown = True
            
            # Print metrics periodically
            if args.metrics and fps_counter == 0:
                metrics = detector.get_performance_metrics()
                if metrics and metrics.frame_count % args.print_metrics_interval == 0:
                    print(f"[Metrics] FPS: {metrics.fps:.2f}, Latency: {metrics.total_ms:.2f}ms")

            # Draw UI elements
            cv2.putText(frame_bgr, f"FPS: {fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(frame_bgr, f"Detections: {len(detections)}", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            if args.display:
                cv2.imshow('Pet Detection', frame_bgr)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break
            
            if len(detections) > 0:
                print(f"[FPS: {fps:.1f}] Detected {len(detections)} pet(s):")
                # Check if 10 minutes (600 seconds) have passed since the last alert
                current_time = time.time()
                if current_time - last_notification_time > 600: 
                    # 2. Notify App via Firebase
                    send_push_notification(
                        title="Pet spotted!",
                        body=f"A pet has been detected by the camera",
                        data_payload={"action": "pet_detected"} # Optional: trigger a sound or a specific UI pop-up
                    )
                    last_notification_time = current_time # Update the tracker
        
                for det in detections:
                    print(f"  - {det.class_name} ({det.confidence:.2f})")

    except KeyboardInterrupt:
        print("\n\nShutting down gracefully...")


# Runs in a thread - sets up camera and calls run_detection_loop based on vision_active and cam_state
def visionLoop(detector, args):
    global vision_active, vision_stop_time, lock, cam_state

    while True:
        with lock:
            active = vision_active
            stop_time = vision_stop_time
            cam = cam_state

        if active and cam:
            print(f"Vision Active. Target stop time: {time.ctime(stop_time)}")
            try:
                # 1. SETUP: Start camera ONLY when needed
                camera = Picamera2()
                config = camera.create_preview_configuration(
                    main={"size": (640, 480), "format": "BGR888"}
                )
                camera.configure(config)

                # Set camera controls for better performance
                camera.set_controls({
                    "ExposureTime": 60000,  # 60ms exposure
                    "AnalogueGain": 12.0,
                    "ExposureValue": 2.0,
                    "AeEnable": True,  # Auto exposure
                    "AwbEnable": True,  # Auto white balance
                })

                camera.start()
                sleep(2) # Warm up
                print("Camera initialized successfully")
                
                # 2. RUN: Call your detection function
                run_detection_loop(camera, detector, args, stop_time)
                
            except Exception as e:
                print(f"Vision Loop Error: {e}")
            
            finally:
                # 3. CLEANUP: Shut down camera so it's ready for next time
                print("Deactivating Vision... Cleaning up resources.")
                camera.stop()
                cv2.destroyAllWindows()
                with lock:
                    vision_active = False
                print("Vision deactivated")

        time.sleep(1) # Poll every second to save CPU


# Define the structure for the React Native app to send a feeding schedule instance
class ScheduleEntry(BaseModel):
    time_of_day: str  # e.g., "14:30"
    pet_name: str
    seconds: int

# Database where feeedings, logs, and variable statuses are stored
def init_db():
    global DB_PATH
    conn = sqlite3.connect(DB_PATH)
    conn.execute('''CREATE TABLE IF NOT EXISTS schedules 
                    (id INTEGER PRIMARY KEY, time TEXT, pet TEXT, seconds INTEGER)''')
    conn.execute('CREATE TABLE IF NOT EXISTS status (key TEXT PRIMARY KEY, value TEXT)')
    conn.execute('INSERT OR IGNORE INTO status (key, value) VALUES ("food_level", "normal")')
    conn.execute('''CREATE TABLE IF NOT EXISTS feeding_log 
                    (id INTEGER PRIMARY KEY AUTOINCREMENT, 
                     actual_timestamp DATETIME, 
                     scheduled_time TEXT, 
                     pet_name TEXT, 
                     duration INTEGER)''')
    conn.commit()
    conn.close()

# Change food level status depending on result of levelCheck()
def update_db_food_status(status):
    conn = sqlite3.connect(DB_PATH)
    conn.execute('UPDATE status SET value = ? WHERE key = "food_level"', (status,))
    conn.commit()
    conn.close()


# Log feeding instance into database
def log_feeding(time_str, pet, duration):
    conn = sqlite3.connect(DB_PATH)
    # Log the exact moment it happened + the scheduled info
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute("INSERT INTO feeding_log (actual_timestamp, scheduled_time, pet_name, duration) VALUES (?, ?, ?, ?)",
                 (now, time_str, pet, duration))
    
    # Optional: Auto-delete logs older than 7 days to keep the DB clean
    seven_days_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d %H:%M:%S")
    conn.execute("DELETE FROM feeding_log WHERE actual_timestamp < ?", (seven_days_ago,))
    
    conn.commit()
    conn.close()


# Update cam_state to match database value upon startup
def load_settings():
    global cam_state
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute('SELECT value FROM status WHERE key = "camera_enabled"')
    row = cursor.fetchone()
    if row:
        cam_state = (row[0] == 'True') # Convert string back to boolean
    conn.close()


@app.post("/add-schedule")  # Check if app is initialized in proper scope
async def add_schedule(entry: ScheduleEntry):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("INSERT INTO schedules (time, pet, seconds) VALUES (?, ?, ?)",
                 (entry.time_of_day, entry.pet_name, entry.seconds))
    conn.commit()
    conn.close()
    return {"status": "success"}


# To delete a schedule tuple from the database
@app.delete("/delete-schedule/{id}")
async def delete_schedule(id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM schedules WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return {"status": "success"}


# To get feeding schedule from the database
@app.get("/get-schedules")
async def get_schedules():
    conn = sqlite3.connect(DB_PATH)
    # Added 'id' to the selection
    cursor = conn.execute("SELECT id, time, pet, seconds FROM schedules")
    rows = cursor.fetchall() 
    conn.close()
    return rows # Format: [id, time, pet, seconds]


# To get the food_level from the database
@app.get("/get-food-level")
async def get_food_level():
    conn = sqlite3.connect(DB_PATH)
    # Using row_factory can make this even cleaner, but keeping your current style:
    cursor = conn.execute('SELECT value FROM status WHERE key = "food_level"')
    row = cursor.fetchone()
    conn.close()
    
    # Return a simple dictionary so the app can easily destructure it
    return {"status": row[0] if row else "normal"}


# To change cam_state based on user update
@app.post("/set-camera")
async def set_camera(status: CameraToggle):
    global cam_state
    
    # 1. Update the variable with the lock to ensure the vision loop sees it
    with lock:
        cam_state = status.enabled
    
    # 2. Persist to database (using the existing status table)
    conn = sqlite3.connect(DB_PATH)
    conn.execute('UPDATE status SET value = ? WHERE key = "camera_enabled"', 
                 (str(status.enabled),))
    conn.commit()
    conn.close()
    
    return {"message": f"Camera state set to {status.enabled}"}


# Provide cam_state and vision_active variables to the server
@app.get("/get-status")
async def get_status():
    global cam_state, vision_active, lock
    
    with lock:
        return {
            "cam_state": cam_state,
            "vision_active": vision_active
        }
    

# GET request that returns the last 7 days of feeding history entries
@app.get("/feeding-logs")
async def get_logs():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute("""
        SELECT id, scheduled_time, pet_name, duration, actual_timestamp 
        FROM feeding_log 
        ORDER BY actual_timestamp DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    
    # Convert tuples to list of dicts for easy JSON parsing in React Native
    return [
        {
            "id": r[0],
            "time": r[1], 
            "pet": r[2], 
            "duration": r[3], 
            "date": r[4]
        } for r in rows
    ]


# DELETE request to delete a log
@app.delete("/delete-log/{log_id}")
async def delete_log(log_id: int):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM feeding_log WHERE id = ?", (log_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}


# GET request to receive a mp4 file from the raspberry pi
@app.get("/videos/{file_name}")
async def get_video(file_name: str):
    """
    Serves a specific video file from the Pi's storage.
    """
    # Create the full path to the video file
    video_path = os.path.join(video_folder, file_name)

    # Check if the file actually exists to avoid a 500 error
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    # media_type="video/mp4" tells the phone's player what kind of file it is
    return FileResponse(video_path, media_type="video/mp4")


# GET request to receive a JSON list of the name and creation time of all videos in video_folder
@app.get("/list-videos")
async def list_videos():
    try:
        files = []
        for filename in os.listdir(video_folder):
            if filename.endswith(".mp4"):
                path = os.path.join(video_folder, filename)
                # Get the creation time
                timestamp = os.path.getmtime(path)
                files.append({
                    "file_name": filename,
                    "timestamp": timestamp,
                    "size": os.path.getsize(path)
                })
        
        # Sort by newest first
        files.sort(key=lambda x: x['timestamp'], reverse=True)
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# DELETE request to delete a specified video clip
@app.delete("/delete-video/{file_name}")
async def delete_video_file(file_name: str):
    file_path = os.path.join(video_folder, file_name)
    if os.path.exists(file_path):
        os.remove(file_path)
        # Also remove the thumbnail
        thumb_path = file_path.replace(".mp4", ".jpg")
        if os.path.exists(thumb_path):
            os.remove(thumb_path)
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="File not found")


def send_push_notification(title, body, data_payload=None):
    """
    Sends a flexible push notification via Firebase.
    :param title: The bold header of the notification
    :param body: The main message text
    :param data_payload: Optional dictionary for app logic (e.g., {'type': 'feed_event'})
    """
    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data=data_payload, # Useful for triggering app behavior
        topic="feeder_updates",
    )
    
    try:
        response = messaging.send(message)
        print(f"Successfully sent [{title}]: {response}")
    except Exception as e:
        print(f"Failed to send notification: {e}")


# MAIN FUNCTION
def main():
    """Initializing hardware"""
    initialize_hardware()

    feeding_times = [("08:00", "Chai", "4"), ("12:00", "Scout", "5"), ("16:00", "Cherry", "3")] # Sample feeding times

    # Initializing Firebase
    firebase_admin.initialize_app(cred)

    """Setting up Computer Vision"""
    global detector, args
    
    parser = argparse.ArgumentParser(description='Raspberry Pi Pet Detection')
    parser.add_argument('--model', type=str, required=True, help='Path to TFLite model')
    parser.add_argument('--classes', type=str, help='Path to classes.txt file (default: same directory as model)')
    parser.add_argument('--conf', type=float, default=0.5, help='Confidence threshold')
    parser.add_argument('--display', action='store_true', help='Display output (requires display)')
    parser.add_argument('--metrics', action='store_true', help='Enable detailed performance metrics')
    parser.add_argument('--save-metrics', type=str, help='Save metrics to JSON file')
    parser.add_argument('--print-metrics-interval', type=int, default=100, 
                       help='Print metrics every N frames (default: 100)')
    args = parser.parse_args()
    
    # Initialize detector with error handling
    print("Initializing detector...")
    try:
        detector = PetDetector(args.model, args.conf, enable_metrics=args.metrics, classes_file=args.classes)
    except RuntimeError as e:
        print(f"Error: {e}")
        print("\nTroubleshooting:")
        print("1. Verify the model file exists and is a valid TFLite model")
        print("2. Check that tflite-runtime is installed: pip install tflite-runtime")
        print("3. Ensure the model was exported correctly from training")
        return
    except Exception as e:
        print(f"Unexpected error loading model: {e}")
        return

    init_db()
    load_settings()

    # Start background threads
    Thread(target=visionLoop, args=(detector, args), daemon=True).start()
    Thread(target=schedulerLoop, daemon=True).start()

    # Register PIR callback
    pir.when_motion = onMotion # Callback registered. gpiozero creates an internal thread that monitors the associated GPIO pins.

    print("System logic threads started...")


if __name__ == '__main__':
    # Initializeing the hardware, threads, and PIR
    main()

    # 2. Start the API Server (blocking)
    print("Starting API Server on port 8000...")
    uvicorn.run("pet_feeder:app", host="0.0.0.0", port=8000, reload=False)


