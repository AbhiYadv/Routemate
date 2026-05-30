import {
  View, Text, SafeAreaView, TouchableOpacity, Platform,
  TextInput, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../src/utils/api';
import { useAuthStore } from '../../src/store/auth';

// Chat landing state shown when opened directly from tab bar (no ride/receiver context)
function ChatLanding() {
  return (
    <View style={tw`flex-1 items-center justify-center px-8`}>
      <Ionicons name="chatbubbles-outline" size={64} color="#94a3b8" />
      <Text style={tw`text-xl font-bold text-[#0F172A] mt-6 text-center`}>Your Messages</Text>
      <Text style={tw`text-gray-500 text-sm text-center mt-3 leading-relaxed`}>
        Start a conversation by opening a ride or pooler profile and tapping the message icon.
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { ride_id, receiver_id, receiver_name } = useLocalSearchParams<{
    ride_id: string;
    receiver_id: string;
    receiver_name: string;
  }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // If no context params, show landing — this screen is also a tab
  const hasContext = !!(ride_id && receiver_id);

  const fetchMessages = async () => {
    if (!hasContext) return;
    try {
      const { data } = await api.get(`/messages/${ride_id}/${receiver_id}`);
      setMessages(data);
    } catch {}
  };

  useEffect(() => {
    if (!hasContext) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [ride_id, receiver_id]);

  const sendMessage = async () => {
    if (!inputText.trim() || !hasContext) return;
    const text = inputText.trim();
    // Optimistic UI
    const tempMsg = {
      id: `tmp-${Date.now()}`,
      sender_id: user?.id,
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');
    try {
      await api.post(`/messages/${ride_id}/${receiver_id}`, { message: text });
      fetchMessages();
    } catch {}
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      {/* Header */}
      <View style={tw`bg-white px-4 py-4 flex-row items-center shadow-sm z-10 border-b border-gray-100`}>
        {hasContext ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw`mr-4 w-11 h-11 items-center justify-center`}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
        ) : null}
        <View style={tw`w-10 h-10 bg-gray-200 rounded-full items-center justify-center mr-3`}>
          <Ionicons name="person" size={20} color="#64748b" />
        </View>
        <View>
          <Text style={tw`text-[#0F172A] font-bold text-lg`}>
            {hasContext ? (receiver_name || 'Ride Chat') : 'Chat'}
          </Text>
          {hasContext && <Text style={tw`text-green-600 text-xs font-semibold`}>Ride conversation</Text>}
        </View>
      </View>

      {!hasContext ? (
        <ChatLanding />
      ) : (
        <KeyboardAvoidingView style={tw`flex-1`} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={tw`p-4`}
          >
            {messages.length === 0 ? (
              <View style={tw`items-center mt-16`}>
                <Ionicons name="chatbubble-outline" size={40} color="#94a3b8" />
                <Text style={tw`text-gray-400 mt-4 text-center`}>
                  Send a message to start the conversation.
                </Text>
              </View>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <View key={msg.id || idx} style={tw`mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
                    <View
                      style={tw`max-w-[75%] p-3 rounded-2xl ${
                        isMe ? 'bg-[#2563EB] rounded-br-sm' : 'bg-white border border-gray-200 rounded-bl-sm shadow-sm'
                      }`}
                    >
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

          <View style={tw`bg-white px-4 py-3 border-t border-gray-100 flex-row items-center`}>
            <TextInput
              style={tw`flex-1 bg-[#F8FAFC] border border-gray-200 rounded-full px-4 py-2.5 mr-3 text-[#0F172A]`}
              placeholder="Type a message…"
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              accessibilityLabel="Message input"
            />
            <TouchableOpacity
              style={tw`w-11 h-11 bg-[#2563EB] rounded-full items-center justify-center ${!inputText.trim() ? 'opacity-40' : ''}`}
              onPress={sendMessage}
              disabled={!inputText.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Ionicons name="send" size={18} color="white" style={tw`ml-0.5`} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
