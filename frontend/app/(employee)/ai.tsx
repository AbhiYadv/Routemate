import { View, Text, SafeAreaView, TouchableOpacity, Platform, ScrollView, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../src/utils/api';

export default function AiAssistant() {
  const { ride_id } = useLocalSearchParams();
  const router = useRouter();
  
  const [messages, setMessages] = useState<any[]>([
    { role: 'assistant', text: 'Hi! I am your RouteMate AI Assistant. How can I help you with this ride?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [rideData, setRideData] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/rides/${ride_id}`);
        setRideData(data);
      } catch (e) {
        console.log(e);
      }
    })();
  }, [ride_id]);

  const generateAIResponse = (query: string, ride: any) => {
    const q = query.toLowerCase();
    
    if (!ride) return "I'm sorry, I cannot access the ride details right now.";

    if (q.includes("good") || q.includes("match")) {
      return `${ride.driver?.name}'s ride is a ${ride.route_match_score > 80 ? 'great' : 'fair'} match for you. Route match is ${ride.route_match_score}%.`;
    }
    if (q.includes("detour")) {
      return `This ride will add approximately ${ride.detour_minutes} minutes of detour compared to a direct route.`;
    }
    if (q.includes("drops") || q.includes("stop")) {
      const stops = Math.max(0, (ride.stop_sequence?.length || 2) - 2);
      return `There are ${stops} stops before your destination.`;
    }
    if (q.includes("reliable") || q.includes("rating")) {
      return `Yes, ${ride.driver?.name} is verified with ${ride.company_name}, rated ${ride.pooler?.rating} from ${ride.pooler?.review_count} reviews.`;
    }
    if (q.includes("review")) {
      return `Reviews for this pooler highlight: "Safe ride, good communication." and "Reached on time."`;
    }
    if (q.includes("pickup") || q.includes("pass")) {
      return `Yes, the planned route passes through ${ride.origin_area} and goes to ${ride.destination_area}. Your exact pickup area is along this route.`;
    }
    if (q.includes("company") || q.includes("circle")) {
      return `Yes, this is a ${ride.visibility_mode === 'COMPANY_CIRCLE' ? 'Company Circle' : 'Partner Network'} ride. Only verified employees can join.`;
    }

    return `I can help answer questions about detours, route matching, pooler reliability, and stops. For example, try asking: "How much detour will this add?"`;
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    
    const userMsg = { role: 'user', text: inputText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    setTimeout(() => {
      const aiResponse = generateAIResponse(userMsg.text, rideData);
      setMessages(prev => [...prev, { role: 'assistant', text: aiResponse }]);
    }, 600);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`bg-white px-4 py-4 flex-row items-center shadow-sm z-10 border-b border-gray-100`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4 p-2`}>
          <Ionicons name="close" size={28} color="#0F172A" />
        </TouchableOpacity>
        <View style={tw`w-10 h-10 bg-purple-100 rounded-full items-center justify-center mr-3`}>
          <Ionicons name="sparkles" size={20} color="#9333ea" />
        </View>
        <View>
          <Text style={tw`text-[#0F172A] font-bold text-lg`}>RouteMate AI</Text>
          <Text style={tw`text-purple-600 text-xs font-bold`}>Ride Assistant</Text>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={tw`p-4 pb-10`}
      >
        <View style={tw`flex-row flex-wrap gap-2 mb-6`}>
          <Text style={tw`text-xs text-gray-500 w-full mb-1`}>Suggested questions:</Text>
          {['How much detour?', 'Is this user reliable?', 'How many drops before mine?'].map((q, i) => (
            <TouchableOpacity 
              key={i} 
              style={tw`bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm`}
              onPress={() => setInputText(q)}
            >
              <Text style={tw`text-[#2563EB] text-xs font-medium`}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <View key={idx} style={tw`mb-4 ${isUser ? 'items-end' : 'items-start'}`}>
              <View style={tw`max-w-[80%] p-3.5 rounded-2xl ${isUser ? 'bg-[#0F172A] rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm shadow-sm'}`}>
                <Text style={tw`${isUser ? 'text-white' : 'text-[#0F172A]'} leading-relaxed`}>{msg.text}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={tw`bg-white px-4 py-3 border-t border-gray-100 flex-row items-center pb-8`}>
        <TextInput
          style={tw`flex-1 bg-[#F8FAFC] border border-gray-200 rounded-full px-4 py-3 mr-3 text-[#0F172A]`}
          placeholder="Ask about this ride..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity 
          style={tw`w-12 h-12 bg-[#9333ea] rounded-full items-center justify-center shadow-md ${!inputText.trim() ? 'opacity-50' : ''}`}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Ionicons name="arrow-up" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
