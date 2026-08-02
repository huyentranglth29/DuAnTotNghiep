import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useAuth} from '../contexts/AuthContext';

function AuthPromptModal() {
  const {
    authPrompt,
    dismissAuthPrompt,
    openLoginModal,
  } = useAuth();

  return (
    <Modal
      transparent
      visible={Boolean(authPrompt)}
      animationType="fade"
      onRequestClose={dismissAuthPrompt}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={dismissAuthPrompt} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{authPrompt?.title || 'Đăng nhập để tiếp tục'}</Text>
          <Text style={styles.message}>{authPrompt?.message}</Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.primaryButton}
              onPress={() => openLoginModal('login')}>
              <Text style={styles.primaryText}>
                {authPrompt?.primaryLabel || 'Đăng nhập'}
              </Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={dismissAuthPrompt}>
              <Text style={styles.secondaryText}>
                {authPrompt?.secondaryLabel || 'Để sau'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 18,
  },
  title: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  message: {
    color: '#374151',
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginTop: 18,
  },
  primaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#e51937',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryText: {
    color: '#334155',
    fontWeight: '800',
  },
});

export default AuthPromptModal;
