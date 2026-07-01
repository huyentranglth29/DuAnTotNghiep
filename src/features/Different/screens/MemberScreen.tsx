import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

const HEADER_BLUE = '#005f98';
const TEXT_DARK = '#202124';
const TEXT_MUTED = '#5f6368';
const BORDER = '#e7e9ec';
const SOFT_BLUE = '#eaf3fb';

type MemberScreenName =
  | 'card'
  | 'points'
  | 'pointHistory'
  | 'transactions'
  | 'memberCard'
  | 'account'
  | 'changePassword';

type MemberScreenProps = {
  onBack: () => void;
};

type HeaderProps = {
  title: string;
  onBack: () => void;
  onHistoryPress?: () => void;
  showEdit?: boolean;
  onEditPress?: () => void;
};

type AccountInfo = {
  email: string;
  fullName: string;
  gender: string;
  birthday: string;
  citizenId: string;
  phone: string;
  province: string;
  district: string;
  address: string;
};

type PointsScreenProps = {
  onBack: () => void;
  onHistoryPress: () => void;
};

type MenuRow = {
  title: string;
  icon: MemberIconName;
  screen?: MemberScreenName;
  action?: 'deleteAccount';
};

type MemberIconName =
  | 'star'
  | 'history'
  | 'card'
  | 'person'
  | 'trash'
  | 'lock'
  | 'trend'
  | 'cart'
  | 'wallet'
  | 'logout'
  | 'receipt'
  | 'calendar';

const memberRows: MenuRow[] = [
  { title: 'Điểm BETA', icon: 'star', screen: 'points' },
  { title: 'Lịch sử giao dịch', icon: 'history', screen: 'transactions' },
  { title: 'Thẻ thành viên', icon: 'card', screen: 'memberCard' },
  { title: 'Thông tin tài khoản', icon: 'person', screen: 'account' },
  { title: 'Xoá tài khoản', icon: 'trash', action: 'deleteAccount' },
  { title: 'Thay đổi mật khẩu', icon: 'lock', screen: 'changePassword' },
];

const barcodeBars = [
  3, 1, 1, 3, 4, 1, 2, 1, 1, 4, 3, 1, 2, 3, 1, 1, 4, 2, 1, 3, 2, 1, 1, 4,
  3, 2, 1, 1, 2, 4, 1, 3, 1, 2, 4, 1, 1, 3, 2, 1, 4, 2, 1, 3, 1, 1, 4, 3,
  2, 1, 1, 4, 2, 3, 1, 1, 3, 2,
];

const initialAccountInfo: AccountInfo = {
  email: 'ngank301006@gmail.com',
  fullName: 'Lê Thị Ngọc Anh',
  gender: '',
  birthday: '',
  citizenId: '',
  phone: '0357276740',
  province: '',
  district: '',
  address: '',
};

const genderOptions = ['Nam', 'Nữ', 'Khác'];
const provinceOptions = [
  'Thành phố Hà Nội',
  'Thành phố Hồ Chí Minh',
  'Thành phố Hải Phòng',
  'Thành phố Đà Nẵng',
  'Thành phố Cần Thơ',
  'Tỉnh An Giang',
  'Tỉnh Bà Rịa - Vũng Tàu',
  'Tỉnh Bắc Giang',
  'Tỉnh Bắc Kạn',
  'Tỉnh Bạc Liêu',
  'Tỉnh Bắc Ninh',
  'Tỉnh Bến Tre',
  'Tỉnh Bình Định',
  'Tỉnh Bình Dương',
  'Tỉnh Bình Phước',
  'Tỉnh Bình Thuận',
  'Tỉnh Cà Mau',
  'Tỉnh Cao Bằng',
  'Tỉnh Đắk Lắk',
  'Tỉnh Đắk Nông',
  'Tỉnh Điện Biên',
  'Tỉnh Đồng Nai',
  'Tỉnh Đồng Tháp',
  'Tỉnh Gia Lai',
  'Tỉnh Hà Giang',
  'Tỉnh Hà Nam',
  'Tỉnh Hà Tĩnh',
  'Tỉnh Hải Dương',
  'Tỉnh Hậu Giang',
  'Tỉnh Hòa Bình',
  'Tỉnh Hưng Yên',
  'Tỉnh Khánh Hòa',
  'Tỉnh Kiên Giang',
  'Tỉnh Kon Tum',
  'Tỉnh Lai Châu',
  'Tỉnh Lâm Đồng',
  'Tỉnh Lạng Sơn',
  'Tỉnh Lào Cai',
  'Tỉnh Long An',
  'Tỉnh Nam Định',
  'Tỉnh Nghệ An',
  'Tỉnh Ninh Bình',
  'Tỉnh Ninh Thuận',
  'Tỉnh Phú Thọ',
  'Tỉnh Phú Yên',
  'Tỉnh Quảng Bình',
  'Tỉnh Quảng Nam',
  'Tỉnh Quảng Ngãi',
  'Tỉnh Quảng Ninh',
  'Tỉnh Quảng Trị',
  'Tỉnh Sóc Trăng',
  'Tỉnh Sơn La',
  'Tỉnh Tây Ninh',
  'Tỉnh Thái Bình',
  'Tỉnh Thái Nguyên',
  'Tỉnh Thanh Hóa',
  'Tỉnh Thừa Thiên Huế',
  'Tỉnh Tiền Giang',
  'Tỉnh Trà Vinh',
  'Tỉnh Tuyên Quang',
  'Tỉnh Vĩnh Long',
  'Tỉnh Vĩnh Phúc',
  'Tỉnh Yên Bái',
];

const districtOptions = [
  'Quận Ba Đình',
  'Quận Cầu Giấy',
  'Quận Đống Đa',
  'Quận Hoàn Kiếm',
  'Quận Hai Bà Trưng',
];

const CALENDAR_YEAR = 2026;

function parseDateParts(value: string) {
  const [day, month, year] = value.split('/').map(part => Number(part));

  return {
    day: Number.isNaN(day) ? 1 : day,
    month: Number.isNaN(month) ? 1 : month,
    year: Number.isNaN(year) ? CALENDAR_YEAR : year,
  };
}

function formatDate(day: number, month: number) {
  return `${String(day).padStart(2, '0')}/${String(month).padStart(
    2,
    '0',
  )}/${CALENDAR_YEAR}`;
}

function getDaysInMonth(month: number) {
  return new Date(CALENDAR_YEAR, month, 0).getDate();
}

function getWeekNumber(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000) + 1;

  return Math.ceil((dayOfYear + start.getDay()) / 7);
}

function buildCalendarRows(month: number) {
  const firstDay = new Date(CALENDAR_YEAR, month - 1, 1).getDay();
  const daysInMonth = getDaysInMonth(month);
  const previousMonth = month === 1 ? 12 : month - 1;
  const nextMonth = month === 12 ? 1 : month + 1;
  const previousMonthDays = getDaysInMonth(previousMonth);

  return Array.from({ length: 6 }, (_, rowIndex) => {
    const weekStartOffset = rowIndex * 7 - firstDay + 1;
    const weekDate = new Date(CALENDAR_YEAR, month - 1, weekStartOffset);
    const weekNumber = getWeekNumber(weekDate);
    const days = Array.from({ length: 7 }, (_day, dayIndex) => {
      const value = rowIndex * 7 + dayIndex - firstDay + 1;

      if (value < 1) {
        return {
          day: previousMonthDays + value,
          month: previousMonth,
          isCurrentMonth: false,
        };
      }

      if (value > daysInMonth) {
        return {
          day: value - daysInMonth,
          month: nextMonth,
          isCurrentMonth: false,
        };
      }

      return {
        day: value,
        month,
        isCurrentMonth: true,
      };
    });

    return {
      weekNumber,
      days,
    };
  });
}

function MemberScreen({ onBack }: MemberScreenProps) {
  const [activeScreen, setActiveScreen] = useState<MemberScreenName>('card');

  if (activeScreen === 'points') {
    return (
      <PointsScreen
        onBack={() => setActiveScreen('card')}
        onHistoryPress={() => setActiveScreen('pointHistory')}
      />
    );
  }

  if (activeScreen === 'pointHistory') {
    return <PointHistoryScreen onBack={() => setActiveScreen('points')} />;
  }

  if (activeScreen === 'transactions') {
    return <TransactionHistoryScreen onBack={() => setActiveScreen('card')} />;
  }

  if (activeScreen === 'memberCard') {
    return <MemberCardDetailScreen onBack={() => setActiveScreen('card')} />;
  }

  if (activeScreen === 'account') {
    return <AccountInfoScreen onBack={() => setActiveScreen('card')} />;
  }

  if (activeScreen === 'changePassword') {
    return <ChangePasswordScreen onBack={() => setActiveScreen('card')} />;
  }

  return <MemberCardScreen onBack={onBack} onOpenScreen={setActiveScreen} />;
}

function MemberCardScreen({
  onBack,
  onOpenScreen,
}: {
  onBack: () => void;
  onOpenScreen: (screen: MemberScreenName) => void;
}) {
  const [confirmDialog, setConfirmDialog] = useState<'logout' | 'deleteAccount' | null>(
    null,
  );

  return (
    <View style={styles.screen}>
      <Header title="THÀNH VIÊN BETA" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.memberContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>L</Text>
            <View style={styles.cameraBadge}>
              <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M7 8.5l1.6-2h6.8l1.6 2H20v9H4v-9h3z"
                  stroke="#fff"
                  strokeWidth={2.4}
                  strokeLinejoin="round"
                />
                <Circle cx={12} cy={13} r={3} stroke="#fff" strokeWidth={2.2} />
              </Svg>
            </View>
          </View>

          <Text style={styles.name}>Lê Thị Ngọc Anh</Text>

          <View style={styles.memberCodeRow}>
            <Text style={styles.memberLabel}>Thẻ thành viên</Text>
            <Text style={styles.memberCode}>9002000004094001</Text>
          </View>

          <View style={styles.barcodeBox}>
            <Barcode />
          </View>

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
            Bạn cần tích luỹ thêm <Text style={styles.vipAmount}>3.000.000 đ</Text>{' '}
            để thăng hạng{'\n'}VIP
          </Text>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>0 đ</Text>
            <Text style={styles.progressLabel}>3.000.000 đ</Text>
          </View>
        </View>

        <View style={styles.menuList}>
          {memberRows.map(row => (
            <MemberMenuRow
              key={row.title}
              row={row}
              onPress={() => {
                if (row.screen) {
                  onOpenScreen(row.screen);
                  return;
                }

                if (row.action === 'deleteAccount') {
                  setConfirmDialog('deleteAccount');
                }
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.logoutButton}
          onPress={() => setConfirmDialog('logout')}
        >
          <MemberIcon name="logout" color="#ffffff" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>

      <ConfirmDialog
        visible={confirmDialog === 'logout'}
        title="Đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất?"
        cancelText="Huỷ bỏ"
        confirmText="Đăng xuất"
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => setConfirmDialog(null)}
      />
      <ConfirmDialog
        visible={confirmDialog === 'deleteAccount'}
        title="Xoá tài khoản"
        message={'Bạn có chắc chắn muốn xoá tài khoản?\nHành động này không thể hoàn tác.'}
        cancelText="Huỷ"
        confirmText="Xoá tài khoản"
        onCancel={() => setConfirmDialog(null)}
        onConfirm={() => setConfirmDialog(null)}
      />
    </View>
  );
}

function PointsScreen({ onBack, onHistoryPress }: PointsScreenProps) {
  return (
    <View style={styles.screen}>
      <Header
        title="ĐIỂM BETA"
        onBack={onBack}
        onHistoryPress={onHistoryPress}
      />

      <View style={styles.pointsCard}>
        <PointStat icon="trend" iconColor="#37a4ff" label="Tổng điểm tích luỹ" />
        <PointStat icon="cart" iconColor="#ff9817" label="Tổng điểm đã sử dụng" />
        <PointStat icon="wallet" iconColor="#4ab460" label="Điểm hiện tại" bold />
      </View>
    </View>
  );
}

function PointHistoryScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.historyScreen}>
      <Header title="LỊCH SỬ ĐIỂM" onBack={onBack} />
      <View style={styles.historyEmpty}>
        <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
          <Path
            d="M21 43H9l8.3 8.3A25 25 0 1 0 15 21"
            stroke="#a7a7a7"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M36 20v17l12 7"
            stroke="#a7a7a7"
            strokeWidth={6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text style={styles.historyMessage}>Bạn chưa có lịch sử tiêu điểm</Text>
      </View>
    </View>
  );
}

function TransactionHistoryScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.historyScreen}>
      <Header title="LỊCH SỬ GIAO DỊCH" onBack={onBack} />
      <View style={styles.historyEmpty}>
        <Svg width={78} height={78} viewBox="0 0 78 78" fill="none">
          <Path
            d="M24 19h30v36c0 7-4.3 10-10 10H25c-7 0-11-3.8-11-10v-6h10V19z"
            fill="#c6c6c8"
          />
          <Path d="M24 49h20v6c0 6-3.6 10-9.5 10H24V49z" fill="#bdbdbf" />
          <Path d="M30 29h17v6H30zM30 41h14v6H30zM48 41h4v6h-4z" fill="#dedcdc" />
          <Path
            d="M24 19l4-4 4 4 4-4 4 4 4-4 4 4 4-4 2 2v2H24z"
            fill="#c6c6c8"
          />
        </Svg>
        <Text style={styles.historyMessage}>Bạn chưa có lịch sử giao dịch nào</Text>
      </View>
    </View>
  );
}

function MemberCardDetailScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <Header title="THẺ THÀNH VIÊN" onBack={onBack} />
      <View style={styles.memberCardDetail}>
        <View style={styles.activeCard}>
          <View style={styles.activeCardHeader}>
            <Text style={styles.activeCardTitle}>Khách hàng STANDARD</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Đang sử dụng</Text>
            </View>
          </View>

          <View style={styles.cardInfoRow}>
            <MemberIcon name="card" color="#9d9d9d" />
            <Text style={styles.cardInfoText}>Số thẻ: 9002000004094001</Text>
          </View>
          <View style={styles.cardInfoRow}>
            <MemberIcon name="calendar" color="#9d9d9d" />
            <Text style={styles.cardInfoText}>Ngày đăng ký: 30/06/2026</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function AccountInfoScreen({ onBack }: { onBack: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [accountInfo, setAccountInfo] = useState<AccountInfo>(initialAccountInfo);
  const [draftInfo, setDraftInfo] = useState<AccountInfo>(initialAccountInfo);
  const [activePicker, setActivePicker] = useState<
    'gender' | 'birthday' | 'province' | 'district' | null
  >(null);
  const [provinceSearch, setProvinceSearch] = useState('');
  const [selectedBirthday, setSelectedBirthday] = useState(
    initialAccountInfo.birthday || '01/07/2026',
  );

  const updateDraft = (field: keyof AccountInfo, value: string) => {
    setDraftInfo(current => ({
      ...current,
      [field]: value,
    }));
  };

  const startEditing = () => {
    setDraftInfo(accountInfo);
    setIsEditing(true);
  };

  const saveChanges = () => {
    setAccountInfo(draftInfo);
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setDraftInfo(accountInfo);
    setIsEditing(false);
    setActivePicker(null);
  };

  const filteredProvinces = provinceOptions.filter(province =>
    province.toLowerCase().includes(provinceSearch.trim().toLowerCase()),
  );

  if (isEditing) {
    return (
      <View style={styles.screen}>
        <Header title="THÔNG TIN CÁ NHÂN" onBack={cancelEditing} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.editContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.editSectionTitle}>Thông tin cơ bản</Text>
          <EditField
            label="Email"
            required
            value={draftInfo.email}
            editable={false}
            onChangeText={value => updateDraft('email', value)}
          />
          <EditField
            label="Họ và tên"
            required
            value={draftInfo.fullName}
            onChangeText={value => updateDraft('fullName', value)}
          />
          <EditField
            label="Giới tính"
            value={draftInfo.gender}
            placeholder="Chọn giới tính"
            trailingIcon="chevron"
            onPress={() => setActivePicker('gender')}
            onChangeText={value => updateDraft('gender', value)}
          />
          <EditField
            label="Ngày sinh"
            value={draftInfo.birthday}
            placeholder="Chọn ngày sinh"
            trailingIcon="calendar"
            onPress={() => {
              setSelectedBirthday(draftInfo.birthday || '01/07/2026');
              setActivePicker('birthday');
            }}
            onChangeText={value => updateDraft('birthday', value)}
          />

          <Text style={[styles.editSectionTitle, styles.editSectionGap]}>
            Thông tin liên hệ
          </Text>
          <EditField
            label="CMND/CCCD"
            value={draftInfo.citizenId}
            placeholder="Nhập cmnd/cccd"
            keyboardType="number-pad"
            onChangeText={value => updateDraft('citizenId', value)}
          />
          <EditField
            label="Số điện thoại"
            required
            value={draftInfo.phone}
            keyboardType="phone-pad"
            onChangeText={value => updateDraft('phone', value)}
          />
          <EditField
            label="Tỉnh/Thành phố"
            value={draftInfo.province}
            placeholder="Chọn tỉnh/thành phố"
            trailingIcon="chevron"
            onPress={() => {
              setProvinceSearch('');
              setActivePicker('province');
            }}
            onChangeText={value => updateDraft('province', value)}
          />
          <EditField
            label="Quận/Huyện"
            value={draftInfo.district}
            placeholder="Chọn quận/huyện"
            trailingIcon="chevron"
            onPress={() => setActivePicker('district')}
            onChangeText={value => updateDraft('district', value)}
          />
          <EditField
            label="Địa chỉ"
            value={draftInfo.address}
            placeholder="Nhập địa chỉ"
            onChangeText={value => updateDraft('address', value)}
          />

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.saveButton}
            onPress={saveChanges}
          >
            <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.cancelButton}
            onPress={cancelEditing}
          >
            <Text style={styles.cancelButtonText}>Huỷ bỏ</Text>
          </TouchableOpacity>
        </ScrollView>

        <OptionSheet
          visible={activePicker === 'gender'}
          title="Giới tính"
          options={genderOptions}
          onClose={() => setActivePicker(null)}
          onSelect={value => {
            updateDraft('gender', value);
            setActivePicker(null);
          }}
        />
        <LocationSheet
          visible={activePicker === 'province'}
          title="Tỉnh/Thành phố"
          searchValue={provinceSearch}
          options={filteredProvinces}
          onSearchChange={setProvinceSearch}
          onClose={() => setActivePicker(null)}
          onSelect={value => {
            updateDraft('province', value);
            updateDraft('district', '');
            setActivePicker(null);
          }}
        />
        <OptionSheet
          visible={activePicker === 'district'}
          title="Quận/Huyện"
          options={districtOptions}
          onClose={() => setActivePicker(null)}
          onSelect={value => {
            updateDraft('district', value);
            setActivePicker(null);
          }}
        />
        <BirthdayPicker
          visible={activePicker === 'birthday'}
          selectedDate={selectedBirthday}
          onSelect={setSelectedBirthday}
          onClose={() => setActivePicker(null)}
          onSave={() => {
            updateDraft('birthday', selectedBirthday);
            setActivePicker(null);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header
        title="THÔNG TIN CÁ NHÂN"
        onBack={onBack}
        showEdit
        onEditPress={startEditing}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.accountContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.accountSectionTitle}>Thông tin cơ bản</Text>
        <InfoField label="Email" value={accountInfo.email} />
        <InfoField label="Họ và tên" value={accountInfo.fullName} />
        <InfoField label="Giới tính" value={accountInfo.gender} />
        <InfoField label="Ngày sinh" value={accountInfo.birthday} />

        <Text style={[styles.accountSectionTitle, styles.accountSectionGap]}>
          Thông tin liên hệ
        </Text>
        <InfoField label="CMND/CCCD" value={accountInfo.citizenId} />
        <InfoField label="Số điện thoại" value={accountInfo.phone} />
        <InfoField label="Tỉnh/Thành phố" value={accountInfo.province} />
        <InfoField label="Quận/Huyện" value={accountInfo.district} />
        <InfoField label="Địa chỉ" value={accountInfo.address} />
      </ScrollView>
    </View>
  );
}

function ChangePasswordScreen({ onBack }: { onBack: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visibleFields, setVisibleFields] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [errors, setErrors] = useState({
    current: '',
    next: '',
    confirm: '',
  });

  const toggleVisible = (field: keyof typeof visibleFields) => {
    setVisibleFields(current => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleSubmit = () => {
    const nextErrors = {
      current: '',
      next: '',
      confirm: '',
    };

    if (!currentPassword) {
      nextErrors.current = 'Vui lòng nhập mật khẩu hiện tại';
    }

    if (!newPassword) {
      nextErrors.next = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 6) {
      nextErrors.next = 'Mật khẩu phải chứa tối thiểu 6 kí tự';
    }

    if (!confirmPassword) {
      nextErrors.confirm = 'Vui lòng xác nhận mật khẩu mới';
    } else if (newPassword && confirmPassword !== newPassword) {
      nextErrors.confirm = 'Mật khẩu xác nhận không khớp';
    }

    setErrors(nextErrors);
  };

  return (
    <View style={styles.screen}>
      <Header title="ĐỔI MẬT KHẨU" onBack={onBack} />
      <View style={styles.changePasswordContent}>
        <PasswordField
          value={currentPassword}
          placeholder="Nhập mật khẩu hiện tại"
          visible={visibleFields.current}
          error={errors.current}
          onChangeText={value => {
            setCurrentPassword(value);
            setErrors(current => ({ ...current, current: '' }));
          }}
          onToggleVisible={() => toggleVisible('current')}
        />
        <PasswordField
          value={newPassword}
          placeholder="Nhập mật khẩu mới"
          visible={visibleFields.next}
          error={errors.next}
          onChangeText={value => {
            setNewPassword(value);
            setErrors(current => ({ ...current, next: '' }));
          }}
          onToggleVisible={() => toggleVisible('next')}
        />
        <PasswordField
          value={confirmPassword}
          placeholder="Xác nhận mật khẩu mới"
          visible={visibleFields.confirm}
          error={errors.confirm}
          onChangeText={value => {
            setConfirmPassword(value);
            setErrors(current => ({ ...current, confirm: '' }));
          }}
          onToggleVisible={() => toggleVisible('confirm')}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.changePasswordButton}
          onPress={handleSubmit}
        >
          <Text style={styles.changePasswordButtonText}>Đổi mật khẩu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function PasswordField({
  value,
  placeholder,
  visible,
  error,
  onChangeText,
  onToggleVisible,
}: {
  value: string;
  placeholder: string;
  visible: boolean;
  error: string;
  onChangeText: (value: string) => void;
  onToggleVisible: () => void;
}) {
  return (
    <View style={styles.passwordFieldWrap}>
      <View style={[styles.passwordInputShell, !!error && styles.passwordInputError]}>
        <Svg width={31} height={31} viewBox="0 0 31 31" fill="none">
          <Rect
            x={6}
            y={12.5}
            width={19}
            height={13}
            rx={1.8}
            stroke="#111111"
            strokeWidth={2.2}
          />
          <Path
            d="M10 12.5V9.2a5.5 5.5 0 0 1 11 0v3.3"
            stroke="#111111"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <Circle cx={15.5} cy={18.2} r={1.7} fill="#111111" />
          <Path
            d="M15.5 19.7v2.5"
            stroke="#111111"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
        <TextInput
          style={styles.passwordInput}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#c4c4c4"
          secureTextEntry={!visible}
          onChangeText={onChangeText}
        />
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.eyeButton}
          onPress={onToggleVisible}
        >
          <Svg width={29} height={29} viewBox="0 0 29 29" fill="none">
            <Path
              d="M4 14.5s3.6-6 10.5-6 10.5 6 10.5 6-3.6 6-10.5 6S4 14.5 4 14.5z"
              stroke="#9f9f9f"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={14.5} cy={14.5} r={3.1} stroke="#9f9f9f" strokeWidth={2.2} />
            {!visible && (
              <Path
                d="M5.5 23.5l18-18"
                stroke="#9f9f9f"
                strokeWidth={2.7}
                strokeLinecap="round"
              />
            )}
          </Svg>
        </TouchableOpacity>
      </View>
      {!!error && <Text style={styles.passwordErrorText}>{error}</Text>}
    </View>
  );
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.infoField}>
      <Text style={styles.infoLabel}>{label}</Text>
      {value && <Text style={styles.infoValue}>{value}</Text>}
    </View>
  );
}

function EditField({
  label,
  value,
  placeholder,
  required = false,
  editable = true,
  keyboardType = 'default',
  trailingIcon,
  onPress,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  editable?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
  trailingIcon?: 'chevron' | 'calendar';
  onPress?: () => void;
  onChangeText: (value: string) => void;
}) {
  const trailing = (
    <>
      {trailingIcon === 'chevron' && (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 10l5 5 5-5"
            stroke="#969696"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      )}
      {trailingIcon === 'calendar' && (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Rect
            x={4}
            y={5.5}
            width={16}
            height={15}
            rx={2}
            stroke="#969696"
            strokeWidth={2.2}
          />
          <Line x1={8} y1={3.8} x2={8} y2={7.8} stroke="#969696" strokeWidth={2.2} />
          <Line x1={16} y1={3.8} x2={16} y2={7.8} stroke="#969696" strokeWidth={2.2} />
          <Line x1={4} y1={10} x2={20} y2={10} stroke="#969696" strokeWidth={2.2} />
          <Rect x={8} y={13} width={2.4} height={2.4} fill="#969696" />
          <Rect x={12} y={13} width={2.4} height={2.4} fill="#969696" />
          <Rect x={16} y={13} width={2.4} height={2.4} fill="#969696" />
        </Svg>
      )}
    </>
  );

  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>
        {label}
        {required && <Text style={styles.requiredMark}> *</Text>}
      </Text>
      {onPress ? (
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.inputShell}
          onPress={onPress}
        >
          <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>
            {value || placeholder}
          </Text>
          {trailing}
        </TouchableOpacity>
      ) : (
        <View style={[styles.inputShell, !editable && styles.inputShellDisabled]}>
        <TextInput
          style={[styles.textInput, !editable && styles.textInputDisabled]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#b8b8b8"
          editable={editable}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
        />
        {trailing}
        </View>
      )}
    </View>
  );
}

function OptionSheet({
  visible,
  title,
  options,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.bottomSheet}
          onPress={() => undefined}
        >
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              activeOpacity={0.75}
              style={styles.optionRow}
              onPress={() => onSelect(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function LocationSheet({
  visible,
  title,
  searchValue,
  options,
  onSearchChange,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  searchValue: string;
  options: string[];
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.locationSheet}
          onPress={() => undefined}
        >
          <Text style={styles.sheetTitle}>{title}</Text>
          <View style={styles.searchBox}>
            <Svg width={29} height={29} viewBox="0 0 29 29" fill="none">
              <Circle cx={12.5} cy={12.5} r={8.5} stroke="#333333" strokeWidth={2} />
              <Path
                d="M19 19l7 7"
                stroke="#333333"
                strokeWidth={2.4}
                strokeLinecap="round"
              />
              <Circle cx={12.5} cy={12.5} r={5.5} stroke="#333333" strokeWidth={1.2} />
            </Svg>
            <TextInput
              style={styles.searchInput}
              value={searchValue}
              placeholder="Tìm kiếm"
              placeholderTextColor="#bebebe"
              onChangeText={onSearchChange}
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {options.map(option => (
              <TouchableOpacity
                key={option}
                activeOpacity={0.75}
                style={styles.locationOption}
                onPress={() => onSelect(option)}
              >
                <Text style={styles.locationText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function BirthdayPicker({
  visible,
  selectedDate,
  onSelect,
  onClose,
  onSave,
}: {
  visible: boolean;
  selectedDate: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const selectedParts = parseDateParts(selectedDate);
  const [visibleMonth, setVisibleMonth] = useState(selectedParts.month);
  const calendarRows = buildCalendarRows(visibleMonth);

  useEffect(() => {
    if (visible) {
      setVisibleMonth(parseDateParts(selectedDate).month);
    }
  }, [selectedDate, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.centerOverlay}>
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeaderRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.monthButton}
              disabled={visibleMonth === 1}
              onPress={() => setVisibleMonth(month => Math.max(1, month - 1))}
            >
              <Text
                style={[
                  styles.monthButtonText,
                  visibleMonth === 1 && styles.monthButtonDisabled,
                ]}
              >
                ‹
              </Text>
            </TouchableOpacity>
            <Text style={styles.calendarTitle}>Tháng {visibleMonth} 2026</Text>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.monthButton}
              disabled={visibleMonth === 12}
              onPress={() => setVisibleMonth(month => Math.min(12, month + 1))}
            >
              <Text
                style={[
                  styles.monthButtonText,
                  visibleMonth === 12 && styles.monthButtonDisabled,
                ]}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekHeader}>
            {['CN', 'TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7'].map(day => (
              <Text
                key={day}
                style={[
                  styles.weekText,
                  visibleMonth === selectedParts.month &&
                    day ===
                      ['CN', 'TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7'][
                        new Date(
                          CALENDAR_YEAR,
                          visibleMonth - 1,
                          selectedParts.day,
                        ).getDay()
                      ] &&
                    styles.weekTextActive,
                ]}
              >
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.calendarBody}>
            <View style={styles.weekNumberRail} />
            {calendarRows.map(row => (
              <View key={row.weekNumber} style={styles.dateRow}>
                <View style={[styles.dateCell, styles.weekNumberCell]}>
                  <Text style={styles.dateText}>{row.weekNumber}</Text>
                </View>
                {row.days.map(day => {
                  const isSelected =
                    day.isCurrentMonth &&
                    selectedParts.day === day.day &&
                    selectedParts.month === visibleMonth;
                  const dateValue = formatDate(day.day, visibleMonth);

                  return (
                    <TouchableOpacity
                      key={`${day.month}-${day.day}`}
                      activeOpacity={day.isCurrentMonth ? 0.75 : 1}
                      style={[
                        styles.dateCell,
                        isSelected && styles.dateCellSelected,
                      ]}
                      disabled={!day.isCurrentMonth}
                      onPress={() => onSelect(dateValue)}
                    >
                      <Text
                        style={[
                          styles.dateText,
                          !day.isCurrentMonth && styles.dateTextMuted,
                          isSelected && styles.dateTextSelected,
                        ]}
                      >
                        {day.day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          <View style={styles.calendarActions}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.calendarAction}
              onPress={onClose}
            >
              <Text style={styles.calendarCancel}>Hủy bỏ</Text>
            </TouchableOpacity>
            <View style={styles.calendarDivider} />
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.calendarAction}
              onPress={onSave}
            >
              <Text style={styles.calendarSave}>Lưu lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ConfirmDialog({
  visible,
  title,
  message,
  cancelText,
  confirmText,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
          <View style={styles.confirmDivider} />
          <View style={styles.confirmActions}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.confirmAction}
              onPress={onCancel}
            >
              <Text style={styles.confirmCancelText}>{cancelText}</Text>
            </TouchableOpacity>
            <View style={styles.confirmActionDivider} />
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.confirmAction}
              onPress={onConfirm}
            >
              <Text style={styles.confirmOkText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Header({
  title,
  onBack,
  onHistoryPress,
  showEdit,
  onEditPress,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.backButton}
        onPress={onBack}
      >
        <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
          <Path
            d="M17.5 5.5L9 14l8.5 8.5"
            stroke="#ffffff"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      {onHistoryPress && (
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.historyButton}
          onPress={onHistoryPress}
        >
          <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
            <Path
              d="M10 18H3.8l4.3 4.3A12.2 12.2 0 1 0 6.8 8"
              stroke="#ffffff"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M15 8.2V15l5.1 3"
              stroke="#ffffff"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      )}
      {showEdit && (
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.historyButton}
          onPress={onEditPress}
        >
          <Svg width={29} height={29} viewBox="0 0 29 29" fill="none">
            <Path
              d="M6 21.5l1.1-5.3L18.8 4.5l4.2 4.2-11.7 11.7L6 21.5z"
              fill="#ffffff"
            />
            <Path d="M17.2 6.1l4.2 4.2" stroke={HEADER_BLUE} strokeWidth={1.4} />
          </Svg>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Barcode() {
  let cursor = 0;

  return (
    <Svg width="100%" height={74} viewBox="0 0 280 74" fill="none">
      {barcodeBars.map((width, index) => {
        const x = cursor;
        cursor += width + (index % 3 === 0 ? 2 : 1);

        return (
          <Rect
            key={`${x}-${width}`}
            x={x}
            y={0}
            width={width}
            height={74}
            fill="#000000"
          />
        );
      })}
    </Svg>
  );
}

function MemberMenuRow({ row, onPress }: { row: MenuRow; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuIconBox}>
        <MemberIcon name={row.icon} color={HEADER_BLUE} />
      </View>
      <Text style={styles.menuText}>{row.title}</Text>
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path
          d="M6.5 3.5L12 9l-5.5 5.5"
          stroke="#a4a7ab"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </TouchableOpacity>
  );
}

function PointStat({
  icon,
  iconColor,
  label,
  bold = false,
}: {
  icon: MemberIconName;
  iconColor: string;
  label: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.pointRow}>
      <View style={[styles.pointIconBox, { backgroundColor: `${iconColor}14` }]}>
        <MemberIcon name={icon} color={iconColor} />
      </View>
      <Text style={[styles.pointLabel, bold && styles.pointLabelBold]}>{label}</Text>
      <Text style={[styles.pointValue, bold && styles.pointValueGreen]}>0</Text>
    </View>
  );
}

function MemberIcon({ name, color }: { name: MemberIconName; color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26" fill="none">
      {name === 'star' && (
        <>
          <Circle cx={13} cy={13} r={11} fill={color} />
          <Path
            d="M13 6.8l1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6L13 6.8z"
            fill="#ffffff"
          />
        </>
      )}

      {name === 'history' && (
        <G stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M9 15H4l3.4 3.4A9.2 9.2 0 1 0 6.5 7" />
          <Path d="M13 7.5V13l4.2 2.5" />
        </G>
      )}

      {name === 'card' && (
        <G stroke={color} strokeWidth={2.4} strokeLinejoin="round">
          <Rect x={4} y={7} width={18} height={13} rx={1.4} />
          <Line x1={5} y1={11} x2={21} y2={11} />
        </G>
      )}

      {name === 'calendar' && (
        <G stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Rect x={5} y={6.5} width={16} height={15} rx={1.2} />
          <Line x1={8.5} y1={4.5} x2={8.5} y2={8.5} />
          <Line x1={17.5} y1={4.5} x2={17.5} y2={8.5} />
          <Line x1={5} y1={11} x2={21} y2={11} />
        </G>
      )}

      {name === 'person' && (
        <>
          <Circle cx={13} cy={8} r={3.4} fill={color} />
          <Path d="M5 21c1.6-4.4 4.2-6.6 8-6.6s6.4 2.2 8 6.6H5z" fill={color} />
        </>
      )}

      {name === 'trash' && (
        <G fill={color}>
          <Path d="M8 8h10v13H8z" />
          <Path d="M6.5 6.5h13v2h-13zM10.5 4.5h5v2h-5z" />
          <Path d="M10.2 12l1.8 1.8L13.8 12l1.4 1.4-1.8 1.8 1.8 1.8-1.4 1.4-1.8-1.8-1.8 1.8L8.8 17l1.8-1.8-1.8-1.8L10.2 12z" fill="#fff" />
        </G>
      )}

      {name === 'lock' && (
        <G fill={color}>
          <Path d="M6 11h14v11H6z" />
          <Path d="M9 11V8a4 4 0 0 1 8 0v3h-2.4V8a1.6 1.6 0 1 0-3.2 0v3H9z" />
          <Circle cx={13} cy={16.2} r={1.5} fill="#ffffff" />
        </G>
      )}

      {name === 'trend' && (
        <G stroke={color} strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 18l5.5-5.5 4 4L21 9" />
          <Path d="M16 9h5v5" />
        </G>
      )}

      {name === 'cart' && (
        <G fill={color}>
          <Path d="M4 6h3l2 10h9.5l2.2-7.2H8.4L8 6z" />
          <Circle cx={10} cy={20} r={2} />
          <Circle cx={18} cy={20} r={2} />
        </G>
      )}

      {name === 'wallet' && (
        <G fill={color}>
          <Path d="M5 7h16v12H5z" />
          <Path d="M12 11h10v6H12z" fill="#ffffff" />
          <Circle cx={17.5} cy={14} r={1.5} fill={color} />
        </G>
      )}

      {name === 'logout' && (
        <G stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M10 6H6v14h4" />
          <Path d="M13 13h8" />
          <Path d="M18 9l4 4-4 4" />
        </G>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  historyScreen: {
    flex: 1,
    backgroundColor: '#dedcdc',
  },
  header: {
    height: 64,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: HEADER_BLUE,
  },
  backButton: {
    width: 52,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: 0,
  },
  historyButton: {
    width: 56,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  memberContent: {
    paddingBottom: 16,
  },
  profileCard: {
    marginTop: 14,
    marginHorizontal: 4,
    paddingTop: 12,
    paddingHorizontal: 18,
    paddingBottom: 22,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#162333',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.7,
    borderColor: '#2a73bd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#1f7ed9',
    fontSize: 32,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    right: -1,
    bottom: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2b83dd',
  },
  name: {
    color: '#111111',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    marginBottom: 9,
  },
  memberCodeRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  memberLabel: {
    color: TEXT_MUTED,
    fontSize: 17,
  },
  memberCode: {
    color: TEXT_DARK,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  barcodeBox: {
    width: '88%',
    maxWidth: 360,
    height: 86,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  summaryBox: {
    width: '100%',
    minHeight: 56,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#8c8c8c',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 44,
    backgroundColor: '#9b9b9b',
  },
  summaryLabel: {
    color: TEXT_DARK,
    fontSize: 13,
    fontWeight: '600',
  },
  summaryValue: {
    color: '#1b79d8',
    fontSize: 19,
    fontWeight: '900',
    marginTop: 2,
  },
  vipText: {
    color: TEXT_DARK,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 24,
  },
  vipAmount: {
    color: '#ff4a3f',
    fontWeight: '900',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a7a7a7',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    width: 0,
    height: '100%',
    backgroundColor: HEADER_BLUE,
  },
  progressLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  progressLabel: {
    color: '#474747',
    fontSize: 14,
  },
  menuList: {
    marginTop: 36,
  },
  menuRow: {
    minHeight: 56,
    paddingHorizontal: 4,
    paddingRight: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconBox: {
    width: 40,
    height: 40,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SOFT_BLUE,
    marginRight: 20,
  },
  menuText: {
    flex: 1,
    color: TEXT_MUTED,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  logoutButton: {
    minHeight: 46,
    marginTop: 20,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: HEADER_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: HEADER_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  pointsCard: {
    margin: 16,
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#162333',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.12,
    shadowRadius: 11,
    elevation: 5,
  },
  pointRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  pointIconBox: {
    width: 54,
    height: 54,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
  },
  pointLabel: {
    flex: 1,
    color: TEXT_DARK,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '500',
  },
  pointLabelBold: {
    fontWeight: '900',
  },
  pointValue: {
    color: TEXT_DARK,
    fontSize: 25,
    fontWeight: '900',
  },
  pointValueGreen: {
    color: '#4ab460',
  },
  historyEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 92,
  },
  historyMessage: {
    marginTop: 16,
    color: '#b7b4b4',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400',
  },
  memberCardDetail: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  activeCard: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderWidth: 2,
    borderColor: '#31a1ff',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#162333',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 4,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  activeCardTitle: {
    flex: 1,
    color: '#050505',
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '900',
  },
  activeBadge: {
    minHeight: 34,
    paddingHorizontal: 16,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#35a5ff',
  },
  activeBadgeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  cardInfoText: {
    flex: 1,
    color: '#333333',
    fontSize: 20,
    lineHeight: 29,
    fontWeight: '400',
  },
  accountContent: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 26,
  },
  accountSectionTitle: {
    color: '#35358d',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },
  accountSectionGap: {
    marginTop: 26,
  },
  infoField: {
    minHeight: 97,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#cfcfcf',
    justifyContent: 'center',
  },
  infoLabel: {
    color: '#3f3f3f',
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '400',
  },
  infoValue: {
    color: '#050505',
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
    marginTop: 16,
  },
  changePasswordContent: {
    paddingHorizontal: 8,
    paddingTop: 26,
  },
  passwordFieldWrap: {
    marginBottom: 28,
  },
  passwordInputShell: {
    minHeight: 74,
    borderWidth: 1.4,
    borderColor: '#cfcfcf',
    borderRadius: 7,
    paddingLeft: 24,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  passwordInputError: {
    borderColor: '#ff565f',
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    color: '#2f2f2f',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '400',
    paddingVertical: 0,
    paddingHorizontal: 18,
  },
  eyeButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordErrorText: {
    color: '#ff565f',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400',
    marginTop: 12,
    marginLeft: 22,
  },
  changePasswordButton: {
    minHeight: 74,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HEADER_BLUE,
    marginTop: 8,
  },
  changePasswordButtonText: {
    color: '#ffffff',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
  },
  editContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
  },
  editSectionTitle: {
    color: '#35358d',
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    marginBottom: 8,
  },
  editSectionGap: {
    marginTop: 26,
  },
  editField: {
    marginTop: 16,
  },
  editLabel: {
    color: '#363636',
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '800',
    marginBottom: 9,
  },
  requiredMark: {
    color: '#f24b40',
  },
  inputShell: {
    minHeight: 74,
    borderWidth: 1,
    borderColor: '#c9c9c9',
    borderRadius: 7,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  inputShellDisabled: {
    borderColor: '#bdbdbd',
    backgroundColor: '#c6c6c6',
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    color: '#5d5d5d',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '400',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  textInputDisabled: {
    color: '#6a6a6a',
  },
  selectText: {
    flex: 1,
    minWidth: 0,
    color: '#5d5d5d',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '400',
  },
  selectPlaceholder: {
    color: '#b8b8b8',
  },
  saveButton: {
    minHeight: 62,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3f82f1',
    marginTop: 36,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  cancelButton: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  cancelButtonText: {
    color: '#f24b40',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  confirmOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  confirmCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 8,
  },
  confirmTitle: {
    color: '#2f2f2f',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 28,
  },
  confirmMessage: {
    color: '#565656',
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 26,
    marginTop: 22,
    marginBottom: 24,
  },
  confirmDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d7d7d7',
    marginHorizontal: 26,
  },
  confirmActions: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmAction: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmActionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 50,
    backgroundColor: '#d7d7d7',
  },
  confirmCancelText: {
    color: '#a7a7a7',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '500',
  },
  confirmOkText: {
    color: '#3e94ff',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
  },
  centerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  bottomSheet: {
    minHeight: 330,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    backgroundColor: '#ffffff',
  },
  locationSheet: {
    maxHeight: '72%',
    minHeight: 470,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  sheetTitle: {
    color: '#373737',
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 22,
  },
  optionRow: {
    minHeight: 66,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d6d6d6',
  },
  optionText: {
    color: '#393939',
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '400',
  },
  searchBox: {
    minHeight: 72,
    marginHorizontal: 4,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: '#565656',
    fontSize: 23,
    lineHeight: 29,
    marginLeft: 14,
    paddingVertical: 0,
  },
  locationOption: {
    minHeight: 82,
    justifyContent: 'center',
    paddingHorizontal: 68,
  },
  locationText: {
    color: '#555555',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '400',
  },
  calendarCard: {
    width: '100%',
    maxWidth: 540,
    borderRadius: 5,
    paddingTop: 22,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  calendarHeaderRow: {
    minHeight: 36,
    paddingHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarTitle: {
    flex: 1,
    color: '#333333',
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  monthButton: {
    width: 42,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    color: '#35358d',
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '700',
  },
  monthButtonDisabled: {
    color: '#c5c5c5',
  },
  weekHeader: {
    flexDirection: 'row',
    paddingLeft: 62,
    paddingRight: 22,
    marginBottom: 4,
  },
  weekText: {
    flex: 1,
    color: '#4a4a4a',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  weekTextActive: {
    color: '#4b8fff',
  },
  calendarBody: {
    position: 'relative',
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  weekNumberRail: {
    position: 'absolute',
    left: 18,
    top: 4,
    width: 34,
    height: 244,
    borderRadius: 8,
    backgroundColor: '#eeeeee',
  },
  dateRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCell: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNumberCell: {
    maxWidth: 34,
    marginRight: 10,
  },
  dateCellSelected: {
    borderWidth: 1.6,
    borderColor: '#5895ff',
    borderRadius: 19,
  },
  dateText: {
    color: '#585858',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400',
  },
  dateTextMuted: {
    color: '#969696',
  },
  dateTextSelected: {
    color: '#5895ff',
  },
  calendarActions: {
    minHeight: 76,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d4d4d4',
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarAction: {
    flex: 1,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDivider: {
    width: StyleSheet.hairlineWidth,
    height: 54,
    backgroundColor: '#d4d4d4',
  },
  calendarCancel: {
    color: '#a7a7a7',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500',
  },
  calendarSave: {
    color: '#35358d',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
});

export default MemberScreen;
