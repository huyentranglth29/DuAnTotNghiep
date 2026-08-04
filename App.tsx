import React from 'react';
import {ActivityIndicator, Modal, StyleSheet, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import LoginNavigator from './src/Navigation/LoginNavigator';
import TabNavigator from './src/Navigation/TabNavigator';
import AuthPromptModal from './src/components/AuthPromptModal';
import PresenceHeartbeat from './src/components/PresenceHeartbeat';
import {AuthProvider, useAuth} from './src/contexts/AuthContext';
import {LanguageProvider} from './src/contexts/LanguageContext';
import QueryProvider from './src/providers/QueryProvider';

function AppShell() {
  const {
    status,
    loginVisible,
    loginInitialScreen,
    handleAuthenticated,
    closeLoginModal,
    logout,
  } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator size="large" color="#e51937" />
      </View>
    );
  }

  return (
    <>
      {status === 'authenticated' && <PresenceHeartbeat />}
      <TabNavigator onLoggedOut={logout} />
      <AuthPromptModal />
      <Modal
        visible={loginVisible}
        animationType="slide"
        onRequestClose={closeLoginModal}>
        <LoginNavigator
          key={`login-${loginVisible ? loginInitialScreen : 'closed'}`}
          initialScreen={loginInitialScreen}
          onAuthenticated={handleAuthenticated}
          onClose={closeLoginModal}
        />
      </Modal>
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <QueryProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </QueryProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});

export default App;
