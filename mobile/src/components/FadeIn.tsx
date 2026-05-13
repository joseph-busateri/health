/**
 * FadeIn Component
 * Performance-optimized fade-in animation using native driver
 */

import React, { memo, useEffect, useRef } from 'react';
import { Animated, ViewStyle, StyleProp } from 'react-native';
import { animation } from '../theme/tokens';

interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}

const FadeIn: React.FC<FadeInProps> = memo(({
  children,
  duration = animation.duration.normal,
  delay = 0,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true, // Performance optimization
    }).start();
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {children}
    </Animated.View>
  );
});

FadeIn.displayName = 'FadeIn';

export default FadeIn;
