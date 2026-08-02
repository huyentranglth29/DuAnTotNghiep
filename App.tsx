import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import LoginNavigator from './src/Navigation/LoginNavigator';
import TabNavigator from './src/Navigation/TabNavigator';
import PresenceHeartbeat from './src/components/PresenceHeartbeat';
import QueryProvider from './src/providers/QueryProvider';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {restoreAuthSession} from './src/services/voucherService';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    restoreAuthSession()
      .then(token => {
        if (mounted && token) {
          setIsLoggedIn(true);
        }
      })
      .finally(() => {
        if (mounted) {
          setCheckingSession(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (checkingSession) {
    return (
      <SafeAreaProvider>
        <View style={styles.bootScreen}>
          <ActivityIndicator size="large" color="#e51937" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryProvider>
        {!isLoggedIn ? (
          <LoginNavigator onAuthenticated={() => setIsLoggedIn(true)} />
        ) : (
          <>
            <PresenceHeartbeat />
            <TabNavigator onLoggedOut={() => setIsLoggedIn(false)} />
          </>
        )}
      </QueryProvider>
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
