import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

export default function Logo({ size = 'large' }: { size?: 'small' | 'medium' | 'large' }) {
  const dimensions = size === 'large' ? 88 : size === 'medium' ? 60 : 36;
  const iconSize = size === 'large' ? 44 : size === 'medium' ? 30 : 18;
  const badgeSize = size === 'large' ? 22 : size === 'medium' ? 16 : 12;

  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={[tw`items-center justify-center rounded-full bg-white shadow-sm border border-gray-100`, { width: dimensions, height: dimensions }]}>
      {/* Circular motion ring representing live tracking */}
      <Animated.View style={[tw`absolute rounded-full border-2 border-dashed border-[#22C55E] opacity-40`, { width: dimensions - 8, height: dimensions - 8 }, animatedStyle]} />
      
      {/* Route map pin background subtle effect */}
      <View style={[tw`absolute rounded-full bg-green-50`, { width: dimensions - 24, height: dimensions - 24 }]} />

      {/* Main Car Icon (Green) */}
      <Ionicons name="car-sport" size={iconSize} color="#22C55E" />
      
      {/* Trust/Verified Shield Badge (Blue) */}
      <View style={tw`absolute bottom-1 right-1 bg-white rounded-full shadow-sm`}>
        <Ionicons name="shield-checkmark" size={badgeSize} color="#16a34a" />
      </View>
    </View>
  );
}
