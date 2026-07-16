import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PromotionPaperTabs from './PromotionPaperTabs';
import { PromotionItem } from '../types';

const BLUE = '#005f98';
const TEXT = '#242424';
const BORDER = '#eeeeee';

type PromotionCardProps = {
  item: PromotionItem;
  onPress: () => void;
};

function PromotionCard({ item, onPress }: PromotionCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.86} style={styles.card} onPress={onPress}>
      <View style={styles.thumbWrap}>
        <PromotionPaperTabs
          size="compact"
          pinkStyle={styles.paperTabPink}
          orangeStyle={styles.paperTabOrange}
          greenStyle={styles.paperTabGreen}
        />
        <Image source={item.image} style={styles.thumb} resizeMode="cover" />
        <View style={styles.brandStrip}>
          <Text style={styles.brandFilm}>film</Text>
          <Text style={styles.brandGo}>go</Text>
        </View>
      </View>
      <View style={styles.cardTextWrap}>
        <Text style={styles.cardTitle}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 118,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BORDER,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    overflow: 'hidden',
  },
  thumbWrap: {
    width: '43%',
    height: 92,
    marginLeft: 12,
    justifyContent: 'flex-end',
  },
  paperTabPink: {
    left: -7,
    top: 30,
    backgroundColor: '#ff9ab2',
    transform: [{ rotate: '-6deg' }],
  },
  paperTabOrange: {
    right: 10,
    top: -7,
    backgroundColor: '#ff9726',
    transform: [{ rotate: '3deg' }],
  },
  paperTabGreen: {
    right: -6,
    top: 5,
    backgroundColor: '#b8e345',
    transform: [{ rotate: '7deg' }],
  },
  thumb: {
    width: '100%',
    height: 84,
    borderRadius: 4,
    backgroundColor: '#dfeaf2',
  },
  brandStrip: {
    height: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingLeft: 2,
  },
  brandFilm: {
    color: BLUE,
    fontSize: 8,
    fontWeight: '800',
  },
  brandGo: {
    color: '#7cb342',
    fontSize: 8,
    fontWeight: '800',
  },
  cardTextWrap: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 12,
  },
  cardTitle: {
    color: TEXT,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
});

export default PromotionCard;
