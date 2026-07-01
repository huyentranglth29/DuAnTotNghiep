import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';

const BLUE = '#3f86ee';
const DARK_BLUE = '#2f3192';
const TEXT = '#222222';
const MUTED = '#9f9f9f';

type PorgotPassProps = {
  onBackToLogin?: () => void;
};

function PorgotPass({onBackToLogin}: PorgotPassProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        <View style={styles.heroIcon}>
          <ForgotPasswordIcon />
        </View>

        <Text style={styles.title}>Quên mật khẩu ?</Text>
        <Text style={styles.description}>
          Đừng lo, hãy nhập email đã đăng ký của bạn bên dưới để lấy lại mật khẩu
        </Text>

        <Text style={styles.label}>
          Địa chỉ Email <Text style={styles.required}>*</Text>
        </Text>

        <View style={styles.inputBox}>
          <MailIcon />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Nhập địa chỉ email"
            placeholderTextColor="#bdbdbd"
            style={styles.input}
          />
        </View>

        <TouchableOpacity activeOpacity={0.85} style={styles.submitButton}>
          <Text style={styles.submitText}>GỬI</Text>
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.backLoginButton}
          onPress={onBackToLogin}>
          <Text style={styles.backLoginText}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ForgotPasswordIcon() {
  return (
    <Svg width={190} height={180} viewBox="0 0 190 180" fill="none">
      <Path
        d="M62 84V48C62 22.6 81.7 6 106 6C130.3 6 150 22.6 150 48V84"
        stroke={DARK_BLUE}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <Path
        d="M81 84V50C81 36.2 91.6 25 106 25C120.4 25 131 36.2 131 50V84"
        stroke={DARK_BLUE}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <Rect
        x={43}
        y={78}
        width={126}
        height={82}
        rx={6}
        stroke={DARK_BLUE}
        strokeWidth={8}
      />
      <Path
        d="M91 91C48 91 14 113.5 14 141.5C14 156.1 23.3 169.2 38.1 178C37.5 187.4 31.7 194.2 23.5 199.7C36.4 198.3 47.3 194 55.2 187.5C66 190.4 78.2 192 91 192C134 192 168 169.5 168 141.5C168 113.5 134 91 91 91Z"
        fill="#ffffff"
        stroke={DARK_BLUE}
        strokeWidth={8}
        strokeLinejoin="round"
        transform="translate(0 -44)"
      />
      <Path
        d="M82 97C82 84.5 91.7 76 104.6 76C117 76 126 84.2 126 95.4C126 106.8 116.7 111.1 109.7 116.8C104.3 121.1 102.8 124.2 102.8 131"
        stroke={DARK_BLUE}
        strokeWidth={8}
        strokeLinecap="round"
      />
      <Path
        d="M103 148V149"
        stroke={DARK_BLUE}
        strokeWidth={10}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width={30} height={23} viewBox="0 0 30 23" fill="none">
      <Rect
        x={1.5}
        y={1.5}
        width={27}
        height={20}
        rx={1}
        stroke="#111111"
        strokeWidth={2}
      />
      <Path
        d="M2.5 3L15 13L27.5 3"
        stroke="#111111"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 20L11.5 12.5M27 20L18.5 12.5"
        stroke="#111111"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 36,
  },
  heroIcon: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: TEXT,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 28,
  },
  description: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 34,
  },
  label: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  required: {
    color: '#e23b3b',
  },
  inputBox: {
    height: 58,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#c7c7c7',
    borderRadius: 7,
    paddingHorizontal: 16,
    marginBottom: 31,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: TEXT,
    fontSize: 15,
    marginLeft: 16,
    paddingVertical: 0,
  },
  submitButton: {
    height: 59,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: BLUE,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  spacer: {
    flex: 1,
  },
  backLoginButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
  },
  backLoginText: {
    color: TEXT,
    fontSize: 15,
  },
});

export default PorgotPass;
