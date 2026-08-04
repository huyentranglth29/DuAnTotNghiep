import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import CommentItem from './CommentItem';
import {useLanguage} from '../../../contexts/LanguageContext';
import {t} from '../../../utils/i18n';

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
    verifiedViewer?: boolean;
};

export default function CommentsList({ comments }: { comments?: Comment[] }) {
    const {language} = useLanguage();
    const isEnglish = language === 'en';
    const data: Comment[] = comments ?? [];

    return (
        <View style={styles.wrapper}>
            <Text style={styles.header}>{t(language, `Đánh giá (${data.length})`, `Reviews (${data.length})`)}</Text>
            {data.length > 0 ? (
                data.map(c => (
                    <CommentItem key={c.id} comment={c} />
                ))
            ) : (
                <Text style={styles.emptyText}>{t(language, 'Chưa có đánh giá về phim này.', 'No reviews for this movie yet.')}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 12 },
    header: { fontSize: 20, fontWeight: '900', color: '#111', marginBottom: 12 },
    emptyText: { color: '#777777', fontSize: 14, lineHeight: 20 },
});
