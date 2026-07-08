import React, {useState} from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  VOUCHER_BLUE,
  VOUCHER_BORDER,
  VOUCHER_MUTED,
  VOUCHER_SCREEN_BG,
  VOUCHER_TEXT,
} from '../constants';
import {
  GiftIcon,
  LockIcon,
  PlusIcon,
  QrIcon,
} from '../components/VoucherActionIcons';
import VoucherHeader from '../components/VoucherHeader';

type AddVoucherScreenProps = {
  onBack: () => void;
};

const ERROR_COLOR = '#ef4444';
const FOCUS_COLOR = '#3b82f6';

function AddVoucherScreen({onBack}: AddVoucherScreenProps) {
  const [voucherCode, setVoucherCode] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [voucherError, setVoucherError] = useState('');
  const [pinError, setPinError] = useState('');
  const [focusedField, setFocusedField] = useState<'voucher' | 'pin' | null>(
    null,
  );

  const isVoucherActive = focusedField === 'voucher';
  const isPinActive = focusedField === 'pin';

  const handleAddVoucher = () => {
    const isVoucherEmpty = voucherCode.trim().length === 0;
    const isPinEmpty = pinCode.trim().length === 0;

    setVoucherError(isVoucherEmpty ? 'Vui lòng nhập mã voucher' : '');
    setPinError(isPinEmpty ? 'Vui lòng nhập mã PIN' : '');

    if (isVoucherEmpty || isPinEmpty) {
      Alert.alert(
        'Thông báo',
        'Vui lòng nhập mã voucher và mã PIN trước khi thêm voucher.',
      );
      return;
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={VOUCHER_BLUE} />
      <VoucherHeader title="THÊM VOUCHER" onBack={onBack} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <GiftIcon color={VOUCHER_TEXT} size={68} strokeWidth={3.5} />
          </View>
          <Text style={styles.title}>Thêm voucher mới</Text>
          <Text style={styles.subtitle}>
            Nhập mã voucher và PIN để thêm vào tài khoản
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.fieldWrap}>
            {(isVoucherActive || !!voucherError) && (
              <Text
                style={[
                  styles.fieldLabel,
                  voucherError ? styles.fieldLabelError : styles.fieldLabelFocus,
                ]}>
                Mã voucher
              </Text>
            )}
            <View
              style={[
                styles.inputRow,
                isVoucherActive && styles.inputRowFocus,
                !!voucherError && styles.inputRowError,
              ]}>
              <GiftIcon
                color={
                  voucherError
                    ? ERROR_COLOR
                    : isVoucherActive
                      ? FOCUS_COLOR
                      : '#9b9b9b'
                }
                size={27}
                strokeWidth={2.7}
              />
              <TextInput
                value={voucherCode}
                placeholder={
                  isVoucherActive || voucherError
                    ? 'Nhập mã voucher của bạn'
                    : 'Mã voucher'
                }
                placeholderTextColor="#9a9a9a"
                onFocus={() => setFocusedField('voucher')}
                onBlur={() => setFocusedField(null)}
                onChangeText={text => {
                  setVoucherCode(text);
                  if (voucherError) {
                    setVoucherError('');
                  }
                }}
                style={styles.input}
              />
              <QrIcon color={voucherError ? ERROR_COLOR : '#9b9b9b'} />
            </View>
            {!!voucherError && (
              <Text style={styles.errorText}>{voucherError}</Text>
            )}
          </View>

          <View style={styles.fieldWrap}>
            {(isPinActive || !!pinError) && (
              <Text
                style={[
                  styles.fieldLabel,
                  pinError ? styles.fieldLabelError : styles.fieldLabelFocus,
                ]}>
                Mã PIN
              </Text>
            )}
            <View
              style={[
                styles.inputRow,
                isPinActive && styles.inputRowFocus,
                !!pinError && styles.inputRowError,
              ]}>
              <LockIcon
                color={
                  pinError
                    ? ERROR_COLOR
                    : isPinActive
                      ? FOCUS_COLOR
                      : '#9b9b9b'
                }
              />
              <TextInput
                value={pinCode}
                placeholder={
                  isPinActive || pinError ? 'Nhập mã PIN của voucher' : 'Mã PIN'
                }
                placeholderTextColor="#9a9a9a"
                secureTextEntry
                onFocus={() => setFocusedField('pin')}
                onBlur={() => setFocusedField(null)}
                onChangeText={text => {
                  setPinCode(text);
                  if (pinError) {
                    setPinError('');
                  }
                }}
                style={styles.input}
              />
            </View>
            {!!pinError && <Text style={styles.errorText}>{pinError}</Text>}
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            style={styles.submitButton}
            onPress={handleAddVoucher}>
            <PlusIcon color="#ffffff" size={31} strokeWidth={3} />
            <Text style={styles.submitText}>Thêm voucher</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: VOUCHER_SCREEN_BG,
  },
  content: {
    paddingHorizontal: 27,
    paddingTop: 37,
    paddingBottom: 34,
  },
  heroCard: {
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 22,
    paddingTop: 37,
    paddingBottom: 38,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 9},
    elevation: 2,
  },
  heroIconCircle: {
    width: 122,
    height: 122,
    borderRadius: 61,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5ea',
  },
  title: {
    marginTop: 28,
    color: VOUCHER_TEXT,
    fontSize: 31,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: VOUCHER_MUTED,
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'center',
  },
  formCard: {
    marginTop: 37,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 31,
    paddingVertical: 32,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 9},
    elevation: 2,
  },
  inputRow: {
    height: 92,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: VOUCHER_BORDER,
    borderRadius: 16,
    paddingHorizontal: 21,
    marginBottom: 26,
    backgroundColor: '#ffffff',
  },
  inputRowError: {
    borderColor: '#d93025',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    marginLeft: 18,
    color: VOUCHER_TEXT,
    fontSize: 23,
    lineHeight: 29,
    paddingVertical: 0,
  },
  errorText: {
    marginBottom: 16,
    color: '#d93025',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  submitButton: {
    height: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: VOUCHER_BLUE,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 4,
  },
  submitText: {
    marginLeft: 14,
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
  },
});

export default AddVoucherScreen;
