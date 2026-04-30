"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function supportsCameraCapture(
  navigatorLike: Pick<Navigator, "mediaDevices"> | { mediaDevices?: undefined }
): boolean {
  return Boolean(navigatorLike.mediaDevices?.getUserMedia);
}

export function cameraUnavailableMessage(isSecureContext: boolean): string {
  return isSecureContext
    ? "Camera permission was denied or no camera is available."
    : "Camera capture requires HTTPS or localhost.";
}

export function captureVideoFrame(video: HTMLVideoElement, createCanvas = () => document.createElement("canvas")): string | null {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width <= 0 || height <= 0) return null;

  const canvas = createCanvas();
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.drawImage(video, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export function useCameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const requestGenerationRef = useRef(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopCurrentStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    const requestGeneration = ++requestGenerationRef.current;

    if (!supportsCameraCapture(navigator)) {
      setError(cameraUnavailableMessage(window.isSecureContext));
      return;
    }

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) {
        nextStream.getTracks().forEach((track) => track.stop());
        return;
      }
      stopCurrentStream();
      streamRef.current = nextStream;
      setStream(nextStream);
      if (videoRef.current) videoRef.current.srcObject = nextStream;
    } catch {
      if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) {
        return;
      }
      setError(cameraUnavailableMessage(window.isSecureContext));
    }
  }, [stopCurrentStream]);

  const stop = useCallback(() => {
    requestGenerationRef.current += 1;
    stopCurrentStream();
    setError(null);
  }, [stopCurrentStream]);

  useEffect(
    () => {
      mountedRef.current = true;

      return () => {
        mountedRef.current = false;
        requestGenerationRef.current += 1;
        stopCurrentStream();
      };
    },
    [stopCurrentStream]
  );

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  return { videoRef, stream, error, start, stop };
}
