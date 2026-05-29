import { View, Text, TouchableOpacity, ScrollView, Platform, SafeAreaView, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { api } from '../../../src/utils/api';

export default function RideDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/rides/${id}`);
        setRide(data);
      } catch (e) {
        console.log(e);
      }
      setLoading(false);
    })();
  }, [id]);

  const handleBook = async () => {
    setBooking(true);
    try {
      await api.post(`/rides/${id}/book`);
      Alert.alert('Success', 'Ride booked successfully!', [
        { text: 'View My Rides', onPress: () => router.push('/(employee)/bookings') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Booking failed');
    }
    setBooking(false);
  };

  if (loading) return <View style={tw`flex-1 justify-center items-center`}><Text>Loading ride details...</Text></View>;
  if (!ride) return <View style={tw`flex-1 justify-center items-center`}><Text>Ride not found.</Text></View>;

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      
      {/* Top Map Placeholder */}
      <View style={tw`h-[35%] bg-gray-200 items-center justify-center relative`}>
        <Ionicons name="map" size={80} color="#cbd5e1" />
        <Text style={tw`text-gray-500 font-bold mt-2`}>Route Polyline Map</Text>
        <TouchableOpacity onPress={() => router.back()} style={tw`absolute top-4 left-4 bg-white w-10 h-10 rounded-full shadow-sm items-center justify-center`}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={tw`pb-10`}>
        {/* Pooler Summary */}
        <View style={tw`bg-white px-6 py-5 border-b border-gray-100 shadow-sm`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <TouchableOpacity onPress={() => router.push(`/(employee)/pooler/${ride.driver_user_id}`)} style={tw`flex-row items-center flex-1`}>
              <View style={tw`w-14 h-14 bg-gray-100 rounded-full items-center justify-center mr-3 border border-gray-200`}>
                <Ionicons name="person" size={28} color="#64748b" />
              </View>
              <View>
                <Text style={tw`text-xl font-extrabold text-[#0F172A]`}>{ride.driver?.name}</Text>
                <View style={tw`flex-row items-center mt-1`}>
                  <Ionicons name="star" size={14} color="#fbbf24" style={tw`mr-1`} />
                  <Text style={tw`text-gray-700 font-bold mr-2`}>{ride.pooler?.rating}</Text>
                  <Text style={tw`text-gray-500 text-xs`}>({ride.pooler?.review_count} reviews)</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <View style={tw`flex-row`}>
              <TouchableOpacity onPress={() => setShowCallModal(true)} style={tw`bg-green-100 w-10 h-10 rounded-full items-center justify-center mr-2`}>
                <Ionicons name="call" size={20} color="#16a34a" />
              </TouchableOpacity>
              <TouchableOpacity style={tw`bg-blue-100 w-10 h-10 rounded-full items-center justify-center`}>
                <Ionicons name="chatbubble" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={tw`flex-row flex-wrap gap-2`}>
            <View style={tw`bg-blue-50 px-3 py-1.5 rounded-full flex-row items-center border border-blue-100`}>
              <Ionicons name="shield-checkmark" size={14} color="#2563EB" style={tw`mr-1.5`} />
              <Text style={tw`text-blue-700 text-xs font-bold`}>{ride.company_name}</Text>
            </View>
            <View style={tw`bg-gray-100 px-3 py-1.5 rounded-full flex-row items-center`}>
              <Ionicons name="car" size={14} color="#475569" style={tw`mr-1.5`} />
              <Text style={tw`text-gray-700 text-xs font-bold`}>{ride.pooler?.vehicle_type}</Text>
            </View>
            <View style={tw`bg-green-50 px-3 py-1.5 rounded-full flex-row items-center border border-green-100`}>
              <Ionicons name="gift" size={14} color="#16a34a" style={tw`mr-1.5`} />
              <Text style={tw`text-green-700 text-xs font-bold`}>Fuel Voucher Eligible</Text>
            </View>
          </View>
        </View>

        {/* Route Transparency */}
        <View style={tw`px-6 pt-6`}>
          <Text style={tw`text-lg font-extrabold text-[#0F172A] mb-4`}>Route Details</Text>
          
          <View style={tw`bg-white rounded-2xl p-5 shadow-sm border border-gray-100`}>
            <View style={tw`flex-row justify-between mb-6 pb-4 border-b border-gray-100`}>
              <View>
                <Text style={tw`text-gray-500 text-xs mb-1`}>Match Score</Text>
                <Text style={tw`text-[#22C55E] font-extrabold text-xl`}>{ride.route_match_score}%</Text>
              </View>
              <View style={tw`items-center`}>
                <Text style={tw`text-gray-500 text-xs mb-1`}>Detour</Text>
                <Text style={tw`text-orange-600 font-extrabold text-xl`}>+{ride.detour_minutes} min</Text>
              </View>
              <View style={tw`items-end`}>
                <Text style={tw`text-gray-500 text-xs mb-1`}>Available Seats</Text>
                <Text style={tw`text-[#0F172A] font-extrabold text-xl`}>{ride.available_seats}/{ride.total_seats}</Text>
              </View>
            </View>

            {/* Timeline */}
            <Text style={tw`font-bold text-[#0F172A] mb-4`}>Planned Route & Stops</Text>
            {ride.stop_sequence?.map((stop: any, index: number) => (
              <View key={index} style={tw`flex-row mb-4 relative`}>
                {index !== ride.stop_sequence.length - 1 && (
                  <View style={tw`absolute left-3 top-6 w-0.5 h-full bg-gray-200`} />
                )}
                <View style={tw`w-6 h-6 rounded-full ${stop.type === 'PICKUP' ? 'bg-[#2563EB]' : 'bg-[#22C55E]'} items-center justify-center mr-4 mt-1 border-2 border-white z-10`}>
                  <View style={tw`w-2 h-2 rounded-full bg-white`} />
                </View>
                <View style={tw`flex-1 bg-[#F8FAFC] p-3 rounded-xl border border-gray-100`}>
                  <Text style={tw`font-bold text-[#0F172A]`}>{stop.area}</Text>
                  <Text style={tw`text-gray-500 text-xs mt-1`}>{stop.time} • Co-traveller {stop.type}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* AI Assist */}
        <View style={tw`px-6 mt-6`}>
          <TouchableOpacity style={tw`bg-purple-50 rounded-xl p-4 flex-row items-center border border-purple-100`}>
            <View style={tw`bg-purple-200 w-10 h-10 rounded-full items-center justify-center mr-3`}>
              <Ionicons name="sparkles" size={20} color="#9333ea" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-purple-900 font-bold`}>Ask AI about this ride</Text>
              <Text style={tw`text-purple-700 text-xs`}>Get route insights and pooler reliability.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9333ea" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Bottom Sticky Action */}
      <View style={tw`bg-white px-6 py-4 border-t border-gray-100 shadow-[0_-4px_6px_rgba(0,0,0,0.05)]`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <Text style={tw`text-gray-600 font-medium`}>{ride.current_passenger_count} passengers currently booked</Text>
          <Text style={tw`font-extrabold text-[#0F172A]`}>ETA: {new Date(ride.estimated_arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
        </View>
        <TouchableOpacity 
          style={tw`w-full bg-[#0F172A] py-4 rounded-xl items-center shadow-md ${ride.available_seats === 0 ? 'opacity-50' : ''}`}
          onPress={handleBook}
          disabled={ride.available_seats === 0 || booking}
        >
          <Text style={tw`text-white font-bold text-lg`}>{booking ? 'Booking...' : ride.available_seats === 0 ? 'Full' : 'Book Seat'}</Text>
        </TouchableOpacity>
      </View>

      {/* Call Modal Simulation */}
      <Modal visible={showCallModal} transparent animationType="slide">
        <View style={tw`flex-1 bg-black/90 justify-center items-center p-6`}>
           <View style={tw`w-24 h-24 bg-gray-700 rounded-full mb-6 items-center justify-center`}>
              <Ionicons name="person" size={48} color="white" />
           </View>
           <Text style={tw`text-white text-2xl font-bold mb-2`}>{ride.driver?.name}</Text>
           <Text style={tw`text-gray-400 text-lg mb-12`}>Demo call active... 00:12</Text>
           
           <View style={tw`flex-row gap-6`}>
             <TouchableOpacity style={tw`w-16 h-16 bg-gray-800 rounded-full items-center justify-center`}>
               <Ionicons name="mic-off" size={28} color="white" />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setShowCallModal(false)} style={tw`w-16 h-16 bg-red-600 rounded-full items-center justify-center shadow-lg`}>
               <Ionicons name="call" size={28} color="white" style={{transform: [{rotate: '135deg'}]}} />
             </TouchableOpacity>
           </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
