import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';

interface TagUserModalProps {
  visible: boolean;
  onClose: () => void;
  onTag: (userName: string) => Promise<void>;
  currentUser: string;
}

export function TagUserModal({ visible, onClose, onTag, currentUser }: TagUserModalProps) {
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTag = async () => {
    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (userName.trim() === currentUser) {
      Alert.alert('Error', 'You cannot tag yourself');
      return;
    }

    setIsLoading(true);
    try {
      await onTag(userName.trim());
      setUserName('');
      onClose();
      Alert.alert('Success', `Tagged ${userName} to continue the story!`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to tag user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUserName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Tag Someone to Continue</Text>
          <Text style={styles.subtitle}>
            Who would you like to invite to add the next segment?
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter username..."
            placeholderTextColor="#666"
            value={userName}
            onChangeText={setUserName}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.tagButton, isLoading && styles.disabledButton]}
              onPress={handleTag}
              disabled={isLoading}
            >
              <Text style={styles.tagButtonText}>
                {isLoading ? 'Tagging...' : 'Tag User'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tagButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tagButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

