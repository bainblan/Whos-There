"use client";

import { useEffect, useRef, useState } from "react";

type Timbre = "knock" | "click" | "bell" | "wood";

type UseAudio = {
  playClick: (type?: Timbre) => void;
  playSequence: (intervals: number[], type?: Timbre) => void;
  resumeAudio: () => Promise<void>;
  ready: boolean;
  setKnockDuration: (duration: number) => void;
};

export default function useAudio(): UseAudio {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const knockBufferRef = useRef<AudioBuffer | null>(null);
  const knockDurationRef = useRef<number>(0.225); // first knock duration in seconds
  const timeoutsRef = useRef<number[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
      if (ctxRef.current) {
        try {
          ctxRef.current.close();
        } catch (_) {}
      }
    };
  }, []);

  // Load knock.mp3 on mount
  useEffect(() => {
    (async () => {
      try {
        await ensureContext();
        if (!ctxRef.current) return;
        const res = await fetch("/knock.mp3");
        if (!res.ok) throw new Error("knock.mp3 not found");
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await ctxRef.current.decodeAudioData(arrayBuffer);
        knockBufferRef.current = audioBuffer;
        console.log("Loaded knock.mp3 successfully");
      } catch (err: any) {
        console.warn("Failed to load knock.mp3, will use synthesized knock:", err?.message);
      }
    })();
  }, []);

  const ensureContext = async () => {
    if (!ctxRef.current) {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const gain = ctx.createGain();
      gain.gain.value = 0.9;
      gain.connect(ctx.destination);
      ctxRef.current = ctx;
      masterGainRef.current = gain;
      setReady(true);
    }
  };

  const resumeAudio = async () => {
    await ensureContext();
    if (ctxRef.current && ctxRef.current.state === "suspended") {
      try {
        await ctxRef.current.resume();
      } catch (_) {}
    }
  };

  const playClick = (type: Timbre = "knock") => {
    if (!ctxRef.current) {
      void ensureContext();
    }
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const now = ctx.currentTime;

    if (type === "knock") {
      // If we have knock.mp3 loaded, use it; otherwise fall back to synthesized
      if (knockBufferRef.current) {
        const src = ctx.createBufferSource();
        src.buffer = knockBufferRef.current;
        const gain = ctx.createGain();
        gain.gain.value = 1.0;
        src.connect(gain);
        gain.connect(master);
        src.start(now, 0, knockDurationRef.current);
        return;
      }

      // Fallback: synthesized knock (noise slap + low body)
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-30 * (i / data.length));
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const slapFilter = ctx.createBiquadFilter();
      slapFilter.type = "bandpass";
      slapFilter.frequency.value = 1200;
      slapFilter.Q = 1.5;

      const slapGain = ctx.createGain();
      slapGain.gain.setValueAtTime(0.6, now);
      slapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      src.connect(slapFilter);
      slapFilter.connect(slapGain);
      slapGain.connect(master);
      src.start(now);
      src.stop(now + 0.09);

      // Low-frequency body (short sine-ish thud)
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = "sine";
      bodyOsc.frequency.value = 120;
      bodyGain.gain.setValueAtTime(0.01, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.5, now + 0.005);
      bodyGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(master);
      bodyOsc.start(now);
      bodyOsc.stop(now + 0.12);
      return;
    }

    if (type === "click") {
      const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-20 * (i / data.length));
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filt = ctx.createBiquadFilter();
      filt.type = "highpass";
      filt.frequency.value = 700;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      src.connect(filt);
      filt.connect(gain);
      gain.connect(master);
      src.start(now);
      src.stop(now + 0.07);
      return;
    }

    if (type === "bell") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const detuneOsc = ctx.createOscillator();

      osc.type = "sine";
      osc.frequency.value = 880;
      detuneOsc.type = "sine";
      detuneOsc.frequency.value = 880 * 1.01;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(1.0, now + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      const merger = ctx.createGain();
      detuneOsc.connect(merger);
      osc.connect(merger);
      merger.connect(gain);
      gain.connect(master);

      osc.start(now);
      detuneOsc.start(now);
      osc.stop(now + 0.65);
      detuneOsc.stop(now + 0.65);
      return;
    }

    if (type === "wood") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const biquad = ctx.createBiquadFilter();

      osc.type = "triangle";
      osc.frequency.value = 220;
      biquad.type = "bandpass";
      biquad.frequency.value = 600;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.8, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(biquad);
      biquad.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + 0.2);
      return;
    }
  };

  const playSequence = (intervals: number[], type: Timbre = "knock") => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];

    // First knock immediately
    playClick(type);
    let t = 0;
    for (let i = 0; i < intervals.length; i++) {
      t += intervals[i];
      const id = window.setTimeout(() => {
        playClick(type);
      }, t);
      timeoutsRef.current.push(id);
    }
  };

  const setKnockDuration = (duration: number) => {
    knockDurationRef.current = duration;
  };

  return { playClick, playSequence, resumeAudio, ready, setKnockDuration };
}
