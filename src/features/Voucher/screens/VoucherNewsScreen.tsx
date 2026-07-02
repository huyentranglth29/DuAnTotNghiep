import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, Share, StatusBar, StyleSheet, Text, View} from 'react-native';
import VoucherNewsCard from '../components/VoucherNewsCard';
import VoucherNewsDetail from '../components/VoucherNewsDetail';
import VoucherNewsTabs from '../components/VoucherNewsTabs';
import {voucherNewsItems} from '../data/voucherNews';
import {VoucherNewsItem, VoucherNewsTab} from '../types';

const BLUE = '#005f98';

type VoucherNewsScreenProps = {
  onDetailChange?: (isDetail: boolean) => void;
};

function VoucherNewsScreen({onDetailChange}: VoucherNewsScreenProps) {
  const [activeTab, setActiveTab] = useState<VoucherNewsTab>('promotions');
  const [selectedItem, setSelectedItem] = useState<VoucherNewsItem | null>(null);

  useEffect(() => {
    onDetailChange?.(!!selectedItem);
  }, [onDetailChange, selectedItem]);

  const visibleItems = useMemo(
    () => voucherNewsItems.filter(item => item.tab === activeTab),
    [activeTab],
  );

  if (selectedItem) {
    return (
      <VoucherNewsDetail
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

      <VoucherNewsTabs activeTab={activeTab} onChangeTab={setActiveTab} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}>
        {visibleItems.map(item => (
          <VoucherNewsCard
            key={item.id}
            item={item}
            onPress={() => setSelectedItem(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    minHeight: 86,
    justifyContent: 'center',
    backgroundColor: BLUE,
    paddingHorizontal: 18,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
  },
  listContent: {
    paddingTop: 12,
    paddingHorizontal: 6,
    paddingBottom: 16,
  },
});

export default VoucherNewsScreen;
