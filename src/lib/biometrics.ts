/**
 * Native iOS Biometric Authentication Service.
 * Uses expo-local-authentication with Face ID, Touch ID, and passcode fallback.
 */

import * as LocalAuthentication from 'expo-local-authentication';

export type BiometricStatus = {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometryType: 'face_id' | 'touch_id' | 'iris' | 'none';
};

export async function checkBiometricsStatus(): Promise<BiometricStatus> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometryType: BiometricStatus['biometryType'] = 'none';
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometryType = 'face_id';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometryType = 'touch_id';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometryType = 'iris';
    }

    return { hasHardware, isEnrolled, biometryType };
  } catch (err) {
    console.warn('[Biometrics] Error checking status:', err);
    return { hasHardware: false, isEnrolled: false, biometryType: 'none' };
  }
}

export async function authenticateAsync(
  promptMessage = 'Buka kunci KuroStop untuk melihat catatan disiplin',
): Promise<{ success: boolean; error?: string }> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      // Still attempt with device passcode fallback if supported
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        cancelLabel: 'Batal',
        fallbackLabel: 'Gunakan Kode Sandi',
        disableDeviceFallback: false,
      });
      return { success: result.success, error: result.success ? undefined : result.error };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Batal',
      fallbackLabel: 'Gunakan Kode Sandi',
      disableDeviceFallback: false,
    });

    return {
      success: result.success,
      error: result.success ? undefined : result.error,
    };
  } catch (err) {
    console.warn('[Biometrics] Authentication error:', err);
    return {
      success: false,
      error: (err as Error)?.message || 'Autentikasi gagal',
    };
  }
}
