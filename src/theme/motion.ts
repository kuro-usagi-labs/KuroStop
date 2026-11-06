import { Easing, FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

/** Motion vocabulary — short, physical, never decorative. */
export const spring = {
  press: { damping: 18, stiffness: 320, mass: 0.6 },
  snappy: { damping: 20, stiffness: 240, mass: 0.8 },
  soft: { damping: 22, stiffness: 120, mass: 1 },
  stamp: { damping: 11, stiffness: 180, mass: 0.9 },
} as const;

export const ease = {
  out: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
};

/** Layout/entering presets that collapse to nothing under Reduce Motion. */
export function motionPresets(reduce: boolean) {
  return {
    enter: reduce ? FadeIn.duration(120) : FadeInDown.duration(320).easing(ease.out),
    enterDelay: (i: number) =>
      reduce ? FadeIn.duration(120) : FadeInDown.duration(360).delay(40 + i * 45).easing(ease.out),
    fade: FadeIn.duration(reduce ? 100 : 220),
    exit: FadeOut.duration(reduce ? 80 : 160),
    layout: reduce ? undefined : LinearTransition.springify().damping(20).stiffness(200),
  };
}
