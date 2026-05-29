import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../../src/utils/api';

// Metro will resolve MapComponent.native or MapComponent.web based on platform
import MapComponent from '../../src/components/MapComponent';

export default function LiveMap() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location is off. You can still search rides manually.');
        setLoading(false);
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        
        await api.post('/location/update', {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
      } catch (err) {
        console.log(err);
      }
      setLoading(false);
    })();
  }, []);

  const handleRecenter = async () => {
    if (!location) return;
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={tw`mt-4 text-gray-600`}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`absolute top-10 left-4 z-10 flex-row`}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={tw`bg-white w-10 h-10 rounded-full shadow-md items-center justify-center`}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {errorMsg ? (
        <View style={tw`flex-1 justify-center items-center p-6 bg-gray-50`}>
          <Ionicons name="location-outline" size={48} color="#9ca3af" />
          <Text style={tw`text-gray-600 text-center mt-4 text-base`}>{errorMsg}</Text>
          <TouchableOpacity 
            style={tw`mt-6 bg-gray-900 px-6 py-3 rounded-xl`}
            onPress={() => router.push('/(employee)')}
          >
            <Text style={tw`text-white font-bold`}>Go to Manual Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={tw`flex-1 relative`}>
          <MapComponent location={location} />
          
          <TouchableOpacity 
            onPress={handleRecenter}
            style={tw`absolute bottom-40 right-4 bg-white w-12 h-12 rounded-full shadow-lg items-center justify-center z-10`}
          >
            <Ionicons name="locate" size={24} color="#16a34a" />
          </TouchableOpacity>

          <View style={tw`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-xl px-6 py-6 border-t border-gray-100 z-10`}>
            <Text style={tw`text-gray-900 font-bold text-lg mb-2`}>Live Commute Network</Text>
            <Text style={tw`text-gray-500 text-sm mb-4`}>
              Your location helps us show verified poolers, pickup points, and live ride tracking near you.
            </Text>
            <TouchableOpacity 
              style={tw`w-full bg-green-600 py-4 rounded-xl items-center`}
              onPress={() => router.push('/(employee)')}
            >
              <Text style={tw`text-white font-bold text-lg`}>Find nearby rides</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
