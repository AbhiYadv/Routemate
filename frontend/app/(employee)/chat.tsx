import { View, Text, SafeAreaView, TouchableOpacity, Platform, TextInput, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../src/utils/api';
import { useAuthStore } from '../../src/store/auth';

export default function ChatScreen() {
  const { ride_id, receiver_id, receiver_name } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchMessages = async () => {
    try {
      const { data } = await api.get(`/messages/${ride_id}/${receiver_id}`);
      setMessages(data);
    } catch (e) {
      console.log('Error fetching messages', e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Polling every 5s
    return () => clearInterval(interval);
  }, [ride_id, receiver_id]);

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Optimistic UI
    const tempMsg = {
      id: Math.random().toString(),
      sender_id: user?.id,
      message: inputText.trim(),
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    setInputText('');

    try {
      await api.post(`/messages/${ride_id}/${receiver_id}`, { message: tempMsg.message });
      fetchMessages();
    } catch (e) {
      console.log('Error sending message', e);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`bg-white px-4 py-4 flex-row items-center shadow-sm z-10 border-b border-gray-100`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4 p-2`}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={tw`w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3`}>
          <Ionicons name="person" size={20} color="#64748b" />
        </View>
        <View>
          <Text style={tw`text-[#0F172A] font-bold text-lg`}>{receiver_name}</Text>
          <Text style={tw`text-green-600 text-xs font-bold`}>Online</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={tw`flex-1`} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={tw`p-4`}
        >
          {messages.length === 0 ? (
            <Text style={tw`text-center text-gray-500 mt-10`}>Send a message to start chatting.</Text>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <View key={idx} style={tw`mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
                  <View style={tw`max-w-[75%] p-3 rounded-2xl ${isMe ? 'bg-[#2563EB] rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm shadow-sm'}`}>
                    <Text style={tw`${isMe ? 'text-white' : 'text-[#0F172A]'}`}>{msg.message}</Text>
                  </View>
                  <Text style={tw`text-[10px] text-gray-400 mt-1 mx-1`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={tw`bg-white px-4 py-3 border-t border-gray-100 flex-row items-center pb-8`}>
          <TextInput
            style={tw`flex-1 bg-[#F8FAFC] border border-gray-200 rounded-full px-4 py-2.5 mr-3 text-[#0F172A]`}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
          />
          <TouchableOpacity 
            style={tw`w-10 h-10 bg-[#2563EB] rounded-full items-center justify-center ${!inputText.trim() ? 'opacity-50' : ''}`}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={18} color="white" style={tw`ml-1`} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
