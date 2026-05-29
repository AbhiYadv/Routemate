import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';

export default function MapComponent({ location }: any) {
  return (
    <View style={tw`flex-1 justify-center items-center bg-green-50`}>
      <Ionicons name="map" size={64} color="#16a34a" />
      <Text style={tw`mt-4 font-bold text-gray-700`}>Map is active on Mobile Device.</Text>
      {location && (
        <Text style={tw`text-gray-500 text-center mt-2 px-6`}>
          Got location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
        </Text>
      )}
    </View>
  );
}
