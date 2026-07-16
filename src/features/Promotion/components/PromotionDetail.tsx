import React from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {BackIcon, ShareIcon} from './PromotionIcons';
import PromotionPaperTabs from './PromotionPaperTabs';
import {PromotionItem} from '../types';

const BLUE = '#005f98';
const TEXT = '#242424';
const MUTED = '#9b9b9b';

type PromotionDetailProps = {
  item: PromotionItem;
  onBack: () => void;
  onShare: () => void;
};

function PromotionDetail({item, onBack, onShare}: PromotionDetailProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.75}
          hitSlop={12}
          style={styles.backButton}
          onPress={onBack}>
          <BackIcon />
        </TouchableOpacity>
        <Text numberOfLines={1} style={styles.headerTitle}>
          {item.title}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <PromotionPaperTabs
            size="compact"
            pinkStyle={styles.detailPinkTab}
            orangeStyle={styles.detailOrangeTab}
            greenStyle={styles.detailGreenTab}
          />
          <Image source={item.image} style={styles.hero} resizeMode="cover" />
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{item.publishedAt}</Text>
        <View style={styles.separator} />

        <View style={styles.articleImageWrap}>
          <PromotionPaperTabs
            size="compact"
            pinkStyle={styles.articlePinkTab}
            orangeStyle={styles.articleOrangeTab}
            greenStyle={styles.articleGreenTab}
          />
          <Image source={item.image} style={styles.articleImage} resizeMode="cover" />
        </View>

        {item.body.map(paragraph => (
          <Text key={paragraph} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}
      </ScrollView>

      <View style={styles.shareWrap}>
        <TouchableOpacity
          activeOpacity={0.86}
          style={styles.shareButton}
          onPress={onShare}>
          <ShareIcon />
          <Text style={styles.shareText}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 34,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '900',
    marginLeft: 10,
  },
  content: {
    paddingTop: 14,
    paddingHorizontal: 18,
    paddingBottom: 94,
  },
  heroWrap: {
    alignSelf: 'center',
    width: '62%',
    maxWidth: 270,
    aspectRatio: 1.58,
    marginTop: 2,
  },
  hero: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#dfeaf2',
  },
  detailPinkTab: {
    left: -16,
    top: 42,
    backgroundColor: '#ff9ab2',
    transform: [{rotate: '-6deg'}],
  },
  detailOrangeTab: {
    right: 14,
    top: -8,
    backgroundColor: '#ff9726',
    transform: [{rotate: '4deg'}],
  },
  detailGreenTab: {
    right: -14,
    top: 6,
    backgroundColor: '#b8e345',
    transform: [{rotate: '8deg'}],
  },
  title: {
    color: TEXT,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 24,
  },
  date: {
    color: MUTED,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#dedede',
    marginTop: 20,
    marginBottom: 28,
  },
  articleImageWrap: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 430,
    aspectRatio: 1.58,
    marginBottom: 24,
  },
  articleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#dfeaf2',
  },
  articlePinkTab: {
    left: -12,
    top: 58,
    backgroundColor: '#ff9ab2',
    transform: [{rotate: '-6deg'}],
  },
  articleOrangeTab: {
    right: 48,
    top: -12,
    backgroundColor: '#ff9726',
    transform: [{rotate: '4deg'}],
  },
  articleGreenTab: {
    right: -12,
    top: 5,
    backgroundColor: '#b8e345',
    transform: [{rotate: '8deg'}],
  },
  paragraph: {
    color: TEXT,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '800',
    marginBottom: 16,
  },
  shareWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  shareButton: {
    height: 60,
    borderRadius: 8,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    marginLeft: 10,
  },
});

export default PromotionDetail;
