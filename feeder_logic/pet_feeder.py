#!/usr/bin/env python3
from gpiozero import DistanceSensor, Servo, MotionSensor
from time import sleep, time
from signal import pause
from threading import Thread, Lock

# Dependencies for pet detection module
"""
Raspberry Pi Pet Detection Module
Real-time cat and dog detection using TFLite and Pi Camera
"""
import time
import numpy as np
import cv2
import json
from pathlib import Path
from typing import List, Tuple, Optional
from dataclasses import dataclass, asdict
from collections import deque

try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    import tensorflow.lite as tflite

try:
    from picamera2 import Picamera2
except ImportError:
    Picamera2 = None

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
        
        print(f"Model loaded successfully")
        print(f"Input size: {self.input_width}x{self.input_height}")
        print(f"Confidence threshold: {self.conf_threshold}")
        if enable_metrics:
            print(f"Performance metrics: ENABLED")

    def preprocess(self, frame: np.ndarray) -> np.ndarray:
        """
        Preprocess frame for model input
        
        Args:
            frame: Input frame (BGR format from camera)
            
        Returns:
            Preprocessed frame ready for inference
        """
        # Resize to model input size
        resized = cv2.resize(frame, (self.input_width, self.input_height))
        
        # Convert BGR to RGB
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        
        # Normalize to [0, 1] range
        normalized = rgb.astype(np.float32) / 255.0
        
        # Add batch dimension
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
        lowfood = 1
        print('Food low. please refill NOW')    # SEND to app
    else: lowfood = 0


def dispenseFood(angle, wait_time=4.0):
    print("Dispensing food...")
    #Move servo to a given angle (0–180), wait, then return to 0.
    # Convert angle (0–180) to gpiozero range (-1 to 1)
    value = (angle / 90) - 1  # 0°=-1, 90°=0, 180°=1

    # Move to target angle
    servo.value = value
    sleep(wait_time)

    # Move back to 0°
    servo.value = -1
    sleep(wait_time)

    # Stop sending signal (prevents jitter)
    servo.detach()
    print("Food dispensed!")    # SEND to feeding log

    levelCheck()
    activateVision()


def onMotion():
    global lock
    print("Motion detected!")
    
    with lock:
        active = vision_active
    
    if not active:
        activateVision()


def schedulerLoop():
    global feeding_times
    while True:
        now = time.strftime("%H:%M")
        
        if now in feeding_times:
            dispenseFood()
            sleep(60)  # prevent duplicate trigger
        
        sleep(10)

def activateVision():
    global vision_active, vision_stop_time, lock, cam_state
    
    if cam_state == True:
        with lock:
            vision_active = True
            vision_stop_time = time() + (30 * 60)  # 30 minutes
    
        print("Vision activated for 30 minutes")


def run_detection_loop(camera, detector, args, stop_time):
    global vision_stop_time, lock
    # Initialize local loop variables
    fps_counter = 0
    fps_start_time = time.time()
    fps = 0.0
    low_fps_warning_shown = False
    no_detection_count = 0
    no_detection_warning_interval = 100

    print("\nStarting detection loop...")
    print("Press Ctrl+C to stop")
    if args.metrics:
        print(f"Performance metrics will be printed every {args.print_metrics_interval} frames\n")

    try:
        while True:
            # Check if we should still be running
            current_time = time()

            # We check the GLOBAL stop_time in case activateVision() updated it
            with lock:
                current_stop_limit = vision_stop_time

            if current_time > current_stop_limit:
                print("30 minutes elapsed. Closing detection loop...")
                break # This exits the function and returns to visionLoop's 'finally' block

            # Capture frame
            frame = camera.capture_array()
            frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            
            # Run detection
            detections = detector.detect(frame_bgr)
            
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
                for det in detections:
                    print(f"  - {det.class_name} ({det.confidence:.2f})")
            
    except KeyboardInterrupt:
        print("\n\nShutting down gracefully...")


def visionLoop(detector, args):
    global vision_active, vision_stop_time, lock

    while True:
        with lock:
            active = vision_active
            stop_time = vision_stop_time

        if active:
            print(f"Vision Active. Target stop time: {time.ctime(stop_time)}")
            try:
                # 1. SETUP: Start camera ONLY when needed
                camera = Picamera2()
                config = camera.create_preview_configuration(
                    main={"size": (640, 480), "format": "RGB888"}
                )
                camera.configure(config)
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

        sleep(1) # Poll every second to save CPU


# MAIN FUNCTION
def main():
    global feeding_times, lowfood, vision_active, vision_stop_time, sensor, servo, pir, lock, cam_state

    feeding_times = ["08:00", "18:00"] # Sample feeding times
    lowfood = 0
    vision_active = False
    vision_stop_time = 0
    sensor = DistanceSensor(echo=24, trigger=23) # Adjust pin numbers if needed
    servo = Servo(18) # Initialize servo on GPIO 18
    pir = MotionSensor(4) # Initialize PIR motion sensor to GPIO 4
    lock = Lock()

    """Setting up Computer Vision"""
    import argparse
    
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

    # Start background threads
    Thread(target=visionLoop, args=(detector, args), daemon=True).start()
    Thread(target=schedulerLoop, daemon=True).start()

    # Register PIR callback
    pir.when_motion = onMotion # Callback registered. gpiozero creates an internal thread that monitors the associated GPIO pins.

    print("System running...")
    pause()


if __name__ == '__main__':
    main()



