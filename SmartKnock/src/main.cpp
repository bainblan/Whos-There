#include <Arduino.h>

const int touchPin = 4;
const int ledPin = 5;

// Timing/State Variables
unsigned long knockIntervals[30]; 
int knockCount = 0;
unsigned long lastTouchTime = 0;
bool isRecording = false;
const int timeoutLimit = 3000;
int lastTouchState = LOW;

void setup() {
  Serial.begin(921600);
  pinMode(touchPin, INPUT);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  int touchState = digitalRead(touchPin);
  unsigned long currentTime = millis();

  // --- PART 1: REAL-TIME FEEDBACK (The 1s and 0s) ---
  if (touchState != lastTouchState) {
    digitalWrite(ledPin, touchState);
    Serial.println(touchState); // Sends "1" or "0" immediately
    
    // --- PART 2: INTERVAL TRACKING (The Logic) ---
    if (touchState == HIGH) { // Just touched
      if (isRecording) {
        knockIntervals[knockCount] = currentTime - lastTouchTime;
        knockCount++;
      }
      lastTouchTime = currentTime;
      isRecording = true;
    }
    lastTouchState = touchState;
  }

  // --- PART 3: THE DATA DUMP (Timeout) ---
  if (isRecording && (currentTime - lastTouchTime > timeoutLimit)) {
    if (knockCount > 0) {
      // We prefix with 'DATA:' so React can distinguish it from 1s and 0s
      Serial.print("DATA:"); 
      for (int i = 0; i < knockCount; i++) {
        Serial.print(knockIntervals[i]);
        if (i < knockCount - 1) Serial.print(",");
      }
      Serial.println(); 
    }
    
    // Reset
    knockCount = 0;
    isRecording = false;
  }
}