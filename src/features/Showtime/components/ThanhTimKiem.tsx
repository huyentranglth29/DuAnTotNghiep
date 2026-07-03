import React from 'react';
import {StyleSheet, TextInput, TouchableOpacity, View} from 'react-native';

const BLUE = '#005f98';

type ThanhTimKiemProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
};

function ThanhTimKiem({value, onChangeText, onClose}: ThanhTimKiemProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.inputBox}>
        <TextInput
          autoFocus
          value={value}
          onChangeText={onChangeText}
          placeholder="Tìm tên phim..."
          placeholderTextColor="#a8a8a8"
          style={styles.input}
          returnKeyType="search"
        />
      </View>
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.closeButton}
        onPress={onClose}>
        <View style={styles.closeIcon}>
          <View style={[styles.closeLine, styles.closeLineA]} />
          <View style={[styles.closeLine, styles.closeLineB]} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f6f6f6',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d7d7d7',
    gap: 8,
  },
  inputBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dce3ea',
    paddingHorizontal: 12,
    minHeight: 42,
    justifyContent: 'center',
  },
  input: {
    color: '#1b1b1b',
    fontSize: 15,
    paddingVertical: 0,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dce3ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeLine: {
    position: 'absolute',
    width: 14,
    height: 2,
    backgroundColor: BLUE,
    borderRadius: 1,
  },
  closeLineA: {
    transform: [{rotate: '45deg'}],
  },
  closeLineB: {
    transform: [{rotate: '-45deg'}],
  },
});

export default ThanhTimKiem;
