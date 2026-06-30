import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const HEADER_BLUE = '#005f98';

type EmptyDetailScreenProps = {
  title: string;
  message: string;
  messagePosition: 'center' | 'top';
  showMore?: boolean;
  onBack: () => void;
};

function EmptyDetailScreen({
  title,
  message,
  messagePosition,
  showMore = false,
  onBack,
}: EmptyDetailScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.backButton}
          onPress={onBack}
        >
          <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <Path
              d="M17.5 5.5L9 14l8.5 8.5"
              stroke="#ffffff"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        {showMore && <Text style={styles.moreButton}>...</Text>}
      </View>

      <View
        style={[
          styles.body,
          messagePosition === 'center' ? styles.bodyCenter : styles.bodyTop,
        ]}
      >
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 64,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: HEADER_BLUE,
  },
  backButton: {
    width: 58,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0,
  },
  moreButton: {
    marginLeft: 'auto',
    paddingHorizontal: 18,
    paddingBottom: 8,
    color: '#333333',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  body: {
    flex: 1,
    alignItems: 'center',
  },
  bodyCenter: {
    justifyContent: 'center',
    paddingBottom: 80,
  },
  bodyTop: {
    justifyContent: 'flex-start',
    paddingTop: 28,
  },
  message: {
    color: '#666666',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '400',
  },
});

export default EmptyDetailScreen;
