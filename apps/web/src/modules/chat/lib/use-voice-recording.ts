"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceRecordingOptions {
  onBlobReady: (blob: Blob) => void;
  onPermissionDenied: () => void;
}

function computeLevel(analyser: AnalyserNode): number {
  const dataArray = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(dataArray);
  let sum = 0;
  for (const sample of dataArray) {
    const val = (sample - 128) / 128;
    sum += val * val;
  }
  const rms = Math.sqrt(sum / dataArray.length);
  return Math.min(1, rms * 4);
}

function renderWaveform(
  canvas: HTMLCanvasElement,
  bars: number[],
  barWidth: number,
  barGap: number
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const scaledW = Math.round(w * dpr);
  const scaledH = Math.round(h * dpr);
  if (canvas.width !== scaledW || canvas.height !== scaledH) {
    canvas.width = scaledW;
    canvas.height = scaledH;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const minH = 2;
  const maxH = h - 2;
  ctx.fillStyle = "hsl(var(--primary))";
  for (let i = 0; i < bars.length; i++) {
    const bh = Math.max(minH, bars[i] * maxH);
    const x = i * (barWidth + barGap);
    const y = (h - bh) / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, bh, barWidth / 2);
    ctx.fill();
  }
}

function stopTracks(stream: MediaStream | null) {
  if (!stream) {
    return;
  }
  for (const track of stream.getTracks()) {
    track.stop();
  }
}

export function useVoiceRecording({
  onBlobReady,
  onPermissionDenied,
}: UseVoiceRecordingOptions) {
  const onBlobReadyRef = useRef(onBlobReady);
  const onPermissionDeniedRef = useRef(onPermissionDenied);
  onBlobReadyRef.current = onBlobReady;
  onPermissionDeniedRef.current = onPermissionDenied;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const waveformBarsRef = useRef<number[]>([]);
  const shouldSendRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!(canvas && analyser)) {
      return;
    }

    const BAR_W = 3;
    const BAR_GAP = 2;
    let lastTime = 0;

    function draw(timestamp: number) {
      if (!(canvas && analyser)) {
        return;
      }

      if (timestamp - lastTime >= 50) {
        lastTime = timestamp;
        const level = computeLevel(analyser);
        waveformBarsRef.current.push(level);
        const maxBars = Math.ceil(canvas.clientWidth / (BAR_W + BAR_GAP)) + 1;
        if (waveformBarsRef.current.length > maxBars) {
          waveformBarsRef.current = waveformBarsRef.current.slice(-maxBars);
        }
      }

      renderWaveform(canvas, waveformBarsRef.current, BAR_W, BAR_GAP);
      animationFrameRef.current = requestAnimationFrame(draw);
    }

    animationFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {
          // Best-effort cleanup
        });
      }
      stopTracks(streamRef.current);
    };
  }, []);

  const cleanupRecordingUI = useCallback(() => {
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {
        // Best-effort cleanup
      });
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stopTracks(streamRef.current);
        streamRef.current = null;
        if (shouldSendRef.current && blob.size > 0) {
          onBlobReadyRef.current(blob);
        }
        shouldSendRef.current = false;
      };
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      shouldSendRef.current = false;
      waveformBarsRef.current = [];
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      onPermissionDeniedRef.current();
    }
  }, []);

  const sendRecording = useCallback(() => {
    shouldSendRef.current = true;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    cleanupRecordingUI();
  }, [cleanupRecordingUI]);

  const cancelRecording = useCallback(() => {
    shouldSendRef.current = false;
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    cleanupRecordingUI();
  }, [cleanupRecordingUI]);

  return {
    isRecording,
    recordingDuration,
    canvasRef,
    startRecording,
    sendRecording,
    cancelRecording,
  };
}
