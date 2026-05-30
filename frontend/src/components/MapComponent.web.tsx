import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';

interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  type: 'ride' | 'pooler' | 'pickup' | 'drop' | string;
  title?: string;
  subtitle?: string;
}

const markerConfig: Record<string, { icon: any; color: string; label: string }> = {
  ride: { icon: 'car-outline', color: '#22C55E', label: 'Ride' },
  pooler: { icon: 'person-outline', color: '#9333ea', label: 'Pooler' },
  pickup: { icon: 'location-outline', color: '#2563EB', label: 'Pickup' },
  drop: { icon: 'flag-outline', color: '#ea580c', label: 'Drop' },
};

export default function MapComponent({ userLocation, markers = [], polyline = [] }: {
  userLocation?: { latitude: number; longitude: number } | null;
  markers?: Marker[];
  polyline?: { latitude: number; longitude: number }[];
}) {
  const rideMarkers = markers.filter((m) => m.type === 'ride');
  const poolerMarkers = markers.filter((m) => m.type === 'pooler');
  const routeMarkers = markers.filter((m) => m.type === 'pickup' || m.type === 'drop');

  return (
    <View style={tw`flex-1 bg-slate-100`}>
      {/* Header */}
      <View style={tw`bg-white px-4 py-3 flex-row items-center border-b border-gray-100`}>
        <View style={tw`bg-blue-50 w-8 h-8 rounded-full items-center justify-center mr-3`}>
          <Ionicons name="map-outline" size={18} color="#2563EB" />
        </View>
        <View>
          <Text style={tw`text-[#0F172A] font-bold text-sm`}>Live Network Map</Text>
          <Text style={tw`text-gray-400 text-xs`}>Web preview — full map on mobile app</Text>
        </View>
        <View style={tw`ml-auto flex-row items-center`}>
          <View style={tw`w-2 h-2 bg-green-500 rounded-full mr-1`} />
          <Text style={tw`text-green-600 text-xs font-semibold`}>{markers.length} active</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={tw`p-4`}>
        {/* Route summary */}
        {routeMarkers.length > 0 && (
          <View style={tw`bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm`}>
            <Text style={tw`font-bold text-[#0F172A] mb-3`}>Your Route</Text>
            {routeMarkers.map((m, i) => {
              const cfg = markerConfig[m.type] || markerConfig.pickup;
              return (
                <View key={m.id || i} style={tw`flex-row items-center mb-2`}>
                  <View style={[tw`w-8 h-8 rounded-full items-center justify-center mr-3`, { backgroundColor: `${cfg.color}20` }]}>
                    <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                  </View>
                  <View>
                    <Text style={tw`text-[#0F172A] font-semibold text-sm`}>{m.title || cfg.label}</Text>
                    {m.subtitle && <Text style={tw`text-gray-400 text-xs`}>{m.subtitle}</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Ride markers */}
        {rideMarkers.length > 0 && (
          <View style={tw`bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm`}>
            <Text style={tw`font-bold text-[#0F172A] mb-3`}>
              Rides Near You ({rideMarkers.length})
            </Text>
            {rideMarkers.map((m, i) => (
              <View key={m.id || i} style={tw`flex-row items-center py-2 ${i < rideMarkers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <View style={tw`w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3`}>
                  <Ionicons name="car-outline" size={16} color="#22C55E" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[#0F172A] font-semibold text-sm`}>{m.title || 'Driver'}</Text>
                  {m.subtitle && <Text style={tw`text-gray-400 text-xs`}>{m.subtitle}</Text>}
                </View>
                <Text style={tw`text-gray-400 text-xs`}>
                  {m.latitude.toFixed(3)}, {m.longitude.toFixed(3)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Pooler markers */}
        {poolerMarkers.length > 0 && (
          <View style={tw`bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm`}>
            <Text style={tw`font-bold text-[#0F172A] mb-3`}>
              Poolers ({poolerMarkers.length})
            </Text>
            {poolerMarkers.map((m, i) => (
              <View key={m.id || i} style={tw`flex-row items-center py-2 ${i < poolerMarkers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <View style={tw`w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-3`}>
                  <Ionicons name="person-outline" size={16} color="#9333ea" />
                </View>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-[#0F172A] font-semibold text-sm`}>{m.title || 'Pooler'}</Text>
                  {m.subtitle && <Text style={tw`text-gray-400 text-xs`}>{m.subtitle}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {markers.length === 0 && (
          <View style={tw`items-center mt-12 px-4`}>
            <Ionicons name="location-outline" size={48} color="#94a3b8" />
            <Text style={tw`text-gray-600 font-bold mt-4 text-center`}>No markers yet</Text>
            <Text style={tw`text-gray-400 text-sm text-center mt-2`}>
              Search for rides or enable location to see the live network.
            </Text>
          </View>
        )}

        {userLocation && (
          <View style={tw`bg-blue-50 rounded-xl p-3 flex-row items-center border border-blue-100`}>
            <Ionicons name="navigate-outline" size={16} color="#2563EB" style={tw`mr-2`} />
            <Text style={tw`text-blue-700 text-xs font-semibold`}>
              Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
