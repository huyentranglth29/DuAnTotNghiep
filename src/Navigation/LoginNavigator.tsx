import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import Login from '../features/Login/Index';
import PorgotPass from '../features/Login/component/PorgotPass';
import Register from '../features/Login/component/Register';
import {
  clearAuthSession,
  loginWithApi,
  loginWithGoogleApi,
  registerWithApi,
} from '../services/voucherService';
import {
  configureGoogleSignIn,
  getGoogleIdToken,
  mapGoogleSignInError,
} from '../services/googleAuth';

type LoginScreen = 'login' | 'porgotPass' | 'register';
type RegisteredUser = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
};

type LoginNavigatorProps = {
  onAuthenticated?: () => void;
  onClose?: () => void;
  initialScreen?: LoginScreen;
};

const REGISTERED_USER_KEY = '@filmgo_registered_user';

/** Tài khoản demo — trùng user seed Mongo */
const SEED_DEMO_USER: RegisteredUser = {
  fullName: 'FilmGo User',
  email: 'user@filmgo.com',
  password: 'User@123456',
};

const isSameCredentials = (
  user: RegisteredUser,
  email: string,
  password: string,
) =>
  email.trim().toLowerCase() === user.email.trim().toLowerCase() &&
  password === user.password;

/** Alias cũ demo@filmgo.vn → tài khoản seed API */
const resolveLoginEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  if (normalized === 'demo@filmgo.vn') {
    return SEED_DEMO_USER.email;
  }
  return normalized;
};

function LoginNavigator({
  onAuthenticated,
  onClose,
  initialScreen = 'login',
}: LoginNavigatorProps) {
  const [activeScreen, setActiveScreen] = useState<LoginScreen>(initialScreen);
  const [registeredUser, setRegisteredUser] = useState<RegisteredUser | null>(
    null,
  );

  useEffect(() => {
    configureGoogleSignIn();
    loadRegisteredUser();
  }, []);

  const loadRegisteredUser = async () => {
    try {
      const savedUser = await AsyncStorage.getItem(REGISTERED_USER_KEY);
      if (savedUser) {
        setRegisteredUser(JSON.parse(savedUser));
      }
    } catch {
      setRegisteredUser(null);
    }
  };

  const saveRegisteredUser = async (user: RegisteredUser) => {
    setRegisteredUser(user);
    try {
      await AsyncStorage.setItem(REGISTERED_USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.warn('Không lưu được tài khoản xuống máy:', error);
    }
  };

  const findRegisteredUser = async () => {
    if (registeredUser) {
      return registeredUser;
    }
    try {
      const savedUser = await AsyncStorage.getItem(REGISTERED_USER_KEY);
      if (!savedUser) {
        return null;
      }
      const parsedUser = JSON.parse(savedUser) as RegisteredUser;
      setRegisteredUser(parsedUser);
      return parsedUser;
    } catch {
      return null;
    }
  };

  const content =
    activeScreen === 'porgotPass' ? (
      <PorgotPass onBackToLogin={() => setActiveScreen('login')} />
    ) : activeScreen === 'register' ? (
      <Register
        onBackToLogin={() => setActiveScreen('login')}
        onRegisterSuccess={async user => {
          await registerWithApi({
            fullName: user.fullName,
            email: user.email,
            password: user.password,
            phone: user.phone || '',
          });
          await saveRegisteredUser(user);
          setActiveScreen('login');
        }}
      />
    ) : (
      <Login
        onForgotPasswordPress={() => setActiveScreen('porgotPass')}
        onRegisterPress={() => setActiveScreen('register')}
        onGoogleLoginPress={async () => {
          try {
            const idToken = await getGoogleIdToken();
            await loginWithGoogleApi(idToken);
            onAuthenticated?.();
            return true;
          } catch (error) {
            const message = mapGoogleSignInError(error);
            if (message.includes('hủy đăng nhập')) {
              return false;
            }
            throw new Error(message);
          }
        }}
        onLoginPress={async ({email, password}) => {
          const apiEmail = resolveLoginEmail(email);
          const apiPassword =
            email.trim().toLowerCase() === 'demo@filmgo.vn' &&
            password === '123456'
              ? SEED_DEMO_USER.password
              : password;

          try {
            await loginWithApi({email: apiEmail, password: apiPassword});
            onAuthenticated?.();
            return true;
          } catch (loginError) {
            const localUser = await findRegisteredUser();
            if (localUser && isSameCredentials(localUser, email, password)) {
              try {
                await registerWithApi({
                  fullName: localUser.fullName,
                  email: localUser.email,
                  password: localUser.password,
                  phone: localUser.phone || '',
                });
              } catch {
                // Email đã có trên server
              }
              try {
                await loginWithApi({
                  email: localUser.email,
                  password: localUser.password,
                });
                onAuthenticated?.();
                return true;
              } catch {
                await clearAuthSession();
                return false;
              }
            }

            console.warn('Login API:', (loginError as Error)?.message);
            await clearAuthSession();
            return false;
          }
        }}
      />
    );

  return (
    <View style={styles.container}>
      {onClose ? (
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>Đóng</Text>
        </Pressable>
      ) : null}
      {content}
    </View>
  );
}

export default LoginNavigator;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 16,
    zIndex: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  closeText: {
    color: '#111827',
    fontWeight: '900',
  },
});
