import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import {resolveMediaUrl} from '../../../../config/api.config';
import {
  AUTH_USER_KEY,
  getAuthProfile,
  updateAuthProfile,
} from '../../../../services/voucherService';
import {
  DatePickerModal,
  EditBox,
  formatBirthDate,
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

type ProfileForm = {
  email: string;
  fullName: string;
  gender: string;
  birthDate: Date | null;
  idCard: string;
  phone: string;
  province: string;
  district: string;
  address: string;
  avatar: string;
};

const emptyProfile = (): ProfileForm => ({
  email: '',
  fullName: '',
  gender: '',
  birthDate: null,
  idCard: '',
  phone: '',
  province: '',
  district: '',
  address: '',
  avatar: '',
});

function parseBirthDate(value?: string | Date | null) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapUserToForm(user: Record<string, any> | null | undefined): ProfileForm {
  return {
    email: user?.email || '',
    fullName: user?.fullName || '',
    gender: user?.gender || '',
    birthDate: parseBirthDate(user?.birthDate),
    idCard: user?.idCard || '',
    phone: user?.phone || '',
    province: user?.province || '',
    district: user?.district || '',
    address: user?.address || '',
    avatar: user?.avatar || '',
  };
}

export function AccountInfoScreen({ onBack }: { onBack: () => void }) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [draft, setDraft] = useState<ProfileForm>(emptyProfile);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear() - 18, now.getMonth(), 1);
  });
  const [picker, setPicker] = useState<'gender' | 'province' | 'district' | null>(
    null,
  );
  const [search, setSearch] = useState('');
  const filtered = provinces.filter(item =>
    item.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const applyUser = useCallback((user: Record<string, any> | null | undefined) => {
    const next = mapUserToForm(user);
    setProfile(next);
    setDraft(next);
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const cached = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (cached) {
        applyUser(JSON.parse(cached));
      }
      const user = await getAuthProfile();
      applyUser(user);
    } catch (err: any) {
      setError(err?.message || 'Không tải được thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const startEditing = () => {
    setDraft(profile);
    setError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setError('');
    setEditing(false);
  };

  const saveProfile = async () => {
    const fullName = draft.fullName.trim();
    if (!fullName) {
      setError('Vui lòng nhập họ và tên');
      return;
    }
    if (!draft.phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await updateAuthProfile({
        fullName,
        phone: draft.phone.trim(),
        gender: draft.gender,
        birthDate: draft.birthDate ? draft.birthDate.toISOString() : null,
        idCard: draft.idCard.trim(),
        province: draft.province,
        district: draft.district,
        address: draft.address.trim(),
      });
      applyUser(response?.user);
      setEditing(false);
      Alert.alert('Thành công', 'Đã lưu thông tin cá nhân');
    } catch (err: any) {
      setError(err?.message || 'Không lưu được thông tin');
    } finally {
      setSaving(false);
    }
  };

  const active = editing ? draft : profile;
  const avatarUri = resolveMediaUrl(active.avatar);
  const avatarLetter =
    (active.fullName || active.email || 'F').trim().charAt(0).toUpperCase() || 'F';

  const avatarBlock = (
    <View style={styles.avatarCard}>
      <View style={styles.avatarWrap}>
        {avatarUri ? (
          <Image source={{uri: avatarUri}} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
        )}
      </View>
      <Text style={styles.avatarName}>{active.fullName || 'Thành viên FilmGo'}</Text>
      {!!active.email && <Text style={styles.avatarEmail}>{active.email}</Text>}
    </View>
  );

  if (editing) {
    return (
      <View style={styles.screen}>
        <MemberHeader title="THÔNG TIN CÁ NHÂN" onBack={cancelEditing} />
        <ScrollView contentContainerStyle={styles.formContent}>
          {avatarBlock}
          {!!error && <Text style={styles.errorText}>{error}</Text>}
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <EditBox label="Email" value={draft.email} disabled required />
          <EditBox
            label="Họ và tên"
            value={draft.fullName}
            placeholder="Nhập họ và tên"
            required
            onChangeText={value => setDraft(current => ({...current, fullName: value}))}
          />
          <SelectBox
            label="Giới tính"
            value={draft.gender}
            placeholder="Chọn giới tính"
            onPress={() => setPicker('gender')}
          />
          <SelectBox
            label="Ngày sinh"
            value={draft.birthDate ? formatBirthDate(draft.birthDate) : ''}
            placeholder="Chọn ngày sinh"
            icon="calendar"
            onPress={() => setShowCalendar(true)}
          />
          <Text style={[styles.sectionTitle, styles.sectionGap]}>Thông tin liên hệ</Text>
          <EditBox
            label="CMND/CCCD"
            value={draft.idCard}
            placeholder="Nhập cmnd/cccd"
            onChangeText={value => setDraft(current => ({...current, idCard: value}))}
          />
          <EditBox
            label="Số điện thoại"
            value={draft.phone}
            placeholder="Nhập số điện thoại"
            required
            onChangeText={value => setDraft(current => ({...current, phone: value}))}
          />
          <SelectBox
            label="Tỉnh/Thành phố"
            value={draft.province}
            placeholder="Chọn tỉnh/thành phố"
            onPress={() => setPicker('province')}
          />
          <SelectBox
            label="Quận/Huyện"
            value={draft.district}
            placeholder="Chọn quận/huyện"
            onPress={() => setPicker('district')}
          />
          <EditBox
            label="Địa chỉ"
            value={draft.address}
            placeholder="Nhập địa chỉ"
            onChangeText={value => setDraft(current => ({...current, address: value}))}
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelOutlineBtn}
              onPress={cancelEditing}
              disabled={saving}
            >
              <Text style={styles.cancelOutlineText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, styles.saveButtonFlex, saving && styles.btnDisabled]}
              onPress={saveProfile}
              disabled={saving}
            >
              <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        <OptionSheet
          visible={picker === 'gender'}
          title="Giới tính"
          options={['Nam', 'Nữ', 'Khác']}
          onClose={() => setPicker(null)}
          onSelect={value => {
            setDraft(current => ({...current, gender: value}));
            setPicker(null);
          }}
        />
        <OptionSheet
          visible={picker === 'district'}
          title="Quận/Huyện"
          options={districts}
          onClose={() => setPicker(null)}
          onSelect={value => {
            setDraft(current => ({...current, district: value}));
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
            setDraft(current => ({...current, province: value, district: ''}));
            setPicker(null);
          }}
        />
        <DatePickerModal
          visible={showCalendar}
          currentMonth={calendarMonth}
          selectedDate={draft.birthDate}
          onClose={() => setShowCalendar(false)}
          onChangeMonth={setCalendarMonth}
          onSelectDate={date => {
            setDraft(current => ({...current, birthDate: date}));
            setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            setShowCalendar(false);
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
        onRightPress={startEditing}
      />
      <ScrollView contentContainerStyle={styles.accountContent}>
        {loading ? <Text style={styles.loadingText}>Đang tải thông tin...</Text> : null}
        {avatarBlock}
        {!!error && <Text style={styles.errorText}>{error}</Text>}
        <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
        <Info label="Email" value={profile.email} />
        <Info label="Họ và tên" value={profile.fullName} />
        <Info label="Giới tính" value={profile.gender} />
        <Info
          label="Ngày sinh"
          value={profile.birthDate ? formatBirthDate(profile.birthDate) : ''}
        />
        <Text style={[styles.sectionTitle, styles.sectionGap]}>Thông tin liên hệ</Text>
        <Info label="CMND/CCCD" value={profile.idCard} />
        <Info label="Số điện thoại" value={profile.phone} />
        <Info label="Tỉnh/Thành phố" value={profile.province} />
        <Info label="Quận/Huyện" value={profile.district} />
        <Info label="Địa chỉ" value={profile.address} />
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginBottom: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 15,
    marginBottom: 12,
    fontWeight: '600',
  },
  avatarCard: {
    alignItems: 'center',
    marginBottom: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#f4f7fb',
  },
  avatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    marginBottom: 12,
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  avatarFallback: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
  },
  avatarName: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '800',
  },
  avatarEmail: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#35358d',
    fontSize: 22,
    fontWeight: '900',
  },
  sectionGap: {
    marginTop: 26,
  },
  infoRow: {
    minHeight: 88,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    justifyContent: 'center',
  },
  infoLabel: {
    color: '#3f3f3f',
    fontSize: 18,
  },
  infoValue: {
    color: '#050505',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  formContent: {
    padding: 24,
    paddingBottom: 36,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  saveButton: {
    minHeight: 56,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonFlex: {
    flex: 1.4,
  },
  saveText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
  },
  cancelOutlineBtn: {
    flex: 1,
    minHeight: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelOutlineText: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
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
