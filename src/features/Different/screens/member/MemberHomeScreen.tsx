import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Barcode,
  ConfirmDialog,
  MemberHeader,
  MemberIcon,
  MemberMenuRow,
} from './MemberComponents';
import { BLUE, memberRows, MemberScreenName } from './memberData';

type MemberHomeScreenProps = {
  onBack: () => void;
  onOpen: (screen: MemberScreenName) => void;
};

function MemberHomeScreen({ onBack, onOpen }: MemberHomeScreenProps) {
  const [confirm, setConfirm] = useState<'logout' | 'delete' | null>(null);

  return (
    <View style={styles.screen}>
      <MemberHeader title="THÀNH VIÊN FILMGO" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>L</Text>
          </View>
          <Text style={styles.name}>Lê Thị Ngọc Anh</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeLabel}>Thẻ thành viên</Text>
            <Text style={styles.code}>9002000004094001</Text>
          </View>
          <Barcode />

          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Tổng chi tiêu</Text>
              <Text style={styles.summaryValue}>0 đ</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Điểm thưởng</Text>
              <Text style={styles.summaryValue}>0</Text>
            </View>
          </View>

          <Text style={styles.vipText}>
            Bạn cần tích luỹ thêm <Text style={styles.vipAmount}>3.000.000 đ</Text> để
            thăng hạng{'\n'}VIP
          </Text>
          <View style={styles.progressBar} />
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>0 đ</Text>
            <Text style={styles.progressText}>3.000.000 đ</Text>
          </View>
        </View>

        <View style={styles.rowList}>
          {memberRows.map(row => (
            <MemberMenuRow
              key={row.title}
              row={row}
              onPress={() => {
                if (row.screen) {
                  onOpen(row.screen);
                  return;
                }

                if (row.action === 'delete') {
                  setConfirm('delete');
                }
              }}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={() => setConfirm('logout')}>
          <MemberIcon name="logout" color="#fff" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmDialog
        visible={confirm === 'logout'}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất?"
        cancelText="Huỷ bỏ"
        confirmText="Đăng xuất"
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        visible={confirm === 'delete'}
        title="Xoá tài khoản"
        message={'Bạn có chắc chắn muốn xoá tài khoản?\nHành động này không thể hoàn tác.'}
        cancelText="Huỷ"
        confirmText="Xoá tài khoản"
        onClose={() => setConfirm(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    paddingBottom: 16,
  },
  profileCard: {
    margin: 6,
    marginTop: 14,
    padding: 18,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.7,
    borderColor: '#2a73bd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#1f7ed9',
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    color: '#111',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  codeLabel: {
    color: '#666',
    fontSize: 15,
    marginRight: 12,
  },
  code: {
    color: '#242424',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  summaryBox: {
    width: '100%',
    minHeight: 58,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#999',
  },
  summaryLabel: {
    color: '#242424',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#1b79d8',
    fontSize: 19,
    fontWeight: '900',
  },
  vipText: {
    textAlign: 'center',
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 24,
  },
  vipAmount: {
    color: '#ff4a3f',
    fontWeight: '900',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#aaa',
    marginTop: 12,
  },
  progressLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressText: {
    color: '#444',
    fontSize: 14,
  },
  rowList: {
    marginTop: 36,
  },
  logoutButton: {
    minHeight: 50,
    margin: 8,
    marginTop: 20,
    borderRadius: 8,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  logoutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
  },
});

export default MemberHomeScreen;
