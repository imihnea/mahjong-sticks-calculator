import { act, renderHook } from "@testing-library/react";
import { createElement, StrictMode, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cameraUnavailableMessage, captureVideoFrame, supportsCameraCapture, useCameraCapture } from "./useCameraCapture";

describe("camera helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("detects missing browser camera support", () => {
    expect(supportsCameraCapture({ mediaDevices: undefined })).toBe(false);
  });

  it("captures the current video frame into a data URL", () => {
    const drawImage = vi.fn();
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toDataURL: vi.fn(() => "data:image/jpeg;base64,captured")
    } as unknown as HTMLCanvasElement;
    const video = { videoWidth: 1280, videoHeight: 720 } as HTMLVideoElement;

    const result = captureVideoFrame(video, () => canvas);

    expect(canvas.width).toBe(1280);
    expect(canvas.height).toBe(720);
    expect(drawImage).toHaveBeenCalledWith(video, 0, 0, 1280, 720);
    expect(result).toBe("data:image/jpeg;base64,captured");
  });

  it("explains secure-context requirement", () => {
    expect(cameraUnavailableMessage(false)).toBe("Camera capture requires HTTPS or localhost.");
  });

  it("stops the previous stream before replacing it", async () => {
    const firstStream = createMockStream();
    const secondStream = createMockStream();
    mockGetUserMedia(firstStream, secondStream);
    const { result } = renderHook(() => useCameraCapture());

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await result.current.start();
    });

    expect(firstStream.stop).toHaveBeenCalledTimes(1);
    expect(secondStream.stop).not.toHaveBeenCalled();
    expect(result.current.stream).toBe(secondStream.stream);
  });

  it("stops the active stream and clears video output on unmount", async () => {
    const activeStream = createMockStream();
    mockGetUserMedia(activeStream);
    const { result, unmount } = renderHook(() => useCameraCapture());
    const video = document.createElement("video");
    result.current.videoRef.current = video;

    await act(async () => {
      await result.current.start();
    });
    expect(video.srcObject).toBe(activeStream.stream);

    unmount();

    expect(activeStream.stop).toHaveBeenCalledTimes(1);
    expect(video.srcObject).toBeNull();
  });

  it("clears stale errors after a successful retry and stop", async () => {
    const activeStream = createMockStream();
    const getUserMedia = vi
      .fn<Navigator["mediaDevices"]["getUserMedia"]>()
      .mockRejectedValueOnce(new Error("denied"))
      .mockResolvedValueOnce(activeStream.stream);
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.stubGlobal("isSecureContext", true);
    const { result } = renderHook(() => useCameraCapture());

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBe("Camera permission was denied or no camera is available.");

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBeNull();

    act(() => {
      result.current.stop();
    });
    expect(result.current.error).toBeNull();
  });

  it("stops a pending stream if capture resolves after stop", async () => {
    const lateStream = createMockStream();
    let resolveCapture!: (stream: MediaStream) => void;
    const getUserMedia = vi.fn<Navigator["mediaDevices"]["getUserMedia"]>().mockReturnValue(
      new Promise((resolve) => {
        resolveCapture = resolve;
      })
    );
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.stubGlobal("isSecureContext", true);
    const { result } = renderHook(() => useCameraCapture());

    void act(() => {
      void result.current.start();
    });
    act(() => {
      result.current.stop();
    });
    await act(async () => {
      resolveCapture(lateStream.stream);
    });

    expect(lateStream.stop).toHaveBeenCalledTimes(1);
    expect(result.current.stream).toBeNull();
  });

  it("stops a pending stream if capture resolves after unmount", async () => {
    const lateStream = createMockStream();
    let resolveCapture!: (stream: MediaStream) => void;
    const getUserMedia = vi.fn<Navigator["mediaDevices"]["getUserMedia"]>().mockReturnValue(
      new Promise((resolve) => {
        resolveCapture = resolve;
      })
    );
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.stubGlobal("isSecureContext", true);
    const { result, unmount } = renderHook(() => useCameraCapture());

    void act(() => {
      void result.current.start();
    });
    unmount();
    await act(async () => {
      resolveCapture(lateStream.stream);
    });

    expect(lateStream.stop).toHaveBeenCalledTimes(1);
  });

  it("does not set a stale error if capture rejects after stop", async () => {
    let rejectCapture!: (error: Error) => void;
    const getUserMedia = vi.fn<Navigator["mediaDevices"]["getUserMedia"]>().mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectCapture = reject;
      })
    );
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.stubGlobal("isSecureContext", true);
    const { result } = renderHook(() => useCameraCapture());

    void act(() => {
      void result.current.start();
    });
    act(() => {
      result.current.stop();
    });
    await act(async () => {
      rejectCapture(new Error("denied"));
    });

    expect(result.current.error).toBeNull();
  });

  it("does not update state if capture rejects after unmount", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let rejectCapture!: (error: Error) => void;
    const getUserMedia = vi.fn<Navigator["mediaDevices"]["getUserMedia"]>().mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectCapture = reject;
      })
    );
    vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
    vi.stubGlobal("isSecureContext", true);
    const { result, unmount } = renderHook(() => useCameraCapture());

    void act(() => {
      void result.current.start();
    });
    unmount();
    await act(async () => {
      rejectCapture(new Error("denied"));
    });

    expect(consoleError).not.toHaveBeenCalled();
  });

  it("accepts a stream under React StrictMode", async () => {
    const activeStream = createMockStream();
    mockGetUserMedia(activeStream);
    const { result } = renderHook(() => useCameraCapture(), { wrapper: strictModeWrapper });

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.stream).toBe(activeStream.stream);
    expect(activeStream.stop).not.toHaveBeenCalled();
  });
});

function strictModeWrapper({ children }: { children: ReactNode }) {
  return createElement(StrictMode, null, children);
}

function createMockStream() {
  const stop = vi.fn();
  const stream = {
    getTracks: () => [{ stop }]
  } as unknown as MediaStream;

  return { stream, stop };
}

function mockGetUserMedia(...streams: Array<{ stream: MediaStream }>) {
  const getUserMedia = vi.fn<Navigator["mediaDevices"]["getUserMedia"]>();
  for (const { stream } of streams) {
    getUserMedia.mockResolvedValueOnce(stream);
  }
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  vi.stubGlobal("isSecureContext", true);
  return getUserMedia;
}
