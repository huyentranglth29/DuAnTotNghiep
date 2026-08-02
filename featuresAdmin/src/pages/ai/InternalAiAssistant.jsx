import {useEffect, useRef, useState} from 'react';
import {
  MessageSquareText,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UserRound,
} from 'lucide-react';
import aiApi from '../../api/aiApi';
import iconAi from '../../assets/logo/iconai.jpg';

const STORAGE_KEY = 'filmgo_ai_conversations';
const ACTIVE_KEY = 'filmgo_ai_active_conversation';
const createWelcomeMessage = () => ({
  role: 'assistant',
  content:
    'Xin chào anh/chị. Em là FilmGo AI Assistant, có thể hỗ trợ tra cứu và phân tích dữ liệu nội bộ của hệ thống FilmGo.',
  createdAt: new Date().toISOString(),
});

const STARTERS = [
  'Tóm tắt tình hình hệ thống hôm nay.',
  'Doanh thu hôm nay là bao nhiêu?',
  'Hôm nay bán được bao nhiêu vé?',
  'Hôm nay nên kiểm tra vấn đề gì trước?',
];

function createConversation(title = 'Cuộc trò chuyện mới') {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    updatedAt: new Date().toISOString(),
    messages: [createWelcomeMessage()],
  };
}

function formatMessageTime(value) {
  return value
    ? new Date(value).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';
}

function AiLogoIcon() {
  return <img className="aiAvatarImage" src={iconAi} alt="" />;
}

function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    // ignore localStorage lỗi
  }
  return [createConversation()];
}

function InternalAiAssistant() {
  const [conversations, setConversations] = useState(loadConversations);
  const [activeConversationId, setActiveConversationId] = useState(
    () => localStorage.getItem(ACTIVE_KEY) || conversations[0]?.id,
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);
  const activeConversation =
    conversations.find(item => item.id === activeConversationId) || conversations[0];
  const messages = activeConversation?.messages || [createWelcomeMessage()];

  useEffect(() => {
    aiApi
      .getContext()
      .then(() => setError(''))
      .catch(err => setError(err.message || 'Không tải được ngữ cảnh AI.'));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations.slice(0, 30)));
  }, [conversations]);

  useEffect(() => {
    if (activeConversationId) localStorage.setItem(ACTIVE_KEY, activeConversationId);
  }, [activeConversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({behavior: 'smooth', block: 'end'});
  }, [messages, loading]);

  const updateActiveConversation = updater => {
    setConversations(current =>
      current.map(item =>
        item.id === activeConversationId
          ? {...item, ...updater(item), updatedAt: new Date().toISOString()}
          : item,
      ),
    );
  };

  const reloadContext = () => {
    setError('');
    aiApi
      .getContext()
      .then(() => setError(''))
      .catch(err => setError(err.message || 'Không tải được ngữ cảnh AI.'));
  };

  const startNewChat = () => {
    const next = createConversation();
    setConversations(current => [next, ...current]);
    setActiveConversationId(next.id);
    setInput('');
    setError('');
  };

  const deleteConversation = id => {
    setConversations(current => {
      const next = current.filter(item => item.id !== id);
      if (id === activeConversationId) {
        const fallback = next[0] || createConversation();
        setActiveConversationId(fallback.id);
        return next.length ? next : [fallback];
      }
      return next.length ? next : [createConversation()];
    });
  };

  const askAi = async question => {
    const text = String(question || input).trim();
    if (!text || loading) return;

    const now = new Date().toISOString();
    const nextMessages = [...messages, {role: 'user', content: text, createdAt: now}];
    updateActiveConversation(item => ({
      title: item.messages.length <= 1 ? text.slice(0, 48) : item.title,
      messages: nextMessages,
    }));
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await aiApi.chat({
        message: text,
        history: nextMessages.map(item => ({
          role: item.role,
          content: item.content,
        })),
      });
      const payload = response?.data || response;
      updateActiveConversation(item => ({
        messages: [
          ...item.messages,
          {
            role: 'assistant',
            content: payload?.answer || 'AI chưa trả về nội dung.',
            meta: payload?.context,
            providerError: payload?.providerError,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    } catch (err) {
      setError(err.message || 'Không gọi được AI.');
      updateActiveConversation(item => ({
        messages: [
          ...item.messages,
          {
            role: 'assistant',
            content: err.message || 'Không gọi được AI. Vui lòng thử lại.',
            tone: 'error',
            createdAt: new Date().toISOString(),
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = event => {
    event.preventDefault();
    askAi();
  };

  return (
    <section className="aiPage">
      <div className="aiCommandHeader">
        <div className="aiCommandTitle">
          <span className="aiMenuIcon">☰</span>
          <div>
            <h2>AI Trợ lý Nội bộ</h2>
          </div>
        </div>
        <div className="aiHeaderTools">
          <div className="aiSystemStatus">
            <span />
            {error ? 'Cần kiểm tra kết nối backend' : 'Hệ thống hoạt động bình thường'}
          </div>
          <button className="aiToolbarButton" type="button" onClick={reloadContext}>
            <RefreshCw size={16} />
            Làm mới
          </button>
          <button className="aiToolbarButton primary" type="button" onClick={startNewChat}>
            <Plus size={16} />
            Cuộc trò chuyện mới
          </button>
        </div>
      </div>

      <div className="aiWorkspace">
        <aside className="aiHistoryPanel">
          <div className="aiHistoryHeader">
            <span>Lịch sử chat</span>
            <button type="button" onClick={startNewChat} aria-label="Tạo cuộc trò chuyện mới">
              <Plus size={15} />
            </button>
          </div>
          <div className="aiHistoryList">
            {conversations.map(item => (
              <button
                type="button"
                key={item.id}
                className={`aiHistoryItem ${item.id === activeConversation?.id ? 'active' : ''}`}
                onClick={() => setActiveConversationId(item.id)}>
                <MessageSquareText size={15} />
                <span>{item.title}</span>
                <small>{new Date(item.updatedAt).toLocaleDateString('vi-VN')}</small>
                <i
                  role="button"
                  tabIndex={0}
                  aria-label="Xóa cuộc trò chuyện"
                  onClick={event => {
                    event.stopPropagation();
                    deleteConversation(item.id);
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.stopPropagation();
                      deleteConversation(item.id);
                    }
                  }}>
                  <Trash2 size={13} />
                </i>
              </button>
            ))}
          </div>
        </aside>
        <main className="aiChatPanel">
          <div className="aiPanelTop">
            <div>
              <h3>Trò chuyện với FilmGo AI</h3>
              <p>
                Trợ lý chỉ dùng snapshot dữ liệu nội bộ hiện tại để phân tích và
                khuyến nghị vận hành.
              </p>
            </div>
          </div>

          {error && <div className="aiError">{error}</div>}

          <div className="aiMessages">
            {messages.map((message, index) => (
              <article
                className={`aiMessage ${message.role === 'user' ? 'isUser' : ''} ${message.tone === 'error' ? 'isError' : ''}`}
                key={`${message.role}-${index}`}>
                <div className="aiAvatar">
                  {message.role === 'user' ? <UserRound size={16} /> : <AiLogoIcon />}
                </div>
                <div className="aiBubble">
                  <p>{message.content}</p>
                  <small>
                    {message.meta?.collectionCount
                      ? `Snapshot: ${message.meta.collectionCount} bảng · `
                      : ''}
                    {formatMessageTime(message.createdAt || activeConversation?.updatedAt)}
                  </small>
                </div>
              </article>
            ))}
            {loading && (
              <article className="aiMessage">
                <div className="aiAvatar">
                  <AiLogoIcon />
                </div>
                <div className="aiBubble">
                  <p>Đang suy nghĩ...</p>
                  <small>{formatMessageTime(new Date().toISOString())}</small>
                </div>
              </article>
            )}
            <div ref={endRef} />
          </div>

          <div className="aiStarterGrid">
            {STARTERS.map(starter => (
              <button
                type="button"
                key={starter}
                disabled={loading}
                onClick={() => askAi(starter)}>
                {starter}
              </button>
            ))}
          </div>

          <form className="aiComposer" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder="Hỏi FilmGo AI..."
              rows={1}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              <Send size={18} />
              Gửi
            </button>
          </form>
        </main>
      </div>
    </section>
  );
}

export default InternalAiAssistant;
