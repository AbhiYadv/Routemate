import { View, Text, TouchableOpacity, ScrollView, Platform, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../../src/utils/api';

export default function Bookings() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Upcoming' | 'Active' | 'Completed' | 'Cancelled'>('Upcoming');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/my-bookings');
      setBookings(data || []);
    } catch (err) {
      console.log('Error fetching bookings', err);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  const handleCancel = (bookingId: string) => {
    Alert.alert('Cancel Ride', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      { 
        text: 'Yes, Cancel', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post(`/bookings/${bookingId}/cancel`);
            Alert.alert('Success', 'Your booking has been cancelled.');
            fetchBookings();
          } catch (e: any) {
            Alert.alert('Error', e.response?.data?.detail || 'Failed to cancel');
          }
        }
      }
    ]);
  };

  // Filter logic
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'Upcoming') return b.status === 'CONFIRMED' || b.status === 'UPCOMING';
    if (activeTab === 'Active') return b.status === 'ACTIVE';
    if (activeTab === 'Completed') return b.status === 'COMPLETED';
    if (activeTab === 'Cancelled') return b.status === 'CANCELLED';
    return false;
  });

  const TabButton = ({ title }: { title: any }) => (
    <TouchableOpacity 
      style={tw`px-4 py-2 ${activeTab === title ? 'border-b-2 border-[#16a34a]' : ''}`}
      onPress={() => setActiveTab(title)}
    >
      <Text style={tw`${activeTab === title ? 'text-[#16a34a] font-bold' : 'text-gray-500 font-medium'}`}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`bg-white px-6 py-4 shadow-sm z-10 flex-row justify-between items-center`}>
        <Text style={tw`text-[#0F172A] font-extrabold text-2xl`}>My Rides</Text>
        <TouchableOpacity
          style={tw`w-11 h-11 bg-[#F8FAFC] rounded-full border border-gray-100 items-center justify-center`}
          accessibilityRole="button"
          accessibilityLabel="Ride history"
        >
          <Ionicons name="time-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <View style={tw`bg-white border-b border-gray-100 flex-row`}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`px-2`}>
          <TabButton title="Upcoming" />
          <TabButton title="Active" />
          <TabButton title="Completed" />
          <TabButton title="Cancelled" />
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={tw`p-6 pb-20`}>
        {loading ? (
          <View style={tw`items-center justify-center mt-10`}>
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={tw`items-center justify-center mt-20`}>
            <View style={tw`w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6`}>
              <Ionicons name="car-sport-outline" size={48} color="#94a3b8" />
            </View>
            <Text style={tw`text-xl font-bold text-[#0F172A] mb-2`}>You have no {activeTab.toLowerCase()} rides.</Text>
            <Text style={tw`text-gray-500 text-center mb-8 px-6`}>
              Search for a trusted ride to work and your bookings will appear here.
            </Text>
            <TouchableOpacity 
              style={tw`bg-[#16a34a] px-8 py-4 rounded-xl shadow-sm`}
              onPress={() => router.push('/(employee)/search')}
            >
              <Text style={tw`text-white font-bold text-lg`}>Find a Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredBookings.map((b, idx) => (
            <View key={idx} style={tw`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4`}>
              <View style={tw`flex-row justify-between items-start mb-4`}>
                <View style={tw`flex-row items-center flex-1`}>
                  <View style={tw`w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3 overflow-hidden border border-gray-200`}>
                    {b.ride?.driver_avatar ? (
                      <View style={tw`w-full h-full bg-gray-200`} />
                    ) : (
                      <Ionicons name="person" size={20} color="#64748b" />
                    )}
                  </View>
                  <View>
                    <Text style={tw`font-bold text-[#0F172A] text-base`}>{b.ride?.driver_name || 'Pooler'}</Text>
                    <View style={tw`flex-row items-center`}>
                      <Ionicons name="shield-checkmark" size={12} color="#16a34a" style={tw`mr-1`} />
                      <Text style={tw`text-green-700 text-xs font-semibold`}>{b.ride?.company_name}</Text>
                    </View>
                  </View>
                </View>
                <View style={tw`px-2 py-1 rounded bg-${b.status === 'CONFIRMED' ? 'green' : b.status === 'CANCELLED' ? 'red' : 'gray'}-50`}>
                  <Text style={tw`text-${b.status === 'CONFIRMED' ? 'green' : b.status === 'CANCELLED' ? 'red' : 'gray'}-700 text-[10px] font-bold`}>{b.status}</Text>
                </View>
              </View>

              <View style={tw`bg-[#F8FAFC] rounded-xl p-4 border border-gray-100 mb-4`}>
                <View style={tw`flex-row items-center mb-2`}>
                  <View style={tw`w-2 h-2 rounded-full bg-[#16a34a] mr-3`} />
                  <Text style={tw`text-[#0F172A] font-semibold text-sm`}>{b.ride?.origin_area}</Text>
                </View>
                <View style={tw`flex-row items-center`}>
                  <View style={tw`w-2 h-2 rounded-full bg-[#22C55E] mr-3`} />
                  <Text style={tw`text-[#0F172A] font-semibold text-sm`}>{b.ride?.destination_area}</Text>
                </View>
                <View style={tw`w-full h-px bg-gray-200 my-3`} />
                <View style={tw`flex-row justify-between`}>
                  <Text style={tw`text-gray-500 text-xs font-medium`}>
                    Date: {new Date(b.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={tw`text-[#0F172A] text-xs font-extrabold`}>
                    ETA: {b.ride?.estimated_arrival_time ? new Date(b.ride.estimated_arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                  </Text>
                </View>
              </View>

              <View style={tw`flex-row gap-3`}>
                {b.status === 'CONFIRMED' && (
                  <TouchableOpacity 
                    style={tw`flex-1 bg-red-50 border border-red-100 py-3 rounded-xl items-center`}
                    onPress={() => handleCancel(b.id)}
                  >
                    <Text style={tw`text-red-600 font-bold`}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={tw`flex-1 bg-[#0F172A] py-3 rounded-xl items-center shadow-sm`}
                  onPress={() => router.push(`/(employee)/ride/${b.ride_id}`)}
                >
                  <Text style={tw`text-white font-bold`}>View Details</Text>
                </TouchableOpacity>
              </View>

            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
