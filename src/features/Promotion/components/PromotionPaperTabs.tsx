import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';

type PromotionPaperTabsProps = {
  pinkStyle: StyleProp<ViewStyle>;
  orangeStyle: StyleProp<ViewStyle>;
  greenStyle: StyleProp<ViewStyle>;
  size?: 'compact' | 'regular';
};

function PromotionPaperTabs({
  pinkStyle,
  orangeStyle,
  greenStyle,
  size = 'regular',
}: PromotionPaperTabsProps) {
  const sizeStyle = size === 'compact' ? styles.compactTab : styles.regularTab;

  return (
    <>
      <View style={[styles.paperTab, sizeStyle, pinkStyle]} />
      <View style={[styles.paperTab, sizeStyle, orangeStyle]} />
      <View style={[styles.paperTab, sizeStyle, greenStyle]} />
    </>
  );
}

const styles = StyleSheet.create({
  paperTab: {
    position: 'absolute',
    borderRadius: 2,
  },
  compactTab: {
    width: 34,
    height: 50,
  },
  regularTab: {
    width: 46,
    height: 68,
  },
});

export default PromotionPaperTabs;
