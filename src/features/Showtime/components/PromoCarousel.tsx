import React, {useEffect, useRef, useState} from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const SLIDE_WIDTH = Dimensions.get('window').width - 28;
const isTestEnvironment =
  (globalThis as {process?: {env?: {NODE_ENV?: string}}}).process?.env
    ?.NODE_ENV === 'test';

const promos = [
  {
    key: 'combo',
    badge: 'ƯU ĐÃI',
    title: 'Combo bắp nước',
    subtitle: 'Tiết kiệm đến 95K cho cặp đôi',
    highlight: 'COMBO',
    accent: '#0ea5e9',
    soft: '#e0f2fe',
    deep: '#0369a1',
    emoji: '🍿',
  },
  {
    key: 'member',
    badge: 'MEMBER',
    title: 'Thứ 3 chỉ từ',
    subtitle: 'Vé FilmGo ưu đãi thành viên',
    highlight: '16K',
    accent: '#f97316',
    soft: '#ffedd5',
    deep: '#c2410c',
    emoji: '🎟',
  },
  {
    key: 'drink',
    badge: 'MỚI',
    title: 'Mua ly Minions',
    subtitle: 'Tặng kèm Pepsi size lớn',
    highlight: 'FREE',
    accent: '#8b5cf6',
    soft: '#ede9fe',
    deep: '#6d28d9',
    emoji: '🥤',
  },
];

function PromoCarousel() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (isTestEnvironment) {
      return undefined;
    }

    const timer = setInterval(() => {
      setActiveIndex(current => {
        const nextIndex = current === promos.length - 1 ? 0 : current + 1;
        scrollRef.current?.scrollTo({
          x: nextIndex * SLIDE_WIDTH,
          animated: true,
        });
        return nextIndex;
      });
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  const handleMomentumEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.round(
      event.nativeEvent.contentOffset.x / SLIDE_WIDTH,
    );
    setActiveIndex(nextIndex);
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SLIDE_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}>
        {promos.map(promo => (
          <View key={promo.key} style={[styles.banner, {backgroundColor: promo.soft}]}>
            <View style={[styles.glow, {backgroundColor: promo.accent}]} />
            <View style={styles.bannerInner}>
              <View style={styles.bannerTextWrap}>
                <View style={[styles.badge, {backgroundColor: promo.deep}]}>
                  <Text style={styles.badgeText}>{promo.badge}</Text>
                </View>
                <Text style={[styles.bannerTitle, {color: promo.deep}]}>
                  {promo.title}
                </Text>
                <Text style={styles.bannerSubTitle}>{promo.subtitle}</Text>
                <Text style={[styles.highlightText, {color: promo.accent}]}>
                  {promo.highlight}
                </Text>
              </View>
              <View style={[styles.mascotCircle, {backgroundColor: promo.accent}]}>
                <Text style={styles.mascotText}>{promo.emoji}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {promos.map((promo, index) => (
          <View
            key={promo.key}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carousel: {
    marginTop: 16,
  },
  carouselContent: {
    paddingHorizontal: 14,
  },
  banner: {
    width: SLIDE_WIDTH,
    height: 138,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(15, 23, 42, 0.06)',
  },
  glow: {
    position: 'absolute',
    right: -40,
    top: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.22,
  },
  bannerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  bannerTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  bannerSubTitle: {
    marginTop: 2,
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
  },
  highlightText: {
    marginTop: 6,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  mascotCircle: {
    width: 78,
    height: 78,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 6},
    elevation: 4,
  },
  mascotText: {
    fontSize: 34,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#0284c7',
  },
});

export default PromoCarousel;
