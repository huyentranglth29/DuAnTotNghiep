import React, { useEffect, useRef, useState } from 'react';
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
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
    ?.NODE_ENV === 'test';

const promos = [
  {
    key: 'beta-16k',
    backgroundColor: '#bde874',
    title: 'BẮT MOOD DELULU',
    subTitle: 'TỚI BETA VI VU',
    highlight: '16K',
    accentColor: '#ff7900',
    mascot: 'AI',
  },
  {
    key: 'popcorn',
    backgroundColor: '#8ddbf1',
    title: 'FilmGo',
    subTitle: '2 3 HẠT BẮP LUẬN',
    highlight: 'COMBO',
    accentColor: '#2c8bd6',
    mascot: 'B',
  },
  {
    key: 'pepsi',
    backgroundColor: '#51311f',
    title: 'MUA 1 LY MINIONS',
    subTitle: 'FILL PEPSI',
    highlight: 'FREE',
    accentColor: '#ff8a00',
    mascot: 'P',
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
    }, 2800);

    return () => clearInterval(timer);
  }, []);

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH);
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
          <View
            key={promo.key}
            style={[styles.banner, { backgroundColor: promo.backgroundColor }]}>
            <View style={styles.bannerTextWrap}>
              <Text style={styles.bannerTitle}>{promo.title}</Text>
              <Text style={[styles.bannerSubTitle, { color: promo.accentColor }]}>
                {promo.subTitle}
              </Text>
              <Text style={styles.highlightText}>{promo.highlight}</Text>
            </View>
            <View style={[styles.mascotCircle, { backgroundColor: promo.accentColor }]}>
              <Text style={styles.mascotText}>{promo.mascot}</Text>
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
    height: 126,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    color: '#0874b6',
    fontSize: 15,
    fontWeight: '900',
  },
  bannerSubTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  highlightText: {
    color: '#ffffff',
    fontSize: 39,
    fontWeight: '900',
    marginTop: 4,
    textShadowColor: '#ff8a00',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 1,
  },
  mascotCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  mascotText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#a8adb2',
  },
  dotActive: {
    width: 34,
    backgroundColor: '#1b9de2',
  },
});

export default PromoCarousel;
