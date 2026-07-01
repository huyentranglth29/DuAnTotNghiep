import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  EditBox,
  MemberHeader,
  MemberIcon,
  OptionSheet,
  PasswordInput,
  ProvinceSheet,
  SelectBox,
} from './MemberComponents';
import { BLUE, districts, provinces } from './memberData';

export function PointsScreen({
  onBack,
  onHistory,
}: {
  onBack: () => void;
  onHistory: () => void;
}) {
  return (
    <View style={styles.screen}>
      <MemberHeader
        title="ĐIỂM THÀNH VIÊN"
        onBack={onBack}
        rightIcon="history"
        onRightPress={onHistory}
      />
      <View style={styles.pointsCard}>
        <PointRow icon="trend" color="#37a4ff" label="Tổng điểm tích luỹ" />
        <PointRow icon="cart" color="#ff9817" label="Tổng điểm đã sử dụng" />
        <PointRow icon="wallet" color="#4ab460" label="Điểm hiện tại" bold />
      </View>
    </View>
  );
}

export function PointHistoryScreen({ onBack }: { onBack: () => void }) {
  return (
    <EmptyHistory
      title="LỊCH SỬ ĐIỂM"
      message="Bạn chưa có lịch sử tiêu điểm"
      onBack={onBack}
    />
  );
}

export function TransactionHistoryScreen({ onBack }: { onBack: () => void }) {
  return (
    <EmptyHistory
      title="LỊCH SỬ GIAO DỊCH"
      message="Bạn chưa có lịch sử giao dịch nào"
      receipt
      onBack={onBack}
    />
  );
}

export function MemberCardDetailScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <MemberHeader title="THẺ THÀNH VIÊN" onBack={onBack} />
      <View style={styles.cardDetail}>
        <View style={styles.memberCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.memberCardTitle}>Khách hàng STANDARD</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Đang sử dụng</Text>
            </View>
          </View>
          <Text style={styles.cardInfo}>Số thẻ: 9002000004094001</Text>
          <Text style={styles.cardInfo}>Ngày đăng ký: 30/06/2026</Text>
        </View>
      </View>
    </View>
  );
}

export function AccountInfoScreen({ onBack }: { onBack: () => void }) {
  const [editing, setEditing] = useState(false);
  const [gender, setGender] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [picker, setPicker] = useState<'gender' | 'province' | 'district' | null>(
    null,
  );
  const [search, setSearch] = useState('');
  const filtered = provinces.filter(item =>
    item.toLowerCase().includes(search.trim().toLowerCase()),
  );

  if (editing) {
    return (
      <View style={styles.screen}>
        <MemberHeader title="THÔNG TIN CÁ NHÂN" onBack={() => setEditing(false)} />
        <ScrollView contentContainerStyle={styles.formContent}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <EditBox label="Email" value="ngank301006@gmail.com" disabled required />
          <EditBox label="Họ và tên" value="Lê Thị Ngọc Anh" required />
          <SelectBox
            label="Giới tính"
            value={gender}
            placeholder="Chọn giới tính"
            onPress={() => setPicker('gender')}
          />
          <SelectBox
            label="Ngày sinh"
            value=""
            placeholder="Chọn ngày sinh"
            icon="calendar"
            onPress={() => undefined}
          />
          <Text style={[styles.sectionTitle, styles.sectionGap]}>Thông tin liên hệ</Text>
          <EditBox label="CMND/CCCD" placeholder="Nhập cmnd/cccd" />
          <EditBox label="Số điện thoại" value="0357276740" required />
          <SelectBox
            label="Tỉnh/Thành phố"
            value={province}
            placeholder="Chọn tỉnh/thành phố"
            onPress={() => setPicker('province')}
          />
          <SelectBox
            label="Quận/Huyện"
            value={district}
            placeholder="Chọn quận/huyện"
            onPress={() => setPicker('district')}
          />
          <EditBox label="Địa chỉ" placeholder="Nhập địa chỉ" />
          <TouchableOpacity style={styles.saveButton} onPress={() => setEditing(false)}>
            <Text style={styles.saveText}>Lưu thay đổi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
            <Text style={styles.cancelText}>Huỷ bỏ</Text>
          </TouchableOpacity>
        </ScrollView>
        <OptionSheet
          visible={picker === 'gender'}
          title="Giới tính"
          options={['Nam', 'Nữ', 'Khác']}
          onClose={() => setPicker(null)}
          onSelect={value => {
            setGender(value);
            setPicker(null);
          }}
        />
        <OptionSheet
          visible={picker === 'district'}
          title="Quận/Huyện"
          options={districts}
          onClose={() => setPicker(null)}
          onSelect={value => {
            setDistrict(value);
            setPicker(null);
          }}
        />
        <ProvinceSheet
          visible={picker === 'province'}
          search={search}
          options={filtered}
          onSearch={setSearch}
          onClose={() => setPicker(null)}
          onSelect={value => {
            setProvince(value);
            setDistrict('');
            setPicker(null);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <MemberHeader
        title="THÔNG TIN CÁ NHÂN"
        onBack={onBack}
        rightIcon="edit"
        onRightPress={() => setEditing(true)}
      />
      <ScrollView contentContainerStyle={styles.accountContent}>
        <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
        <Info label="Email" value="ngank301006@gmail.com" />
        <Info label="Họ và tên" value="Lê Thị Ngọc Anh" />
        <Info label="Giới tính" value={gender} />
        <Info label="Ngày sinh" />
        <Text style={[styles.sectionTitle, styles.sectionGap]}>Thông tin liên hệ</Text>
        <Info label="CMND/CCCD" />
        <Info label="Số điện thoại" value="0357276740" />
        <Info label="Tỉnh/Thành phố" value={province} />
        <Info label="Quận/Huyện" value={district} />
        <Info label="Địa chỉ" />
      </ScrollView>
    </View>
  );
}

export function ChangePasswordScreen({ onBack }: { onBack: () => void }) {
  const [values, setValues] = useState({ old: '', next: '', confirm: '' });
  const [visible, setVisible] = useState({ old: false, next: false, confirm: false });
  const [errors, setErrors] = useState({ old: '', next: '', confirm: '' });

  const submit = () => {
    setErrors({
      old: values.old ? '' : 'Vui lòng nhập mật khẩu hiện tại',
      next: !values.next
        ? 'Vui lòng nhập mật khẩu mới'
        : values.next.length < 6
          ? 'Mật khẩu phải chứa tối thiểu 6 kí tự'
          : '',
      confirm: !values.confirm
        ? 'Vui lòng xác nhận mật khẩu mới'
        : values.next !== values.confirm
          ? 'Mật khẩu xác nhận không khớp'
          : '',
    });
  };

  return (
    <View style={styles.screen}>
      <MemberHeader title="ĐỔI MẬT KHẨU" onBack={onBack} />
      <View style={styles.passwordContent}>
        <PasswordInput
          value={values.old}
          placeholder="Nhập mật khẩu hiện tại"
          visible={visible.old}
          error={errors.old}
          onChangeText={value => setValues(current => ({ ...current, old: value }))}
          onToggle={() => setVisible(current => ({ ...current, old: !current.old }))}
        />
        <PasswordInput
          value={values.next}
          placeholder="Nhập mật khẩu mới"
          visible={visible.next}
          error={errors.next}
          onChangeText={value => setValues(current => ({ ...current, next: value }))}
          onToggle={() => setVisible(current => ({ ...current, next: !current.next }))}
        />
        <PasswordInput
          value={values.confirm}
          placeholder="Xác nhận mật khẩu mới"
          visible={visible.confirm}
          error={errors.confirm}
          onChangeText={value => setValues(current => ({ ...current, confirm: value }))}
          onToggle={() =>
            setVisible(current => ({ ...current, confirm: !current.confirm }))
          }
        />
        <TouchableOpacity style={styles.changeButton} onPress={submit}>
          <Text style={styles.changeText}>Đổi mật khẩu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PointRow({
  icon,
  color,
  label,
  bold,
}: {
  icon: 'trend' | 'cart' | 'wallet';
  color: string;
  label: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.pointRow}>
      <View style={[styles.pointIcon, { backgroundColor: `${color}18` }]}>
        <MemberIcon name={icon} color={color} />
      </View>
      <Text style={[styles.pointLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.pointValue, bold && styles.green]}>0</Text>
    </View>
  );
}

function EmptyHistory({
  title,
  message,
  receipt,
  onBack,
}: {
  title: string;
  message: string;
  receipt?: boolean;
  onBack: () => void;
}) {
  return (
    <View style={styles.historyScreen}>
      <MemberHeader title={title} onBack={onBack} />
      <View style={styles.emptyWrap}>
        {receipt ? <ReceiptIcon /> : <MemberIcon name="history" color="#aaa" />}
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    </View>
  );
}

function ReceiptIcon() {
  return (
    <Svg width={70} height={70} viewBox="0 0 70 70">
      <Path
        d="M22 15h30v38c0 6-4 9-9 9H24c-6 0-10-4-10-10v-6h8V15z"
        fill="#c6c6c8"
      />
      <Path d="M29 28h17v5H29zM29 39h14v5H29z" fill="#dedcdc" />
    </Svg>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      {!!value && <Text style={styles.infoValue}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  historyScreen: {
    flex: 1,
    backgroundColor: '#dedcdc',
  },
  pointsCard: {
    margin: 16,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    elevation: 5,
  },
  pointRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  pointIcon: {
    width: 54,
    height: 54,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  pointLabel: {
    flex: 1,
    color: '#242424',
    fontSize: 20,
  },
  pointValue: {
    color: '#242424',
    fontSize: 25,
    fontWeight: '900',
  },
  bold: {
    fontWeight: '900',
  },
  green: {
    color: '#4ab460',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 90,
  },
  emptyText: {
    color: '#b7b4b4',
    fontSize: 22,
    marginTop: 16,
  },
  cardDetail: {
    padding: 16,
    paddingTop: 24,
  },
  memberCard: {
    borderWidth: 2,
    borderColor: '#31a1ff',
    borderRadius: 8,
    padding: 24,
    backgroundColor: '#fff',
    elevation: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberCardTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: '#050505',
  },
  badge: {
    backgroundColor: '#35a5ff',
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '900',
  },
  cardInfo: {
    color: '#333',
    fontSize: 20,
    marginTop: 10,
  },
  accountContent: {
    paddingHorizontal: 32,
    paddingTop: 24,
  },
  sectionTitle: {
    color: '#35358d',
    fontSize: 26,
    fontWeight: '900',
  },
  sectionGap: {
    marginTop: 26,
  },
  infoRow: {
    minHeight: 96,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    justifyContent: 'center',
  },
  infoLabel: {
    color: '#3f3f3f',
    fontSize: 24,
  },
  infoValue: {
    color: '#050505',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 14,
  },
  formContent: {
    padding: 24,
    paddingBottom: 28,
  },
  saveButton: {
    minHeight: 60,
    borderRadius: 10,
    backgroundColor: '#3f82f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },
  saveText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  cancelButton: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  cancelText: {
    color: '#f24b40',
    fontSize: 20,
    fontWeight: '900',
  },
  passwordContent: {
    paddingHorizontal: 8,
    paddingTop: 26,
  },
  changeButton: {
    minHeight: 74,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE,
    marginTop: 8,
  },
  changeText: {
    color: '#fff',
    fontSize: 25,
    fontWeight: '900',
  },
});
