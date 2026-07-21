import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PromotionCard from '../components/PromotionCard';
import PromotionDetail from '../components/PromotionDetail';
import PromotionTabs from '../components/PromotionTabs';
import {promotionItems} from '../data/promotions';
import {PromotionItem, PromotionTab} from '../types';
import {resolveMediaUrl} from '../../../config/api.config';
import {getNewsEvents} from '../../../services/apiService';

const BLUE = '#005f98';

type PromotionScreenProps = {
  onDetailChange?: (isDetail: boolean) => void;
};

type NewsEventApi = {
  _id?: string;
  id?: string;
  title?: string;
  summary?: string;
  content?: string;
  image?: string;
  category?: 'tin_tuc' | 'su_kien' | 'khuyen_mai' | string;
  publishDate?: string;
  createdAt?: string;
};

const formatPublishedAt = (value?: string) => {
  if (!value) {
    return 'FilmGo';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const splitContent = (content?: string) => {
  const paragraphs = String(content || '')
    .split(/\n+/)
    .map(item => item.trim())
    .filter(Boolean);

  return paragraphs.length ? paragraphs : ['Nội dung đang được cập nhật.'];
};

const mapNewsEventToPromotion = (
  item: NewsEventApi,
  index: number,
): PromotionItem => {
  const fallback = promotionItems[index % promotionItems.length];
  const imageUrl = resolveMediaUrl(item.image);

  return {
    id: String(item._id || item.id || fallback.id),
    tab: item.category === 'khuyen_mai' ? 'promotions' : 'sideNews',
    title: item.title || fallback.title,
    publishedAt: formatPublishedAt(item.publishDate || item.createdAt),
    image: imageUrl ? {uri: imageUrl} : fallback.image,
    summary: item.summary || item.content || fallback.summary,
    body: splitContent(item.content || item.summary || fallback.summary),
  };
};

function PromotionScreen({onDetailChange}: PromotionScreenProps) {
  const [activeTab, setActiveTab] = useState<PromotionTab>('promotions');
  const [selectedItem, setSelectedItem] = useState<PromotionItem | null>(null);
  const [items, setItems] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNewsEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getNewsEvents();
      const list = Array.isArray(response) ? response : [];
      setItems(list.map(mapNewsEventToPromotion));
    } catch (err) {
      setError((err as Error)?.message || 'Không tải được tin mới và ưu đãi.');
      setItems(promotionItems);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onDetailChange?.(!!selectedItem);
  }, [onDetailChange, selectedItem]);

  useEffect(() => {
    loadNewsEvents();
  }, [loadNewsEvents]);

  const visibleItems = useMemo(
    () => items.filter(item => item.tab === activeTab),
    [activeTab, items],
  );

  if (selectedItem) {
    return (
      <PromotionDetail
        item={selectedItem}
        onBack={() => setSelectedItem(null)}
        onShare={() =>
          Share.share({
            title: selectedItem.title,
            message: `${selectedItem.title}\n${selectedItem.summary}`,
          })
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TIN MỚI VÀ ƯU ĐÃI</Text>
      </View>

      <PromotionTabs activeTab={activeTab} onChangeTab={setActiveTab} />

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={BLUE} />
          <Text style={styles.stateText}>Đang tải tin mới...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}>
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={loadNewsEvents}>
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}
          {visibleItems.length ? (
            visibleItems.map(item => (
              <PromotionCard
                key={item.id}
                item={item}
                onPress={() => setSelectedItem(item)}
              />
            ))
          ) : (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Chưa có bài viết</Text>
              <Text style={styles.stateText}>
                Admin chưa đăng nội dung cho mục này.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    minHeight: 66,
    justifyContent: 'center',
    backgroundColor: BLUE,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
  },
  listContent: {
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  stateBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 42,
  },
  stateTitle: {
    color: '#242424',
    fontSize: 18,
    fontWeight: '900',
  },
  stateText: {
    color: '#737373',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  errorBox: {
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fed7aa',
    marginBottom: 12,
    padding: 12,
  },
  errorText: {
    color: '#9a3412',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  retryText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
  },
});

export default PromotionScreen;
