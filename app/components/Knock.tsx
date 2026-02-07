"use client";

import React, { useState } from "react";

export default function Knock() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<"off" | "on">("off");
  const [error, setError] = useState<string | null>(null);

  // Handles connecting and streaming serial input
  const handleConnect = async () => {
    setError(null);
    try {
      // 1. Request port and open connection
      // @ts-ignore: 'serial' may not exist on all browsers
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 921600 });

      setConnected(true);

      // 2. Set up a text decoder to read strings
      // @ts-ignore: TextDecoderStream may not exist on all browsers
      const textDecoder = new TextDecoderStream();
      // @ts-ignore: pipeTo may not exist
      port.readable.pipeTo(textDecoder.writable);
      // @ts-ignore
      const reader = textDecoder.readable.getReader();

      // 3. Read Loop
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        if (typeof value === "string" && value.includes("1")) {
          setStatus("on");
          document.body.style.backgroundColor = "#e8f5e9";
        } else if (typeof value === "string" && value.includes("0")) {
          setStatus("off");
          document.body.style.backgroundColor = "white";
        }
      }
    } catch (err: any) {
      setError("Serial Connection Failed: " + (err?.message ?? String(err)));
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 mt-10">
      <h1 className="text-3xl font-bold">Knock Demo</h1>
      <button
        onClick={handleConnect}
        disabled={connected}
        className={`px-6 py-3 rounded bg-blue-600 text-white font-semibold transition-opacity ${
          connected ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
        }`}
        id="connectBtn"
      >
        {connected ? "Connected!" : "Connect to ESP32"}
      </button>
      <div
        id="status-box"
        className={`mt-4 px-8 py-4 rounded text-lg font-mono font-bold transition-all ${
          status === "on"
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-gray-100 text-gray-600 border border-gray-200"
        }`}
      >
        {status === "on" ? "TOUCH ON" : "TOUCH OFF"}
      </div>
      {error && (
        <div className="mt-4 text-red-600 font-mono text-sm">{error}</div>
      )}
    </div>
  );
}