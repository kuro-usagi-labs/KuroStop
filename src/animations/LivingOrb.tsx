import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { ConsequenceZone } from '../types';
import { COLORS } from '../theme/colors';

interface LivingOrbProps {
  zone: ConsequenceZone;
  size?: number;
  reduceMotion?: boolean;
}

export const LivingOrb: React.FC<LivingOrbProps> = ({
  zone,
  size = 180,
  reduceMotion = false,
}) => {
  const scale = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.4);
  const distortionRotate = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(ringScale);
    cancelAnimation(ringOpacity);
    cancelAnimation(distortionRotate);

    if (reduceMotion) {
      scale.value = 1;
      ringScale.value = 1.1;
      ringOpacity.value = 0.3;
      distortionRotate.value = 0;
      return;
    }

    if (zone === 'CLEAR') {
      // Gentle, calm breathing (3.5s cycle)
      scale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 1750, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: 1750, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
      ringScale.value = withRepeat(
        withTiming(1.28, { duration: 3500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 1750, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.1, { duration: 1750, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      );
      distortionRotate.value = 0;
    } else if (zone === 'WARNING') {
      // Slightly tighter, vigilant pulse (2.2s cycle)
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.96, { duration: 1100, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
      ringScale.value = withRepeat(
        withTiming(1.35, { duration: 2200, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1100 }),
          withTiming(0.15, { duration: 1100 })
        ),
        -1,
        true
      );
      distortionRotate.value = 0;
    } else if (zone === 'DANGER') {
      // Aggressive tense pulse (1.4s cycle) with subtle oscillation
      scale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 700, easing: Easing.bezier(0.2, 0, 0, 1) }),
          withTiming(0.92, { duration: 700, easing: Easing.bezier(0.2, 0, 0, 1) })
        ),
        -1,
        true
      );
      ringScale.value = withRepeat(
        withTiming(1.45, { duration: 1400, easing: Easing.out(Easing.cubic) }),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.75, { duration: 700 }),
          withTiming(0.2, { duration: 700 })
        ),
        -1,
        true
      );
      distortionRotate.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 700 }),
          withTiming(4, { duration: 700 })
        ),
        -1,
        true
      );
    } else if (zone === 'CRITICAL') {
      // Unsettling, rapid cardiac tension pulse (0.9s cycle)
      scale.value = withRepeat(
        withSequence(
          withTiming(1.16, { duration: 450, easing: Easing.bezier(0.3, 0, 0.2, 1) }),
          withTiming(0.88, { duration: 450, easing: Easing.bezier(0.3, 0, 0.2, 1) })
        ),
        -1,
        true
      );
      ringScale.value = withRepeat(
        withTiming(1.6, { duration: 900, easing: Easing.out(Easing.exp) }),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 450 }),
          withTiming(0.25, { duration: 450 })
        ),
        -1,
        true
      );
      distortionRotate.value = withRepeat(
        withSequence(
          withTiming(-7, { duration: 450 }),
          withTiming(7, { duration: 450 })
        ),
        -1,
        true
      );
    }
  }, [zone, reduceMotion]);

  const animatedOrbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotateZ: `${distortionRotate.value}deg` },
      ],
    };
  });

  const animatedRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: ringScale.value }],
      opacity: ringOpacity.value,
    };
  });

  const getOrbColors = () => {
    switch (zone) {
      case 'CLEAR':
        return {
          core: COLORS.clear.primary,
          glow: COLORS.clear.glow,
          ring: COLORS.clear.border,
          inner: COLORS.clear.accent,
        };
      case 'WARNING':
        return {
          core: COLORS.warning.primary,
          glow: COLORS.warning.glow,
          ring: COLORS.warning.border,
          inner: COLORS.warning.accent,
        };
      case 'DANGER':
        return {
          core: COLORS.danger.primary,
          glow: COLORS.danger.glow,
          ring: COLORS.danger.border,
          inner: COLORS.danger.accent,
        };
      case 'CRITICAL':
        return {
          core: COLORS.critical.deep,
          glow: COLORS.critical.glow,
          ring: COLORS.critical.border,
          inner: COLORS.critical.accent,
        };
    }
  };

  const colors = getOrbColors();
  const radius = size / 2;

  return (
    <View style={[styles.container, { width: size * 1.5, height: size * 1.5 }]}>
      {/* Outer Pulse Ring */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: size * 1.3,
            height: size * 1.3,
            borderRadius: (size * 1.3) / 2,
            borderColor: colors.ring,
          },
          animatedRingStyle,
        ]}
      />

      {/* Secondary Warning/Critical Ring */}
      {(zone === 'DANGER' || zone === 'CRITICAL') && (
        <View
          style={[
            styles.fractureRing,
            {
              width: size * 1.15,
              height: size * 1.15,
              borderRadius: (size * 1.15) / 2,
              borderColor: colors.core,
            },
          ]}
        />
      )}

      {/* Living Core Orb */}
      <Animated.View
        style={[
          styles.coreOrb,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: colors.inner,
            shadowColor: colors.core,
          },
          animatedOrbStyle,
        ]}
      >
        {/* Core highlight reflection */}
        <View
          style={[
            styles.highlight,
            {
              width: size * 0.35,
              height: size * 0.35,
              borderRadius: (size * 0.35) / 2,
            },
          ]}
        />

        {/* Inner tension core */}
        <View
          style={[
            styles.innerCore,
            {
              width: size * 0.55,
              height: size * 0.55,
              borderRadius: (size * 0.55) / 2,
              backgroundColor: colors.core,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  fractureRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.65,
  },
  coreOrb: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  highlight: {
    position: 'absolute',
    top: '12%',
    left: '18%',
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  innerCore: {
    opacity: 0.85,
  },
});
