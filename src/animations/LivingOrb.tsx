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
  size = 170,
  reduceMotion = false,
}) => {
  const scale = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.4);
  const coreDistortion = useSharedValue(0);
  const secondaryRingScale = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(scale);
    cancelAnimation(ringScale);
    cancelAnimation(ringOpacity);
    cancelAnimation(coreDistortion);
    cancelAnimation(secondaryRingScale);

    if (reduceMotion) {
      scale.value = 1;
      ringScale.value = 1.15;
      ringOpacity.value = 0.3;
      coreDistortion.value = 0;
      secondaryRingScale.value = 1.25;
      return;
    }

    if (zone === 'CLEAR') {
      // Harmonic slow breathing (3.6s cycle)
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
          withTiming(1.0, { duration: 1800, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        true
      );
      ringScale.value = withRepeat(
        withTiming(1.36, { duration: 3600, easing: Easing.out(Easing.cubic) }),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.45, { duration: 1800 }),
          withTiming(0.08, { duration: 1800 })
        ),
        -1,
        true
      );
      secondaryRingScale.value = withRepeat(
        withTiming(1.5, { duration: 4200, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
      coreDistortion.value = 0;
    } else if (zone === 'WARNING') {
      // Vigilant, contracted pulse (2.2s cycle)
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.95, { duration: 1100, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
      ringScale.value = withRepeat(
        withTiming(1.4, { duration: 2200, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1100 }),
          withTiming(0.12, { duration: 1100 })
        ),
        -1,
        true
      );
      coreDistortion.value = withRepeat(
        withSequence(withTiming(-2, { duration: 1100 }), withTiming(2, { duration: 1100 })),
        -1,
        true
      );
    } else if (zone === 'DANGER') {
      // Asymmetric magnetic tension (1.4s cycle)
      scale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 700, easing: Easing.bezier(0.2, 0, 0, 1) }),
          withTiming(0.92, { duration: 700, easing: Easing.bezier(0.2, 0, 0, 1) })
        ),
        -1,
        true
      );
      ringScale.value = withRepeat(
        withTiming(1.5, { duration: 1400, easing: Easing.out(Easing.exp) }),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.75, { duration: 700 }),
          withTiming(0.15, { duration: 700 })
        ),
        -1,
        true
      );
      coreDistortion.value = withRepeat(
        withSequence(withTiming(-5, { duration: 700 }), withTiming(5, { duration: 700 })),
        -1,
        true
      );
    } else if (zone === 'CRITICAL') {
      // Visceral double-beat systolic pulse (0.85s cycle)
      scale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 380, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
          withTiming(0.86, { duration: 470, easing: Easing.bezier(0.4, 0, 0.2, 1) })
        ),
        -1,
        true
      );
      ringScale.value = withRepeat(
        withTiming(1.68, { duration: 850, easing: Easing.out(Easing.exp) }),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.95, { duration: 380 }),
          withTiming(0.2, { duration: 470 })
        ),
        -1,
        true
      );
      coreDistortion.value = withRepeat(
        withSequence(withTiming(-8, { duration: 425 }), withTiming(8, { duration: 425 })),
        -1,
        true
      );
    }
  }, [zone, reduceMotion]);

  const animatedOrbStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotateZ: `${coreDistortion.value}deg` },
      ],
    };
  });

  const animatedRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: ringScale.value }],
      opacity: ringOpacity.value,
    };
  });

  const getColors = () => {
    switch (zone) {
      case 'CLEAR':
        return {
          core: COLORS.clear.primary,
          accent: COLORS.clear.accent,
          deep: COLORS.clear.deep,
          glow: COLORS.clear.glow,
          border: COLORS.clear.border,
        };
      case 'WARNING':
        return {
          core: COLORS.warning.primary,
          accent: COLORS.warning.accent,
          deep: COLORS.warning.deep,
          glow: COLORS.warning.glow,
          border: COLORS.warning.border,
        };
      case 'DANGER':
        return {
          core: COLORS.danger.primary,
          accent: COLORS.danger.accent,
          deep: COLORS.danger.deep,
          glow: COLORS.danger.glow,
          border: COLORS.danger.border,
        };
      case 'CRITICAL':
        return {
          core: COLORS.critical.primary,
          accent: COLORS.critical.accent,
          deep: COLORS.critical.deep,
          glow: COLORS.critical.glow,
          border: COLORS.critical.border,
        };
    }
  };

  const colors = getColors();
  const radius = size / 2;

  return (
    <View style={[styles.container, { width: size * 1.6, height: size * 1.6 }]}>
      {/* Outer Harmonic Resonance Ring */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: size * 1.35,
            height: size * 1.35,
            borderRadius: (size * 1.35) / 2,
            borderColor: colors.border,
          },
          animatedRingStyle,
        ]}
      />

      {/* Atmospheric Halo / Aura */}
      <View
        style={[
          styles.glowAura,
          {
            width: size * 1.15,
            height: size * 1.15,
            borderRadius: (size * 1.15) / 2,
            backgroundColor: colors.glow,
          },
        ]}
      />

      {/* Fissure Stress Ring (Danger / Critical) */}
      {(zone === 'DANGER' || zone === 'CRITICAL') && (
        <View
          style={[
            styles.fissureRing,
            {
              width: size * 1.2,
              height: size * 1.2,
              borderRadius: (size * 1.2) / 2,
              borderColor: colors.core,
            },
          ]}
        />
      )}

      {/* Living Core Sphere */}
      <Animated.View
        style={[
          styles.coreSphere,
          {
            width: size,
            height: size,
            borderRadius: radius,
            backgroundColor: colors.accent,
            shadowColor: colors.core,
          },
          animatedOrbStyle,
        ]}
      >
        {/* Deep Density Nucleus */}
        <View
          style={[
            styles.nucleus,
            {
              width: size * 0.58,
              height: size * 0.58,
              borderRadius: (size * 0.58) / 2,
              backgroundColor: colors.core,
            },
          ]}
        />

        {/* Specular Caustic Glint */}
        <View
          style={[
            styles.specularGlint,
            {
              width: size * 0.38,
              height: size * 0.28,
              borderRadius: (size * 0.38) / 2,
            },
          ]}
        />

        {/* Sub-surface Dark Matter Core */}
        <View
          style={[
            styles.innerDarkCore,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: (size * 0.28) / 2,
              backgroundColor: colors.deep,
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
    borderWidth: 1.5,
  },
  glowAura: {
    position: 'absolute',
    opacity: 0.7,
  },
  fissureRing: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    opacity: 0.65,
  },
  coreSphere: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  nucleus: {
    position: 'absolute',
    opacity: 0.9,
  },
  specularGlint: {
    position: 'absolute',
    top: '12%',
    left: '18%',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    transform: [{ rotate: '-25deg' }],
  },
  innerDarkCore: {
    position: 'absolute',
    opacity: 0.8,
  },
});
