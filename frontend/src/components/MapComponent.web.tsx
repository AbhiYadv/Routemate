import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';

export default function MapComponent({ userLocation, markers = [], polyline = [] }: any) {
  return (
    <View style={tw`flex-1 justify-center items-center bg-gray-100`}>
      <Ionicons name="map" size={64} color="#94a3b8" />
      <Text style={tw`mt-4 font-bold text-gray-700`}>Map Preview (Web Fallback)</Text>
      
      <View style={tw`mt-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200`}>
        <Text style={tw`text-xs text-gray-500 mb-1`}>Debug Data:</Text>
        <Text style={tw`text-xs text-gray-700`}>User Location: {userLocation ? 'Yes' : 'No'}</Text>
        <Text style={tw`text-xs text-gray-700`}>Markers: {markers.length}</Text>
        <Text style={tw`text-xs text-gray-700`}>Polyline Points: {polyline.length}</Text>
      </View>
    </View>
  );
}
