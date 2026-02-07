#include <Arduino.h>

// put function declarations here:

// GLOBAL VARIABLES
//  Define the GPIO pin for the external LED
const int touchPin = 4; // SIG pin connected here
const int ledPin = 5;   // External LED connected here
int lastState = LOW;    // Track the previous state of the sensor

void setup()
{
  // Use a very high baud rate for low latency
  Serial.begin(921600);

  pinMode(touchPin, INPUT); // The sensor sends data TO the ESP32
  pinMode(ledPin, OUTPUT);  // The ESP32 sends power TO the LED

  Serial.println("System Ready. Waiting for touch...");
}

void loop()
{
int currentState = digitalRead(touchPin);

  // 1. Instant LED Feedback (Physical Latency)
  // This happens every loop for the fastest visual response
  digitalWrite(ledPin, currentState);

  // 2. Logic for Serial Printing (Data Latency)
  // Only print when the state actually changes
  if (currentState != lastState) {
    if (currentState == HIGH) {
      Serial.println("1"); // Use "1" instead of "Touched" for even lower byte-latency
    } else {
      Serial.println("0");
    }
    // Save the current state for the next comparison
    lastState = currentState;
  }
}

// Write Helper Functions here