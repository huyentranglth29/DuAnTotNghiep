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
import {
  claimVoucher,
  restoreAuthSession,
} from '../../../services/voucherService';

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
  const [submitting, setSubmitting] = useState(false);

  const isVoucherActive = focusedField === 'voucher';
  const isPinActive = focusedField === 'pin';

  const handleAddVoucher = async () => {
    const isVoucherEmpty = voucherCode.trim().length === 0;
    setVoucherError(isVoucherEmpty ? 'Vui lòng nhập mã voucher' : '');
    setPinError('');

    if (isVoucherEmpty) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã voucher trước khi thêm.');
      return;
    }

    // PIN tùy chọn — nếu có thì chỉ cần trùng 4 ký tự cuối mã (UX giữ form cũ)
    if (pinCode.trim()) {
      const expected = voucherCode.trim().slice(-4).toUpperCase();
      if (pinCode.trim().toUpperCase() !== expected) {
        setPinError('Mã PIN không khớp (gợi ý: 4 ký tự cuối mã voucher)');
        return;
      }
    }

    setSubmitting(true);
    try {
      const token = await restoreAuthSession();
      if (!token) {
        Alert.alert(
          'Cần đăng nhập',
          'Đăng nhập bằng tài khoản backend (vd: user@filmgo.com / User@123456) để lưu voucher vào kho.',
        );
        return;
      }

      const result = await claimVoucher(voucherCode);
      Alert.alert('Thành công', `Đã thêm ${result?.code || voucherCode} vào kho`, [
        {text: 'OK', onPress: onBack},
      ]);
    } catch (err) {
      const message = (err as Error)?.message || 'Không thêm được voucher';
      setVoucherError(message);
      Alert.alert('Thất bại', message);
    } finally {
      setSubmitting(false);
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
            <GiftIcon color={VOUCHER_TEXT} size={48} strokeWidth={3.2} />
          </View>
          <Text style={styles.title}>Thêm voucher mới</Text>
          <Text style={styles.subtitle}>
            Nhập mã voucher từ FilmGo (PIN tùy chọn — 4 ký tự cuối mã)
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
                autoCapitalize="characters"
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
                Mã PIN (tuỳ chọn)
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
                  isPinActive || pinError
                    ? '4 ký tự cuối mã (tuỳ chọn)'
                    : 'Mã PIN (tuỳ chọn)'
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
            disabled={submitting}
            style={[styles.submitButton, submitting && {opacity: 0.7}]}
            onPress={handleAddVoucher}>
            <PlusIcon color="#ffffff" size={24} strokeWidth={3} />
            <Text style={styles.submitText}>
              {submitting ? 'Đang thêm...' : 'Thêm voucher'}
            </Text>
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
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 34,
  },
  heroCard: {
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 26,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},
    elevation: 2,
  },
  heroIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff5ea',
  },
  title: {
    marginTop: 18,
    color: VOUCHER_TEXT,
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: VOUCHER_MUTED,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  formCard: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},
    elevation: 2,
  },
  fieldWrap: {},
  fieldLabel: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldLabelFocus: {
    color: FOCUS_COLOR,
  },
  fieldLabelError: {
    color: ERROR_COLOR,
  },
  inputRow: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: VOUCHER_BORDER,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
    backgroundColor: '#ffffff',
  },
  inputRowFocus: {
    borderColor: FOCUS_COLOR,
  },
  inputRowError: {
    borderColor: '#d93025',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    color: VOUCHER_TEXT,
    fontSize: 16,
    lineHeight: 22,
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
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: VOUCHER_BLUE,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 4,
  },
  submitText: {
    marginLeft: 10,
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
});

export default AddVoucherScreen;
