import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Comment = {
    id: string;
    author: string;
    date: string;
    rating?: number;
    text: string;
    tags?: string[];
    images?: any[];
    likes?: number;
    replies?: number;
};

export default function CommentItem({ comment }: { comment: Comment }) {
    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <View style={styles.avatar} />
                <View style={styles.meta}>
                    <Text style={styles.author}>{comment.author}</Text>
                    <Text style={styles.date}>{comment.date}</Text>
                </View>
                {comment.rating != null && (
                    <View style={styles.ratingPill}>
                        <Text style={styles.ratingText}>{comment.rating}/10</Text>
                    </View>
                )}
            </View>

            <Text style={styles.text} numberOfLines={3}>{comment.text}</Text>

            {comment.tags && (
                <View style={styles.tagsRow}>
                    {comment.tags.map(t => (
                        <View key={t} style={styles.tag}>
                            <Text style={styles.tagText}>{t}</Text>
                        </View>
                    ))}
                </View>
            )}

            {comment.images && comment.images.length > 0 && (
                <View style={styles.imagesRow}>
                    {comment.images.map((img, idx) => (
                        <Image key={String(idx)} source={img} style={styles.thumb} />
                    ))}
                </View>
            )}

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                    <Text style={styles.actionText}>👍 {comment.likes ?? 0}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
                    <Text style={styles.actionText}>💬 {comment.replies ?? 0}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 4,
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f1f1' },
    meta: { flex: 1, marginLeft: 10 },
    author: { fontWeight: '700', color: '#111', fontSize: 14 },
    date: { color: '#8a8a8a', fontSize: 12, marginTop: 2 },
    ratingPill: { backgroundColor: '#fff0f0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
    ratingText: { color: '#ff7a00', fontWeight: '800' },
    text: { color: '#333', fontSize: 14, lineHeight: 20, marginBottom: 8 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
    tag: { backgroundColor: '#f4f4f4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6 },
    tagText: { color: '#666', fontSize: 12 },
    imagesRow: { flexDirection: 'row', marginBottom: 8 },
    thumb: { width: 84, height: 56, borderRadius: 4, marginRight: 8, backgroundColor: '#eee' },
    actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f1f1', paddingTop: 8 },
    actionBtn: { marginRight: 12 },
    actionText: { color: '#666', fontWeight: '700' },
});
