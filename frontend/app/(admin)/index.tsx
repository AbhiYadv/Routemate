import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';
import { useState, useEffect } from 'react';
import { api } from '../../src/utils/api';
import Logo from '../../src/components/Logo';
import { useRouter } from 'expo-router';

export default function AdminDashboard() {
  const { user, logout } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data);
      } catch (err) {
        console.log(err);
      }
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleMarkIssued = () => {
    Alert.alert("Success", "Voucher marked as issued!");
  };

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] justify-center items-center`}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`bg-white px-6 pt-4 pb-4 flex-row justify-between items-center shadow-sm z-10 border-b border-gray-100`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`mr-3`}><Logo size="small" /></View>
          <View>
            <Text style={tw`text-[#0F172A] font-bold text-lg`}>Company Admin</Text>
            <Text style={tw`text-gray-500 text-xs font-medium`}>Nexora Technologies</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={tw`bg-red-50 p-2 rounded-full border border-red-100`}>
          <Ionicons name="log-out" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={tw`p-6 pb-20`}>
        <Text style={tw`text-xl font-extrabold text-[#0F172A] mb-4`}>Employee Commute Benefits</Text>
        
        <View style={tw`flex-row flex-wrap justify-between mb-6`}>
          <View style={tw`bg-white w-[48%] p-4 rounded-2xl shadow-sm border border-gray-100 mb-4`}>
            <Ionicons name="car" size={24} color="#2563EB" style={tw`mb-2`} />
            <Text style={tw`text-2xl font-extrabold text-[#0F172A]`}>{data?.kpis?.completed_rides || 0}</Text>
            <Text style={tw`text-gray-500 text-xs font-bold mt-1`}>Completed Rides</Text>
          </View>
          <View style={tw`bg-white w-[48%] p-4 rounded-2xl shadow-sm border border-gray-100 mb-4`}>
            <Ionicons name="people" size={24} color="#22C55E" style={tw`mb-2`} />
            <Text style={tw`text-2xl font-extrabold text-[#0F172A]`}>{data?.kpis?.active_poolers || 0}</Text>
            <Text style={tw`text-gray-500 text-xs font-bold mt-1`}>Active Poolers</Text>
          </View>
          <View style={tw`bg-white w-[48%] p-4 rounded-2xl shadow-sm border border-gray-100 mb-4`}>
            <Ionicons name="leaf" size={24} color="#16a34a" style={tw`mb-2`} />
            <Text style={tw`text-2xl font-extrabold text-[#0F172A]`}>{data?.kpis?.co2_saved_kg || 0} kg</Text>
            <Text style={tw`text-gray-500 text-xs font-bold mt-1`}>CO2 Saved</Text>
          </View>
          <View style={tw`bg-white w-[48%] p-4 rounded-2xl shadow-sm border border-gray-100 mb-4`}>
            <Ionicons name="wallet" size={24} color="#ea580c" style={tw`mb-2`} />
            <Text style={tw`text-2xl font-extrabold text-[#0F172A]`}>₹{data?.kpis?.estimated_cost_saved_inr || 0}</Text>
            <Text style={tw`text-gray-500 text-xs font-bold mt-1`}>Cost Saved</Text>
          </View>
        </View>

        <Text style={tw`text-xl font-extrabold text-[#0F172A] mb-4`}>Fuel Voucher Queue</Text>
        {data?.fuel_voucher_queue?.map((fv: any) => (
          <View key={fv.id} style={tw`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4`}>
            <View style={tw`flex-row justify-between items-center mb-3`}>
              <View>
                <Text style={tw`text-lg font-bold text-[#0F172A]`}>{fv.pooler_name}</Text>
                <Text style={tw`text-gray-500 text-xs mt-1`}>{fv.completed_rides} rides • {fv.passenger_count} passengers</Text>
              </View>
              <View style={tw`items-end`}>
                <Text style={tw`text-lg font-extrabold text-[#22C55E]`}>₹{fv.estimated_voucher_amount}</Text>
                <View style={tw`bg-green-100 px-2 py-1 rounded mt-1`}>
                  <Text style={tw`text-green-700 text-[10px] font-bold`}>{fv.status}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={handleMarkIssued} style={tw`bg-[#0F172A] w-full py-3 rounded-xl items-center`}>
              <Text style={tw`text-white font-bold`}>Mark Issued</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={tw`text-xl font-extrabold text-[#0F172A] mt-4 mb-4`}>Feedback & Quality</Text>
        {data?.feedback_quality?.map((fq: any) => (
          <View key={fq.id} style={tw`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4`}>
            <View style={tw`flex-row justify-between mb-2`}>
              <Text style={tw`font-bold text-[#0F172A]`}>{fq.pooler_name}</Text>
              <View style={tw`flex-row items-center`}>
                <Ionicons name="star" size={14} color="#fbbf24" style={tw`mr-1`} />
                <Text style={tw`text-gray-700 font-bold`}>{fq.average_rating}</Text>
              </View>
            </View>
            <Text style={tw`text-gray-500 text-xs mb-2 font-medium`}>{fq.ride_route}</Text>
            <Text style={tw`text-[#0F172A] italic mb-3`}>"{fq.feedback}"</Text>
            <View style={tw`bg-blue-50 self-start px-3 py-1 rounded-full border border-blue-100`}>
              <Text style={tw`text-blue-700 text-xs font-bold`}>Reward Impact: {fq.reward_impact}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
