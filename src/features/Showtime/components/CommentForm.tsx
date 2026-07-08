import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function CommentForm({ onSend }: { onSend?: (text: string) => void }) {
    const [text, setText] = useState('');

    const send = () => {
        if (!text.trim()) return;
        onSend?.(text.trim());
        setText('');
    };

    return (
        <View style={styles.form}>
            <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Viết bình luận..."
                style={styles.input}
                multiline
            />
            <TouchableOpacity style={styles.btn} onPress={send} activeOpacity={0.8}>
                <Text style={styles.btnText}>Gửi</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    form: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 20 },
    input: {
        minHeight: 44,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e6e6e6',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fff',
        marginBottom: 8,
    },
    btn: { backgroundColor: '#ff2d7a', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: '800' },
});
