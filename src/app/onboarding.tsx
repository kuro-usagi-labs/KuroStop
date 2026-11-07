import { useCallback, useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';

import OnboardingScreen from '@/components/onboarding/OnboardingScreen';
import { useApp } from '@/data/store';
import { DEFAULT_SETTINGS } from '@/data/types';

/**
 * Onboarding route.
 *
 * Keeps the automation surface (deep link `kurostop://onboarding?action=quick-start`)
 * in the route layer while the wizard itself lives in components/onboarding.
 * Finishing onboarding is handled by the root Stack guard, not by redirects.
 */
export default function OnboardingRoute() {
  const { state, actions } = useApp();
  const params = useLocalSearchParams<{ action?: string }>();
  const handlingRef = useRef(false);

  const quickStart = useCallback(async () => {
    if (handlingRef.current) return;
    handlingRef.current = true;
    try {
      await actions.completeOnboarding(DEFAULT_SETTINGS, false);
    } catch (err) {
      console.error('[KuroStop] Quick-start onboarding failed:', err);
      handlingRef.current = false;
    }
  }, [actions]);

  // Route param form: /onboarding?action=quick-start
  useEffect(() => {
    if (params.action === 'quick-start' && state.isReady && !state.onboarded) {
      void quickStart();
    }
  }, [params.action, state.isReady, state.onboarded, quickStart]);

  // Cold-start / background URL form: kurostop://onboarding?action=quick-start
  useEffect(() => {
    const sub = Linking.addEventListener('url', (event) => {
      const parsed = Linking.parse(event.url);
      if (parsed.queryParams?.action === 'quick-start') {
        void quickStart();
      }
    });
    return () => sub.remove();
  }, [quickStart]);

  return <OnboardingScreen />;
}
