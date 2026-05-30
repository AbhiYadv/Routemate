import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

export default function MapComponent({ userLocation, markers = [], polyline = [] }: any) {
  const initialRegion = userLocation ? {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  } : (markers.length > 0 ? {
    latitude: markers[0].latitude,
    longitude: markers[0].longitude,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  } : {
    latitude: 12.9352, // Default to Bangalore/Koramangala
    longitude: 77.6245,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFillObject}
      initialRegion={initialRegion}
      showsUserLocation={true}
      showsMyLocationButton={false}
    >
      {markers.map((m: any, i: number) => {
        let bgColor = '#0F172A'; // default dark
        let iconName: any = 'location';

        if (m.type === 'pooler') { bgColor = '#9333ea'; iconName = 'person'; }
        if (m.type === 'ride') { bgColor = '#22C55E'; iconName = 'car'; }
        if (m.type === 'pickup') { bgColor = '#1d4ed8'; iconName = 'location'; }
        if (m.type === 'drop') { bgColor = '#ea580c'; iconName = 'flag'; }

        return (
          <Marker
            key={m.id || i}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={m.title}
            description={m.subtitle}
          >
            <View style={{ backgroundColor: bgColor, padding: 6, borderRadius: 20, borderWidth: 2, borderColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}>
              <Ionicons name={iconName} size={16} color="white" />
            </View>
          </Marker>
        );
      })}

      {polyline.length > 0 && (
        <Polyline 
          coordinates={polyline} 
          strokeColor="#1d4ed8" 
          strokeWidth={4} 
          lineDashPattern={[1]}
        />
      )}
    </MapView>
  );
}
