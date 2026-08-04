import React, { useState } from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {
  AccountInfoScreen,
  ChangePasswordScreen,
  MemberCardDetailScreen,
  PointHistoryScreen,
  PointsScreen,
  TransactionHistoryScreen,
} from './member/MemberDetailScreens';
import MemberHomeScreen from './member/MemberHomeScreen';
import { MemberScreenName } from './member/memberData';
import {useAuth} from '../../../contexts/AuthContext';
import {useLanguage} from '../../../contexts/LanguageContext';
import {t} from '../../../utils/i18n';

type MemberScreenProps = {
  onBack: () => void;
  onLogout: () => void;
};

function MemberScreen({ onBack, onLogout }: MemberScreenProps) {
  const {language} = useLanguage();
  const [screen, setScreen] = useState<MemberScreenName>('home');
  const {isAuthenticated, openLoginModal} = useAuth();

  if (!isAuthenticated) {
    return (
      <View style={styles.guestScreen}>
        <Text style={styles.guestTitle}>{t(language, 'Đăng nhập để đồng bộ và quản lý tài khoản', 'Log in to sync and manage your account')}</Text>
        <Text style={styles.guestText}>
          {t(language, 'Bạn vẫn có thể quay lại các tab khác bình thường.', 'You can still return to the other tabs normally.')}
        </Text>
        <Pressable style={styles.loginButton} onPress={() => openLoginModal('login')}>
          <Text style={styles.loginButtonText}>{t(language, 'Đăng nhập', 'Log in')}</Text>
        </Pressable>
        <Pressable style={styles.registerButton} onPress={() => openLoginModal('register')}>
          <Text style={styles.registerButtonText}>{t(language, 'Đăng ký', 'Register')}</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>{t(language, 'Quay lại', 'Back')}</Text>
        </Pressable>
      </View>
    );
  }

  if (screen === 'points') {
    return (
      <PointsScreen
        onBack={() => setScreen('home')}
        onHistory={() => setScreen('pointHistory')}
      />
    );
  }

  if (screen === 'pointHistory') {
    return <PointHistoryScreen onBack={() => setScreen('points')} />;
  }

  if (screen === 'transactions') {
    return <TransactionHistoryScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'card') {
    return <MemberCardDetailScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'account') {
    return <AccountInfoScreen onBack={() => setScreen('home')} />;
  }

  if (screen === 'changePassword') {
    return <ChangePasswordScreen onBack={() => setScreen('home')} />;
  }

  return <MemberHomeScreen onBack={onBack} onOpen={setScreen} onLogout={onLogout} />;
}

export default MemberScreen;

const styles = StyleSheet.create({
  guestScreen: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  guestTitle: {
    color: '#173247',
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  guestText: {
    marginTop: 12,
    color: '#54616f',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  loginButton: {
    width: '100%',
    minHeight: 46,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#e51937',
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  registerButton: {
    width: '100%',
    minHeight: 46,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  registerButtonText: {
    color: '#173247',
    fontWeight: '800',
  },
  backButton: {
    marginTop: 14,
  },
  backButtonText: {
    color: '#64748b',
    fontWeight: '700',
  },
});
