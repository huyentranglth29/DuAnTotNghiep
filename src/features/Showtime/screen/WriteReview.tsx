import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { postReview } from '../../../services/apiService';

type WriteReviewProps = {
    movieId: string | number;
    title: string;
    onBack: () => void;
};

export default function WriteReview({ movieId, title, onBack }: WriteReviewProps) {
    const [rating, setRating] = useState<number>(10);
    const [text, setText] = useState('');

    const submit = async () => {
        if (!movieId) {
            Alert.alert('Lỗi', 'Không xác định phim để đánh giá');
            return;
        }

        if (!text.trim()) {
            Alert.alert('Lưu ý', 'Vui lòng nhập cảm nhận của bạn');
            return;
        }

        try {
            await postReview({
                movieId,
                rating,
                text: text.trim(),
                tags: [],
            });

            Alert.alert('Hoàn tất', 'Gửi đánh giá thành công', [
                { text: 'OK', onPress: () => onBack() },
            ]);
        } catch (err: any) {
            Alert.alert('Lỗi', err?.message ?? 'Không gửi được đánh giá');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path d="M15 5L8 12l7 7" stroke="#005f98" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Viết đánh giá</Text>
                <View style={styles.headerSpacer} />
            </View>
            <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.title}>Viết đánh giá — {title}</Text>

                <Text style={styles.label}>Đánh giá (1-10)</Text>
                <View style={styles.ratingRow}>
                    {Array.from({ length: 10 }).map((_, i) => {
                        const val = i + 1;
                        const active = val <= rating;
                        return (
                            <TouchableOpacity key={val} onPress={() => setRating(val)} style={[styles.star, active && styles.starActive]}>
                                <Text style={active ? styles.starTextActive : styles.starText}>{val}</Text>
                            </TouchableOpacity>
                        );
                    })}
                    <View style={styles.scorePill}>
                        <Text style={styles.scoreText}>{rating}/10</Text>
                    </View>
                </View>

                <Text style={styles.label}>Cảm nhận thêm về bộ phim</Text>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="Viết cảm nhận của bạn..."
                    style={styles.textarea}
                    multiline
                    numberOfLines={6}
                />

                <TouchableOpacity style={styles.submitBtn} onPress={submit} activeOpacity={0.8}>
                    <Text style={styles.submitText}>Gửi đánh giá</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e6e6e6' },
    backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
    headerSpacer: { width: 24 },
    body: { padding: 18, paddingBottom: 40 },
    title: { fontSize: 20, fontWeight: '900', marginBottom: 16 },
    label: { fontSize: 14, color: '#333', fontWeight: '700', marginBottom: 8 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' },
    star: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f1f1', alignItems: 'center', justifyContent: 'center', marginRight: 8, marginBottom: 8 },
    starActive: { backgroundColor: '#ffd7e8' },
    starText: { color: '#666', fontWeight: '700' },
    starTextActive: { color: '#ff2d7a', fontWeight: '900' },
    scorePill: { marginLeft: 6, backgroundColor: '#fff0f0', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12 },
    scoreText: { color: '#ff7a00', fontWeight: '900' },
    textarea: { borderWidth: 1, borderColor: '#ececec', borderRadius: 10, padding: 12, textAlignVertical: 'top', backgroundColor: '#fff', marginBottom: 18 },
    submitBtn: { backgroundColor: '#ff2d7a', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: '900' },
});
