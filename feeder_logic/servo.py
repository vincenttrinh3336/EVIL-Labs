#!/usr/bin/env python3
from gpiozero import Servo
from time import sleep, time
from datetime import datetime
from signal import pause
import time

def dispenseFood(feed_tuple):
    global servo_angle, servo
    feed_time = feed_tuple[0]
    pet_name = feed_tuple[1]
    wait_time = float(feed_tuple[2])  # Convert to float
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


# MAIN FUNCTION
def main():
    global feeding_times, servo, last_dispense_time, servo_angle

    feeding_times = [("08:00", "Chai", "4"), ("12:00", "Scout", "5"), ("16:00", "Cherry", "3")] # Sample feeding times, (Time, Pet name, Seconds)

    servo = Servo(27) # Initialize servo on GPIO 18
    servo.value = 0.2  # Set initial position to 0 degrees
    sleep(1)  # Give servo time to reach initial position
  
    last_dispense_time = ""
    servo_angle = -240

    value = int(input("Enter a value: "))
    if value > 0:
        dispenseFood(feeding_times[0])

    print("Exiting!")
    time.sleep(3)


if __name__ == '__main__':
    main()



