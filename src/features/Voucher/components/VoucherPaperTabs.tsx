import React from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';

type VoucherPaperTabsProps = {
  pinkStyle: StyleProp<ViewStyle>;
  orangeStyle: StyleProp<ViewStyle>;
  greenStyle: StyleProp<ViewStyle>;
  size?: 'compact' | 'regular';
};

function VoucherPaperTabs({
  pinkStyle,
  orangeStyle,
  greenStyle,
  size = 'regular',
}: VoucherPaperTabsProps) {
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
    width: 40,
    height: 58,
  },
  regularTab: {
    width: 54,
    height: 80,
  },
});

export default VoucherPaperTabs;
