import React, {useState} from 'react';
import {
  Alert,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

const ORANGE = '#cf7a00';
const TEXT_GRAY = '#b8b8b8';
const LOGO_IMAGE = require('../../assets/logo/filmgo-logo.png');

type LoginProps = {
  onForgotPasswordPress?: () => void;
  onRegisterPress?: () => void;
  onLoginPress?: (credentials: {
    email: string;
    password: string;
  }) => boolean | Promise<boolean>;
  onGoogleLoginPress?: () => boolean | Promise<boolean>;
};

function Login({
  onForgotPasswordPress,
  onRegisterPress,
  onLoginPress,
  onGoogleLoginPress,
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isGoogleLoggingIn, setIsGoogleLoggingIn] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập email và mật khẩu.');
      return;
    }

    setIsLoggingIn(true);

    try {
      const isSuccess = await onLoginPress?.({email, password});

      if (isSuccess) {
        Alert.alert('Thành công', 'Đăng nhập thành công.');
        return;
      }

      Alert.alert(
        'Thông báo',
        'Email hoặc mật khẩu không đúng.',
      );
    } catch (error) {
      Alert.alert(
        'Đăng nhập thất bại',
        error instanceof Error
          ? error.message
          : 'Không thể đăng nhập. Vui lòng thử lại.',
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!onGoogleLoginPress || isGoogleLoggingIn || isLoggingIn) {
      return;
    }

    setIsGoogleLoggingIn(true);
    try {
      const isSuccess = await onGoogleLoginPress();
      if (isSuccess) {
        Alert.alert('Thành công', 'Đăng nhập Google thành công.');
      }
    } catch (error) {
      Alert.alert(
        'Đăng nhập Google thất bại',
        error instanceof Error
          ? error.message
          : 'Không thể đăng nhập bằng Google.',
      );
    } finally {
      setIsGoogleLoggingIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.content}>
        <View style={styles.logoWrap}>
          <Image source={LOGO_IMAGE} style={styles.logoImage} />
        </View>

        <View style={styles.inputBox}>
          <MailIcon />
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email hoặc tên đăng nhập"
            placeholderTextColor={TEXT_GRAY}
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
        </View>

        <View style={styles.inputBox}>
          <LockIcon />
          <TextInput
            placeholder="Mật khẩu"
            placeholderTextColor={TEXT_GRAY}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={securePassword}
            style={styles.input}
          />
          <Pressable
            hitSlop={12}
            style={styles.eyeButton}
            onPress={() => setSecurePassword(value => !value)}>
            {securePassword ? <EyeOffIcon /> : <EyeIcon />}
          </Pressable>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.forgotButton}
          onPress={onForgotPasswordPress}>
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={isLoggingIn ? 1 : 0.85}
          disabled={isLoggingIn}
          style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
          onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>
            {isLoggingIn ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={isGoogleLoggingIn ? 1 : 0.85}
          disabled={isGoogleLoggingIn || isLoggingIn}
          style={[
            styles.googleButton,
            isGoogleLoggingIn && styles.loginButtonDisabled,
          ]}
          onPress={handleGoogleLogin}>
          <GoogleIcon />
          <Text style={styles.googleButtonText}>
            {isGoogleLoggingIn
              ? 'ĐANG ĐĂNG NHẬP GOOGLE...'
              : 'Tiếp tục với Google'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.registerButton}
          onPress={onRegisterPress}>
          <Text style={styles.registerText}>Đăng kí tài khoản FilmGo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MailIcon() {
  return (
    <Svg width={31} height={24} viewBox="0 0 31 24" fill="none">
      <Rect
        x={1.5}
        y={1.5}
        width={28}
        height={21}
        rx={1}
        stroke="#111111"
        strokeWidth={2}
      />
      <Path
        d="M2.5 3L15.5 14L28.5 3"
        stroke="#111111"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 21L12 12.8M28 21L19 12.8"
        stroke="#111111"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={28} height={35} viewBox="0 0 28 35" fill="none">
      <Rect
        x={3}
        y={14}
        width={22}
        height={18}
        rx={2}
        stroke="#111111"
        strokeWidth={3}
      />
      <Path
        d="M8 14V9.5C8 5.36 10.69 2 14 2C17.31 2 20 5.36 20 9.5V14"
        stroke="#111111"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Circle cx={14} cy={23} r={2.2} fill="#111111" />
      <Path
        d="M14 24.5V28"
        stroke="#111111"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function EyeOffIcon() {
  return (
    <Svg width={33} height={25} viewBox="0 0 33 25" fill="none">
      <Path
        d="M2 12.5C5.7 6.6 10.5 3.7 16.5 3.7C22.5 3.7 27.3 6.6 31 12.5C29.8 14.4 28.5 16 27 17.3"
        stroke="#9d9d9d"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21.2 15.8C20.2 17 18.5 17.8 16.5 17.8C13.4 17.8 11 15.4 11 12.5C11 10.5 12.2 8.8 13.9 7.9"
        stroke="#9d9d9d"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M5 2L28 23"
        stroke="#9d9d9d"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function EyeIcon() {
  return (
    <Svg width={33} height={25} viewBox="0 0 33 25" fill="none">
      <Path
        d="M2 12.5C5.7 6.6 10.5 3.7 16.5 3.7C22.5 3.7 27.3 6.6 31 12.5C27.3 18.4 22.5 21.3 16.5 21.3C10.5 21.3 5.7 18.4 2 12.5Z"
        stroke="#9d9d9d"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={16.5} cy={12.5} r={5} stroke="#9d9d9d" strokeWidth={3} />
    </Svg>
  );
}

function GoogleIcon() {
  return (
    <Svg width={25} height={25} viewBox="0 0 25 25" fill="none">
      <Path
        d="M23.5 12.78C23.5 11.91 23.42 11.08 23.27 10.27H12.74V14.6H18.77C18.51 16 17.72 17.19 16.53 17.99V20.8H20.15C22.27 18.85 23.5 15.98 23.5 12.78Z"
        fill="#4285F4"
      />
      <Path
        d="M12.74 23.7C15.77 23.7 18.31 22.7 20.15 20.8L16.53 17.99C15.53 18.66 14.25 19.06 12.74 19.06C9.82 19.06 7.34 17.09 6.45 14.44H2.71V17.34C4.54 21 8.33 23.7 12.74 23.7Z"
        fill="#34A853"
      />
      <Path
        d="M6.45 14.44C6.22 13.77 6.1 13.05 6.1 12.31C6.1 11.57 6.22 10.85 6.45 10.18V7.28H2.71C1.95 8.79 1.52 10.5 1.52 12.31C1.52 14.12 1.95 15.83 2.71 17.34L6.45 14.44Z"
        fill="#FBBC05"
      />
      <Path
        d="M12.74 5.56C14.39 5.56 15.87 6.13 17.03 7.24L20.23 4.04C18.3 2.23 15.76 1.12 12.74 1.12C8.33 1.12 4.54 3.82 2.71 7.28L6.45 10.18C7.34 7.53 9.82 5.56 12.74 5.56Z"
        fill="#EA4335"
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
    paddingHorizontal: 22,
    paddingTop: 56,
    paddingBottom: 24,
  },
  logoWrap: {
    width: 132,
    height: 132,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: '#061528',
    marginBottom: 58,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  inputBox: {
    height: 56,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#c9c9c9',
    borderRadius: 7,
    marginBottom: 25,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
    color: '#222222',
    fontSize: 16,
    paddingVertical: 0,
  },
  eyeButton: {
    height: 44,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgotButton: {
    alignSelf: 'flex-start',
    marginLeft: 9,
    marginBottom: 42,
  },
  forgotText: {
    color: '#3497e8',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  loginButton: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    backgroundColor: ORANGE,
    marginBottom: 19,
    shadowColor: '#d25f2f',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.55,
    shadowRadius: 5,
    elevation: 4,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  googleButton: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#ffffff',
  },
  googleButtonText: {
    color: '#222222',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 10,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 'auto',
    marginBottom: 118,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e2e2',
  },
  dividerText: {
    color: '#777777',
    fontSize: 15,
    marginHorizontal: 16,
  },
  registerButton: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  registerText: {
    color: '#222222',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Login;
