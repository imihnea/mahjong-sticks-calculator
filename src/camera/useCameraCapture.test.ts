import { describe, expect, it } from "vitest";
import { cameraUnavailableMessage, supportsCameraCapture } from "./useCameraCapture";

describe("camera helpers", () => {
  it("detects missing browser camera support", () => {
    expect(supportsCameraCapture({ mediaDevices: undefined })).toBe(false);
  });

  it("explains secure-context requirement", () => {
    expect(cameraUnavailableMessage(false)).toBe("Camera capture requires HTTPS or localhost. Use photo upload instead.");
  });
});
