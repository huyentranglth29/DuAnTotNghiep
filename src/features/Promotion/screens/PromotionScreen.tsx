import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, Share, StatusBar, StyleSheet, Text, View} from 'react-native';
import PromotionCard from '../components/PromotionCard';
import PromotionDetail from '../components/PromotionDetail';
import PromotionTabs from '../components/PromotionTabs';
import {promotionItems} from '../data/promotions';
import {PromotionItem, PromotionTab} from '../types';

const BLUE = '#005f98';

type PromotionScreenProps = {
  onDetailChange?: (isDetail: boolean) => void;
};

function PromotionScreen({onDetailChange}: PromotionScreenProps) {
  const [activeTab, setActiveTab] = useState<PromotionTab>('promotions');
  const [selectedItem, setSelectedItem] = useState<PromotionItem | null>(null);

  useEffect(() => {
    onDetailChange?.(!!selectedItem);
  }, [onDetailChange, selectedItem]);

  const visibleItems = useMemo(
    () => promotionItems.filter(item => item.tab === activeTab),
    [activeTab],
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}>
        {visibleItems.map(item => (
          <PromotionCard
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
});

export default PromotionScreen;
