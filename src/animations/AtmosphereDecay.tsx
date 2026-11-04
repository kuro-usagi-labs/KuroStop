import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ConsequenceZone } from '../types';

interface AtmosphereDecayProps {
  zone: ConsequenceZone;
  reduceMotion?: boolean;
}

export const AtmosphereDecay: React.FC<AtmosphereDecayProps> = ({
  zone,
  reduceMotion = false,
}) => {
  const overlayOpacity = useSharedValue(0);
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    let targetOverlay = 0;
    let targetBorder = 0;

    switch (zone) {
      case 'CLEAR':
        targetOverlay = 0;
        targetBorder = 0;
        break;
      case 'WARNING':
        targetOverlay = 0.08;
        targetBorder = 0.25;
        break;
      case 'DANGER':
        targetOverlay = 0.16;
        targetBorder = 0.55;
        break;
      case 'CRITICAL':
        targetOverlay = 0.28;
        targetBorder = 0.85;
        break;
    }

    if (reduceMotion) {
      overlayOpacity.value = targetOverlay;
      borderOpacity.value = targetBorder;
    } else {
      overlayOpacity.value = withTiming(targetOverlay, {
        duration: 800,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      });
      borderOpacity.value = withTiming(targetBorder, {
        duration: 800,
        easing: Easing.bezier(0.25, 1, 0.5, 1),
      });
    }
  }, [zone, reduceMotion]);

  const animatedOverlayStyle = useAnimatedStyle(() => {
    let backgroundColor = 'transparent';
    if (zone === 'WARNING') backgroundColor = '#E9AA40';
    if (zone === 'DANGER') backgroundColor = '#E76B40';
    if (zone === 'CRITICAL') backgroundColor = '#922539';

    return {
      opacity: overlayOpacity.value,
      backgroundColor,
    };
  });

  const animatedBorderStyle = useAnimatedStyle(() => {
    let borderColor = 'transparent';
    if (zone === 'WARNING') borderColor = '#F6DAB0';
    if (zone === 'DANGER') borderColor = '#F9C8B5';
    if (zone === 'CRITICAL') borderColor = '#D83D52';

    return {
      opacity: borderOpacity.value,
      borderColor,
    };
  });

  if (zone === 'CLEAR') {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Ambient tint overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedOverlayStyle]} />
      {/* Screen edge consequence vignette */}
      <Animated.View
        style={[
          styles.vignetteBorder,
          zone === 'CRITICAL' && styles.criticalBorder,
          animatedBorderStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  vignetteBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderWidth: 2,
  },
  criticalBorder: {
    borderWidth: 4,
  },
});
