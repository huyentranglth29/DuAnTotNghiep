import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {chatWithCustomerAi} from '../../services/apiService';
import iconAi from '../../assets/logo/iconai.jpg';

type Message = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  createdAt: string;
  isThinking?: boolean;
};

const STORAGE_KEY = 'filmgo_customer_ai_messages';
const PINK = '#f50046';
const BLUE = '#0076b6';
const AI_TIMEOUT_MS = 20000;
const MIN_THINKING_MS = 3000;
const MAX_THINKING_MS = 5000;

const SUGGESTIONS = [
  'Hôm nay có phim nào đang chiếu?',
  'Phim nào đang hot hôm nay?',
  'Có voucher nào dùng được không?',
  'Hướng dẫn em cách đặt vé.',
];

function nowMessage(role: Message['role'], content: string): Message {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function formatTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });
}

function withAiTimeout<T>(request: Promise<T>) {
  return Promise.race([
    request,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error('AI_TIMEOUT'));
      }, AI_TIMEOUT_MS);
    }),
  ]);
}

const wait = (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });

const randomThinkingDelay = () =>
  MIN_THINKING_MS +
  Math.floor(Math.random() * (MAX_THINKING_MS - MIN_THINKING_MS + 1));

function CustomerAiScreen({onClose}: {onClose: () => void}) {
  const listRef = useRef<FlatList<Message>>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    nowMessage(
      'assistant',
      'Xin chào anh/chị. Em có thể hỗ trợ tra cứu phim, lịch chiếu, giá vé, voucher và hướng dẫn đặt vé.',
    ),
  ]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => {
        if (!value) return;
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-80))).catch(
      () => undefined,
    );
  }, [messages]);

  const historyForApi = useMemo(
    () =>
      messages.slice(-10).map(item => ({
        role: item.role,
        content: item.content,
      })),
    [messages],
  );

  const scrollToEnd = () => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({animated: true}));
  };

  const sendMessage = async (text?: string) => {
    const question = String(text ?? input).trim();
    if (!question || sending) return;

    const userMessage = nowMessage('user', question);
    const thinkingMessage = {
      ...nowMessage('assistant', 'Đang suy nghĩ...'),
      isThinking: true,
    };
    setMessages(current => [...current, userMessage, thinkingMessage]);
    setInput('');
    setSending(true);

    try {
      const [response] = (await Promise.all([
        withAiTimeout(
          chatWithCustomerAi({
            message: question,
            history: historyForApi,
          }),
        ),
        wait(randomThinkingDelay()),
      ])) as any[];
      const data = response?.data ?? response;
      const answer =
        data?.answer ||
        'Em chưa có đủ dữ liệu để trả lời câu này. Anh/chị thử hỏi về phim, lịch chiếu, voucher hoặc cách đặt vé nhé.';
      setMessages(current =>
        current.map(item =>
          item.id === thinkingMessage.id
            ? {...item, content: answer, isThinking: false}
            : item,
        ),
      );
    } catch (error) {
      const errorMessage = (error as Error)?.message || '';
      const isTimeout =
        errorMessage === 'AI_TIMEOUT' ||
        errorMessage.toLowerCase().includes('timeout');
      const answer = isTimeout
        ? 'Em đang suy nghĩ hơi lâu nên tạm dừng yêu cầu này. Anh/chị thử hỏi lại ngắn hơn hoặc bấm gửi lại giúp em nhé.'
        : errorMessage ||
          'Em chưa kết nối được trợ lý FilmGo. Anh/chị thử lại sau ít phút nhé.';
      setMessages(current =>
        current.map(item =>
          item.id === thinkingMessage.id
            ? {...item, content: answer, isThinking: false}
            : item,
        ),
      );
    } finally {
      setSending(false);
      scrollToEnd();
    }
  };

  const clearChat = () => {
    setMessages([
      nowMessage(
        'assistant',
        'Em đã tạo cuộc trò chuyện mới. Anh/chị cần hỗ trợ phim, lịch chiếu hay voucher ạ?',
      ),
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>FilmGo AI</Text>
          <Text style={styles.headerSubtitle}>Trợ lý khách hàng</Text>
        </View>
        <TouchableOpacity style={styles.newChatButton} onPress={clearChat}>
          <Text style={styles.newChatText}>Mới</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToEnd}
        renderItem={({item}) => {
          const isUser = item.role === 'user';
          return (
            <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
              {!isUser && (
                <View style={styles.avatar}>
                  <Image source={iconAi} style={styles.avatarImage} />
                </View>
              )}
              <View style={[styles.bubble, isUser && styles.bubbleUser]}>
                <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
                  {item.content}
                </Text>
                <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <ScrollView
        horizontal
        style={styles.suggestionBar}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestions}>
        {SUGGESTIONS.map(item => (
          <TouchableOpacity
            key={item}
            style={styles.suggestionChip}
            disabled={sending}
            onPress={() => sendMessage(item)}>
            <Text style={styles.suggestionText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          style={styles.input}
          placeholder="Hỏi FilmGo AI..."
          placeholderTextColor="#98a2b3"
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
          disabled={!input.trim() || sending}
          onPress={() => sendMessage()}>
          <Text style={styles.sendText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
  header: {
    height: 74,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e6eaf0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 38,
    lineHeight: 40,
    color: '#25272c',
    marginTop: -4,
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 23,
    lineHeight: 27,
    fontWeight: '900',
    color: '#20242a',
  },
  headerSubtitle: {
    marginTop: 1,
    fontSize: 13,
    color: '#7b8491',
    fontWeight: '600',
  },
  newChatButton: {
    height: 36,
    paddingHorizontal: 15,
    borderRadius: 18,
    backgroundColor: '#eaf5ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatText: {
    color: BLUE,
    fontWeight: '800',
    fontSize: 14,
  },
  messageList: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#cfe7ff',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 34,
    height: 34,
    resizeMode: 'cover',
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 16,
    borderBottomLeftRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e9f3',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bubbleUser: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    backgroundColor: '#fff1f5',
    borderColor: '#ffc4d4',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#222831',
    fontWeight: '500',
  },
  messageTextUser: {
    color: '#1f2430',
  },
  messageTime: {
    marginTop: 6,
    fontSize: 10,
    color: '#7a8795',
    fontWeight: '700',
  },
  messageTimeUser: {
    color: '#9a5667',
  },
  suggestions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  suggestionBar: {
    flexGrow: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  suggestionChip: {
    maxWidth: 190,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f1f7ff',
    borderWidth: 1,
    borderColor: '#d5e8fb',
  },
  suggestionText: {
    color: '#2b4059',
    fontWeight: '700',
    fontSize: 11,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 16 : 10,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 92,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d9e2ee',
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 9,
    fontSize: 14,
    color: '#20242a',
    backgroundColor: '#ffffff',
  },
  sendButton: {
    minWidth: 58,
    height: 42,
    borderRadius: 18,
    backgroundColor: PINK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#b8d7ea',
  },
  sendText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
});

export default CustomerAiScreen;
