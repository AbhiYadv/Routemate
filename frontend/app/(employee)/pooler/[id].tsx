import { View, Text, TouchableOpacity, ScrollView, Platform, SafeAreaView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { api } from '../../../src/utils/api';

export default function PoolerProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [pooler, setPooler] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/poolers/${id}`);
        setPooler(data);
      } catch (e) {
        console.log(e);
      }
      setLoading(false);
    })();
  }, [id]);

  const showComingSoon = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} is currently under development.`);
  };

  const reviews = [
    "Reached on time and followed the planned route.",
    "Safe ride, good communication.",
    "Pickup was smooth.",
    "Great co-traveller, highly recommended."
  ];

  if (loading) return <View style={tw`flex-1 justify-center items-center bg-[#F8FAFC]`}><Text>Loading profile...</Text></View>;
  if (!pooler) return <View style={tw`flex-1 justify-center items-center bg-[#F8FAFC]`}><Text>Pooler not found.</Text></View>;

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`bg-white px-4 py-4 flex-row items-center shadow-sm z-10`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4 p-2`}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={tw`text-[#0F172A] font-bold text-lg`}>Pooler Profile</Text>
      </View>

      <ScrollView contentContainerStyle={tw`pb-10`}>
        <View style={tw`bg-[#0F172A] px-6 py-10 items-center rounded-b-[40px] shadow-md relative overflow-hidden`}>
          <View style={tw`w-28 h-28 bg-gray-200 rounded-full items-center justify-center mb-4 border-4 border-[#16a34a] shadow-lg`}>
             <Ionicons name="person" size={56} color="#64748b" />
          </View>
          <Text style={tw`text-white text-3xl font-extrabold mb-2`}>{pooler.user?.name}</Text>
          <View style={tw`bg-green-500/20 px-4 py-1.5 rounded-full flex-row items-center border border-green-500/50`}>
            <Ionicons name="shield-checkmark" size={16} color="#60a5fa" style={tw`mr-2`} />
            <Text style={tw`text-green-100 text-sm font-bold`}>Verified {pooler.company_name} Employee</Text>
          </View>
        </View>

        <View style={tw`px-6 -mt-8`}>
          <View style={tw`bg-white rounded-3xl p-5 shadow-lg border border-gray-100 flex-row justify-around`}>
            <View style={tw`items-center`}>
              <Text style={tw`text-[#0F172A] font-extrabold text-2xl`}>{pooler.rating}</Text>
              <View style={tw`flex-row items-center mt-1`}>
                 <Ionicons name="star" size={12} color="#fbbf24" style={tw`mr-1`} />
                 <Text style={tw`text-gray-500 text-xs font-bold`}>{pooler.review_count} Reviews</Text>
              </View>
            </View>
            <View style={tw`w-px h-full bg-gray-200`} />
            <View style={tw`items-center`}>
              <Text style={tw`text-[#0F172A] font-extrabold text-2xl`}>{pooler.completed_rides_count}</Text>
              <Text style={tw`text-gray-500 text-xs font-bold mt-1`}>Completed Rides</Text>
            </View>
            <View style={tw`w-px h-full bg-gray-200`} />
            <View style={tw`items-center`}>
              <Text style={tw`text-[#22C55E] font-extrabold text-2xl`}>{pooler.trust_score}</Text>
              <View style={tw`flex-row items-center mt-1`}>
                 <Ionicons name="checkmark-circle" size={12} color="#22C55E" style={tw`mr-1`} />
                 <Text style={tw`text-gray-500 text-xs font-bold`}>Trust Score</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={tw`px-6 pt-8`}>
          <Text style={tw`text-lg font-extrabold text-[#0F172A] mb-4`}>Commute Details</Text>
          
          <View style={tw`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4`}>
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3`}>
                 <Ionicons name="route" size={20} color="#16a34a" />
              </View>
              <View style={tw`flex-1`}>
                <Text style={tw`text-gray-500 text-xs font-bold mb-0.5`}>Usual Route</Text>
                <Text style={tw`text-[#0F172A] font-bold text-base`}>{pooler.usual_origin_area} → {pooler.usual_destination_area}</Text>
              </View>
            </View>
            <View style={tw`w-full h-px bg-gray-100 mb-4`} />
            <View style={tw`flex-row items-center`}>
              <View style={tw`w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3`}>
                 <Ionicons name="time" size={20} color="#16a34a" />
              </View>
              <View>
                <Text style={tw`text-gray-500 text-xs font-bold mb-0.5`}>Usual Time</Text>
                <Text style={tw`text-[#0F172A] font-bold text-base`}>{pooler.usual_departure_time}</Text>
              </View>
            </View>
          </View>

          <View style={tw`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
               <View style={tw`bg-gray-100 w-12 h-12 rounded-full items-center justify-center mr-4`}>
                 <Ionicons name="car" size={24} color="#475569" />
               </View>
               <View>
                 <Text style={tw`text-gray-500 text-xs font-bold mb-0.5`}>Vehicle</Text>
                 <Text style={tw`text-[#0F172A] font-bold text-base`}>{pooler.vehicle_type}</Text>
               </View>
            </View>
          </View>

          <View style={tw`flex-row gap-3 mb-8`}>
            <TouchableOpacity onPress={() => showComingSoon('App Call')} style={tw`flex-1 bg-white py-4 rounded-xl border border-gray-200 items-center flex-row justify-center shadow-sm`}>
              <Ionicons name="call" size={20} color="#0F172A" style={tw`mr-2`} />
              <Text style={tw`text-[#0F172A] font-bold text-base`}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => showComingSoon('In-App Message')} style={tw`flex-1 bg-white py-4 rounded-xl border border-gray-200 items-center flex-row justify-center shadow-sm`}>
              <Ionicons name="chatbubble" size={20} color="#0F172A" style={tw`mr-2`} />
              <Text style={tw`text-[#0F172A] font-bold text-base`}>Message</Text>
            </TouchableOpacity>
          </View>

          <Text style={tw`text-lg font-extrabold text-[#0F172A] mb-4`}>Recent Reviews</Text>
          {reviews.slice(0, pooler.review_count).map((rev, idx) => (
             <View key={idx} style={tw`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-3`}>
               <View style={tw`flex-row mb-2`}>
                 {[1,2,3,4,5].map(i => <Ionicons key={i} name="star" size={14} color="#fbbf24" style={tw`mr-0.5`} />)}
               </View>
               <Text style={tw`text-gray-700 italic font-medium`}>"{rev}"</Text>
             </View>
          ))}
          
          {pooler.is_live_available && (
            <TouchableOpacity 
              style={tw`w-full bg-[#16a34a] py-4 rounded-xl items-center shadow-md flex-row justify-center mt-6`}
              onPress={() => router.push('/(employee)/search')}
            >
              <Text style={tw`text-white font-bold text-lg mr-2`}>View Active Ride</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
