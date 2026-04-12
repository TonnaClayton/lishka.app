import { Capacitor } from "@capacitor/core";
import { LiveUpdate } from "@capawesome/capacitor-live-update";
import { log, error as logError } from "./logging";

/**
 * Check for and apply OTA updates on native platforms.
 * On web, this is a no-op.
 */
export async function checkForLiveUpdate(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const result = await LiveUpdate.sync();
    log("[LiveUpdate] Sync result:", result);

    if (result.nextBundleId) {
      log("[LiveUpdate] New bundle ready, will apply on next app restart");
    }
  } catch (err) {
    logError("[LiveUpdate] Sync failed:", err);
  }
}

/**
 * Reset to the built-in bundle (useful for debugging or rollback).
 */
export async function resetLiveUpdate(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await LiveUpdate.reset();
    await LiveUpdate.reload();
    log("[LiveUpdate] Reset to built-in bundle");
  } catch (err) {
    logError("[LiveUpdate] Reset failed:", err);
  }
}
