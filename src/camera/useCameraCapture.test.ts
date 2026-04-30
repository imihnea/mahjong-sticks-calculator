import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cameraUnavailableMessage, supportsCameraCapture, useCameraCapture } from "./useCameraCapture";

describe("camera helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("detects missing browser camera support", () => {
    expect(supportsCameraCapture({ mediaDevices: undefined })).toBe(false);
  });

  it("explains secure-context requirement", () => {
    expect(cameraUnavailableMessage(false)).toBe("Camera capture requires HTTPS or localhost. Use photo upload instead.");
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
    expect(result.current.error).toBe("Camera permission was denied or no camera is available. Use photo upload instead.");

    await act(async () => {
      await result.current.start();
    });
    expect(result.current.error).toBeNull();

    act(() => {
      result.current.stop();
    });
    expect(result.current.error).toBeNull();
  });
});

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
