"use client";

import { useCallback, useRef, useState } from "react";

export function supportsCameraCapture(
  navigatorLike: Pick<Navigator, "mediaDevices"> | { mediaDevices?: undefined }
): boolean {
  return Boolean(navigatorLike.mediaDevices?.getUserMedia);
}

export function cameraUnavailableMessage(isSecureContext: boolean): string {
  return isSecureContext
    ? "Camera permission was denied or no camera is available. Use photo upload instead."
    : "Camera capture requires HTTPS or localhost. Use photo upload instead.";
}

export function useCameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (!supportsCameraCapture(navigator)) {
      setError(cameraUnavailableMessage(window.isSecureContext));
      return;
    }

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      setStream(nextStream);
      if (videoRef.current) videoRef.current.srcObject = nextStream;
    } catch {
      setError(cameraUnavailableMessage(window.isSecureContext));
    }
  }, []);

  const stop = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
  }, [stream]);

  return { videoRef, stream, error, start, stop };
}
