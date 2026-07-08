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
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE,
    paddingHorizontal: 18,
  },
  backButton: {
    width: 38,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginLeft: 12,
  },
  content: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 128,
  },
  heroWrap: {
    alignSelf: 'center',
    width: '68%',
    aspectRatio: 1.55,
    marginTop: 2,
  },
  hero: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#dfeaf2',
  },
  detailPinkTab: {
    left: -20,
    top: 58,
    backgroundColor: '#ff9ab2',
    transform: [{rotate: '-6deg'}],
  },
  detailOrangeTab: {
    right: 16,
    top: -10,
    backgroundColor: '#ff9726',
    transform: [{rotate: '4deg'}],
  },
  detailGreenTab: {
    right: -18,
    top: 6,
    backgroundColor: '#b8e345',
    transform: [{rotate: '8deg'}],
  },
  title: {
    color: TEXT,
    fontSize: 30,
    lineHeight: 37,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 31,
  },
  date: {
    color: MUTED,
    fontSize: 20,
    lineHeight: 27,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 11,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#dedede',
    marginTop: 24,
    marginBottom: 36,
  },
  articleImageWrap: {
    width: '100%',
    aspectRatio: 1.45,
    marginBottom: 28,
  },
  articleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
    backgroundColor: '#dfeaf2',
  },
  articlePinkTab: {
    left: -5,
    top: 76,
    backgroundColor: '#ff9ab2',
    transform: [{rotate: '-6deg'}],
  },
  articleOrangeTab: {
    right: 50,
    top: -13,
    backgroundColor: '#ff9726',
    transform: [{rotate: '4deg'}],
  },
  articleGreenTab: {
    right: -4,
    top: 5,
    backgroundColor: '#b8e345',
    transform: [{rotate: '8deg'}],
  },
  paragraph: {
    color: TEXT,
    fontSize: 25,
    lineHeight: 34,
    fontWeight: '800',
    marginBottom: 20,
  },
  shareWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  shareButton: {
    height: 86,
    borderRadius: 8,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareText: {
    color: '#ffffff',
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    marginLeft: 12,
  },
});

export default PromotionDetail;
