/**
 * App Lock & Privacy Shield Provider.
 * Provides:
 * 1. App Switcher Shield: Masks app content when iOS transitions to inactive/background.
 * 2. Biometric App Lock: Face ID / Touch ID / Passcode lock when appLock setting is enabled.
 *
 * Safety rules:
 * - Never cover onboarding or the boot/error screens.
 * - Prompt at most once per lock cycle (no re-prompt loops on foreground).
 * - Fail open when the device has no biometrics AND no passcode, so a user can
 *   never be permanently trapped behind an unescapable overlay.
 */

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, StyleSheet, View } from 'react-native';

import { useApp } from '@/data/store';
import { authenticateAsync, checkBiometricsStatus } from '@/lib/biometrics';
import { color, radius, space } from '@/theme/tokens';
import { Button, Card, Txt } from '@/components/ui/primitives';
import { haptic } from '@/lib/haptics';

type AppLockContextValue = {
  isLocked: boolean;
  unlock: () => Promise<boolean>;
  lock: () => void;
};

const AppLockContext = createContext<AppLockContextValue>({
  isLocked: false,
  unlock: async () => true,
  lock: () => {},
});

export function useAppLock() {
  return useContext(AppLockContext);
}

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const appLockEnabled = state.settings.appLock && state.isReady && state.onboarded;

  const [isLocked, setIsLocked] = useState(false);
  const [isInBackground, setIsInBackground] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [canAuthenticate, setCanAuthenticate] = useState(true);

  const backgroundTimestampRef = useRef<number>(0);
  const isPromptingRef = useRef<boolean>(false);
  const autoPromptedRef = useRef<boolean>(false);
  const resolvedInitialLockRef = useRef<boolean>(false);
  const isLockedRef = useRef<boolean>(isLocked);
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  const handleUnlock = useCallback(async (): Promise<boolean> => {
    if (isPromptingRef.current) return false;
    isPromptingRef.current = true;
    setAuthError(null);

    try {
      const status = await checkBiometricsStatus();
      if (!status.hasHardware && !status.isEnrolled) {
        // No secure unlock method exists on this device — do not trap the user.
        setCanAuthenticate(false);
        setIsLocked(false);
        autoPromptedRef.current = false;
        return true;
      }

      setCanAuthenticate(true);
      const res = await authenticateAsync('Buka kunci KuroStop untuk melihat catatan');
      if (res.success) {
        autoPromptedRef.current = false;
        setIsLocked(false);
        setAuthError(null);
        haptic.success();
        return true;
      }

      setAuthError(res.error || 'Autentikasi tidak berhasil.');
      haptic.error();
      return false;
    } finally {
      isPromptingRef.current = false;
    }
  }, []);

  const handleLock = useCallback(() => {
    if (!appLockEnabled) return;
    autoPromptedRef.current = false;
    setIsLocked(true);
    setAuthError(null);
  }, [appLockEnabled]);

  // Adopt the persisted `appLock` setting exactly once, as soon as it is loaded.
  useEffect(() => {
    if (!state.isReady || resolvedInitialLockRef.current) return;
    resolvedInitialLockRef.current = true;
    if (state.settings.appLock) {
      autoPromptedRef.current = false;
      setIsLocked(true);
    }
  }, [state.isReady, state.settings.appLock]);

  // Auto-prompt once per lock cycle. The ref guard is what prevents the
  // "Face ID prompt every render / every foreground" loop.
  useEffect(() => {
    if (!appLockEnabled || !isLocked) return;
    if (autoPromptedRef.current) return;
    autoPromptedRef.current = true;
    void handleUnlock();
  }, [appLockEnabled, isLocked, handleUnlock]);

  // AppState lifecycle listener for iOS background/foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'inactive' || nextState === 'background') {
        setIsInBackground(true);
        if (backgroundTimestampRef.current === 0) {
          backgroundTimestampRef.current = Date.now();
        }
        return;
      }

      if (nextState !== 'active') return;

      const bgDuration = Date.now() - backgroundTimestampRef.current;
      backgroundTimestampRef.current = 0;
      setIsInBackground(false);

      // A biometric prompt briefly drives the app through `inactive`; never
      // treat that as a new "returned from background" lock event.
      if (isPromptingRef.current) return;
      if (!appLockEnabled) return;

      if (bgDuration > 2000) {
        // Genuinely returned from the background: require a fresh unlock.
        autoPromptedRef.current = false;
        setIsLocked(true);
      } else if (isLockedRef.current) {
        // Still locked; keep the lock but do not re-trigger the auto prompt.
        setIsLocked(true);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [appLockEnabled]);

  const overlayVisible = appLockEnabled && isLocked && canAuthenticate && !isInBackground;

  return (
    <AppLockContext.Provider value={{ isLocked: appLockEnabled && isLocked, unlock: handleUnlock, lock: handleLock }}>
      <View style={styles.container}>
        {children}

        {/* 1. App Switcher Privacy Shield (Masks content during iOS multitasking / snapshots) */}
        {isInBackground && appLockEnabled && (
          <View style={styles.privacyShield} accessibilityElementsHidden aria-hidden>
            <View style={styles.shieldEmblem}>
              <Txt variant="hero" color={color.white}>K</Txt>
            </View>
            <Txt variant="headline" color={color.ink2} style={{ marginTop: 12 }}>
              KuroStop
            </Txt>
            <Txt variant="footnote" color={color.ink4} style={{ marginTop: 4 }}>
              Privat &amp; Terenkripsi Lokal
            </Txt>
          </View>
        )}

        {/* 2. Biometric App Lock Screen */}
        {overlayVisible && (
          <View style={styles.lockScreen}>
            <Card style={styles.lockCard}>
              <View style={styles.shieldEmblem}>
                <Txt variant="hero" color={color.white}>K</Txt>
              </View>
              <Txt variant="title" weight="700" center style={{ marginTop: 12 }}>
                KuroStop Terkunci
              </Txt>
              <Txt variant="callout" color={color.ink3} center style={{ marginTop: 6, maxWidth: 280 }}>
                Gunakan Face ID, Touch ID, atau Kode Sandi perangkat untuk membuka catatan disiplin Anda.
              </Txt>

              {authError && (
                <View style={styles.errorBanner}>
                  <Txt variant="footnote" color={color.vermilion} center>
                    {authError}
                  </Txt>
                </View>
              )}

              <View style={{ width: '100%', marginTop: 24, gap: 10 }}>
                <Button
                  label="Buka Kunci"
                  icon="lock-open-outline"
                  variant="primary"
                  onPress={handleUnlock}
                />
              </View>
            </Card>
          </View>
        )}
      </View>
    </AppLockContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  privacyShield: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: color.paper,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  lockScreen: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: color.paper,
    justifyContent: 'center',
    alignItems: 'center',
    padding: space.lg,
    zIndex: 99998,
  },
  lockCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    paddingVertical: space.xl,
    paddingHorizontal: space.lg,
  },
  shieldEmblem: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: color.ink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: color.vermilionTint,
  },
});
