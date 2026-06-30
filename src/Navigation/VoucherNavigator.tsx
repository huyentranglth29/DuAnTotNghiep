import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function VoucherNavigator() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voucher</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    color: '#005f98',
    fontSize: 22,
    fontWeight: '800',
  },
});

export default VoucherNavigator;
