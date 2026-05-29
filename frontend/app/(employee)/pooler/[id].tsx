import { View, Text, TouchableOpacity, ScrollView, Platform, SafeAreaView } from 'react-native';
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

  if (loading) return <View style={tw`flex-1 justify-center items-center`}><Text>Loading profile...</Text></View>;
  if (!pooler) return <View style={tw`flex-1 justify-center items-center`}><Text>Pooler not found.</Text></View>;

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`bg-white px-4 py-4 flex-row items-center shadow-sm z-10`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4 p-2`}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={tw`text-[#0F172A] font-bold text-lg`}>Pooler Profile</Text>
      </View>

      <ScrollView contentContainerStyle={tw`pb-10`}>
        <View style={tw`bg-[#0F172A] px-6 py-8 items-center rounded-b-3xl relative overflow-hidden`}>
          <View style={tw`w-24 h-24 bg-gray-200 rounded-full items-center justify-center mb-4 border-4 border-[#2563EB]`}>
             <Ionicons name="person" size={48} color="#64748b" />
          </View>
          <Text style={tw`text-white text-2xl font-extrabold mb-1`}>{pooler.user?.name}</Text>
          <View style={tw`bg-blue-500/20 px-3 py-1 rounded-full flex-row items-center border border-blue-500/50`}>
            <Ionicons name="shield-checkmark" size={14} color="#60a5fa" style={tw`mr-1.5`} />
            <Text style={tw`text-blue-100 text-xs font-bold`}>{pooler.company_name}</Text>
          </View>
        </View>

        <View style={tw`px-6 -mt-8`}>
          <View style={tw`bg-white rounded-2xl p-5 shadow-md border border-gray-100 flex-row justify-around`}>
            <View style={tw`items-center`}>
              <Text style={tw`text-[#0F172A] font-extrabold text-xl`}>{pooler.rating}</Text>
              <Text style={tw`text-gray-500 text-xs font-medium`}>Rating</Text>
            </View>
            <View style={tw`w-px h-full bg-gray-200`} />
            <View style={tw`items-center`}>
              <Text style={tw`text-[#0F172A] font-extrabold text-xl`}>{pooler.completed_rides_count}</Text>
              <Text style={tw`text-gray-500 text-xs font-medium`}>Rides</Text>
            </View>
            <View style={tw`w-px h-full bg-gray-200`} />
            <View style={tw`items-center`}>
              <Text style={tw`text-[#22C55E] font-extrabold text-xl`}>{pooler.trust_score}</Text>
              <Text style={tw`text-gray-500 text-xs font-medium`}>Trust</Text>
            </View>
          </View>
        </View>

        <View style={tw`px-6 pt-8`}>
          <Text style={tw`text-lg font-extrabold text-[#0F172A] mb-4`}>Commute Details</Text>
          
          <View style={tw`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4`}>
            <View style={tw`flex-row items-center mb-3`}>
              <Ionicons name="route" size={20} color="#64748b" style={tw`mr-3`} />
              <View>
                <Text style={tw`text-gray-500 text-xs`}>Usual Route</Text>
                <Text style={tw`text-[#0F172A] font-bold`}>{pooler.usual_origin_area} → {pooler.usual_destination_area}</Text>
              </View>
            </View>
            <View style={tw`w-full h-px bg-gray-100 my-2`} />
            <View style={tw`flex-row items-center`}>
              <Ionicons name="time" size={20} color="#64748b" style={tw`mr-3`} />
              <View>
                <Text style={tw`text-gray-500 text-xs`}>Usual Time</Text>
                <Text style={tw`text-[#0F172A] font-bold`}>{pooler.usual_departure_time}</Text>
              </View>
            </View>
          </View>

          <View style={tw`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex-row items-center justify-between`}>
            <View style={tw`flex-row items-center`}>
               <View style={tw`bg-gray-100 w-10 h-10 rounded-full items-center justify-center mr-3`}>
                 <Ionicons name="car" size={20} color="#475569" />
               </View>
               <View>
                 <Text style={tw`text-gray-500 text-xs`}>Vehicle</Text>
                 <Text style={tw`text-[#0F172A] font-bold`}>{pooler.vehicle_type}</Text>
               </View>
            </View>
          </View>

          {pooler.is_live_available && (
            <TouchableOpacity 
              style={tw`w-full bg-[#2563EB] py-4 rounded-xl items-center shadow-md flex-row justify-center`}
              onPress={() => router.back()} // Ideally navigate to their active ride
            >
              <Text style={tw`text-white font-bold text-lg mr-2`}>View Active Ride</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          )}

          <View style={tw`flex-row mt-4 gap-3`}>
            <TouchableOpacity style={tw`flex-1 bg-white py-3 rounded-xl border border-gray-200 items-center flex-row justify-center`}>
              <Ionicons name="call" size={18} color="#0F172A" style={tw`mr-2`} />
              <Text style={tw`text-[#0F172A] font-bold`}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tw`flex-1 bg-white py-3 rounded-xl border border-gray-200 items-center flex-row justify-center`}>
              <Ionicons name="chatbubble" size={18} color="#0F172A" style={tw`mr-2`} />
              <Text style={tw`text-[#0F172A] font-bold`}>Message</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
