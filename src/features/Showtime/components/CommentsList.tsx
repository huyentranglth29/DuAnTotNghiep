import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import CommentItem from './CommentItem';

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

export default function CommentsList({ comments }: { comments?: Comment[] }) {
    const data: Comment[] = comments ?? [
        {
            id: '1',
            author: 'Phan Phùng Tuyết Trinh',
            date: '05/07/2026',
            rating: 9,
            text: 'cừm hum bíc nói gì hơn quá là cuti, đợt này quá focus vào mấy bé minion nên rất phù hợp với mả...',
            tags: ['Hài hước', 'Cười banh rạp', 'Đáng xem'],
            images: [],
            likes: 57,
            replies: 2,
        },
        {
            id: '2',
            author: 'Vũ Thị Ngọc Tuyết',
            date: '04/07/2026',
            rating: 10,
            text: 'Bộ phim Minions này cả nhà dắt nhau đi xem nhé. Siêu hài vui và rất dễ thương.',
            tags: ['Hài hước', 'Cảm động'],
            images: [],
            likes: 12,
            replies: 0,
        },
    ];

    return (
        <View style={styles.wrapper}>
            <Text style={styles.header}>Đánh giá ({data.length})</Text>
            {data.map(c => (
                <CommentItem key={c.id} comment={c} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 12 },
    header: { fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 12 },
});
