import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useQuery} from '@tanstack/react-query';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../services/apiService';

type NotificationScreenProps = {
  onBack: () => void;
};

const typeIcon = (type?: string) => {
  if (type === 'voucher') return '🎟️';
  if (type === 'phim') return '🎬';
  if (type === 'dat_ve') return '🎫';
  if (type === 'thanh_toan') return '💳';
  return '🔔';
};

function NotificationScreen({onBack}: NotificationScreenProps) {
  const [selected, setSelected] = useState<any | null>(null);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });
  const {refetch} = notificationsQuery;

  useEffect(() => {
    refetch().catch(() => undefined);
  }, [refetch]);

  const list = Array.isArray(notificationsQuery.data)
    ? notificationsQuery.data
    : [];

  const onReadAll = async () => {
    try {
      await markAllNotificationsRead();
      await notificationsQuery.refetch();
    } catch (error) {
      Alert.alert('Thông báo', (error as Error).message);
    }
  };

  const onPressItem = async (item: any) => {
    try {
      if (!item.isRead) {
        await markNotificationRead(item._id);
        await notificationsQuery.refetch();
      }
    } catch (error) {
      Alert.alert('Không thể đánh dấu đã đọc', (error as Error).message);
      return;
    }

    if (item.type === 'voucher') {
      Alert.alert(item.title, `${item.content}\n\nVào tab Voucher để bấm Nhận ngay.`);
      return;
    }
    setSelected(item);
  };

  if (selected) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelected(null)}>
            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 5L8 12l7 7"
                stroke="#ffffff"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CHI TIẾT</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.detailIcon}>{typeIcon(selected.type)}</Text>
          <Text style={styles.detailTitle}>{selected.title}</Text>
          <Text style={styles.detailContent}>{selected.content}</Text>
          <Text style={styles.detailTime}>
            {selected.createdAt
              ? new Date(selected.createdAt).toLocaleString('vi-VN')
              : ''}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5L8 12l7 7"
              stroke="#ffffff"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>THÔNG BÁO</Text>
        <TouchableOpacity onPress={onReadAll}>
          <Text style={styles.readAll}>Đọc tất cả</Text>
        </TouchableOpacity>
      </View>

      {notificationsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#005f98" />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item: any) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={notificationsQuery.isFetching}
              onRefresh={() => notificationsQuery.refetch()}
              tintColor="#005f98"
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có thông báo nào</Text>
          }
          renderItem={({item}: any) => (
            <TouchableOpacity
              style={[
                styles.item,
                item.isRead ? styles.itemRead : styles.itemUnread,
              ]}
              onPress={() => onPressItem(item)}>
              <Text style={styles.itemIcon}>{typeIcon(item.type)}</Text>
              <View style={styles.itemBody}>
                <Text
                  style={[
                    styles.itemTitle,
                    item.isRead && styles.itemTitleRead,
                  ]}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.itemContent,
                    item.isRead && styles.itemContentRead,
                  ]}
                  numberOfLines={3}>
                  {item.content}
                </Text>
                <Text style={styles.itemTime}>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString('vi-VN')
                    : ''}
                </Text>
              </View>
              {!item.isRead ? <View style={styles.unreadDot} /> : null}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  header: {
    backgroundColor: '#005f98',
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSpacer: {
    width: 72,
  },
  readAll: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 14,
    paddingBottom: 40,
  },
  empty: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 48,
    fontSize: 14,
  },
  item: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  itemUnread: {
    backgroundColor: '#ffffff',
  },
  itemRead: {
    opacity: 0.85,
  },
  itemIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  itemTitleRead: {
    color: '#4b5563',
  },
  itemContent: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },
  itemContentRead: {
    color: '#9ca3af',
  },
  itemTime: {
    marginTop: 8,
    fontSize: 11,
    color: '#9ca3af',
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    marginTop: 4,
  },
  detailCard: {
    margin: 16,
    padding: 18,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  detailIcon: {
    fontSize: 28,
    marginBottom: 10,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  detailContent: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: '#4b5563',
  },
  detailTime: {
    marginTop: 14,
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default NotificationScreen;
