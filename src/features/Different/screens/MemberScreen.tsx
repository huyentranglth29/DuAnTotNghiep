import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

const BLUE = '#005f98';
const TEXT = '#242424';
const MUTED = '#666666';
const BORDER = '#dddddd';
const DANGER = '#ff5964';

type ScreenName =
  | 'home'
  | 'points'
  | 'pointHistory'
  | 'transactions'
  | 'card'
  | 'account'
  | 'changePassword';

type MemberScreenProps = {
  onBack: () => void;
};

type Row = {
  title: string;
  icon: IconName;
  screen?: ScreenName;
  action?: 'delete';
};

type IconName =
  | 'star'
  | 'history'
  | 'card'
  | 'person'
  | 'trash'
  | 'lock'
  | 'logout'
  | 'trend'
  | 'cart'
  | 'wallet';

const rows: Row[] = [
  { title: 'Điểm BETA', icon: 'star', screen: 'points' },
  { title: 'Lịch sử giao dịch', icon: 'history', screen: 'transactions' },
  { title: 'Thẻ thành viên', icon: 'card', screen: 'card' },
  { title: 'Thông tin tài khoản', icon: 'person', screen: 'account' },
  { title: 'Xoá tài khoản', icon: 'trash', action: 'delete' },
  { title: 'Thay đổi mật khẩu', icon: 'lock', screen: 'changePassword' },
];

const provinces = [
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

function MemberScreen({ onBack }: MemberScreenProps) {
  const [screen, setScreen] = useState<ScreenName>('home');

  if (screen === 'points') {
    return (
      <PointsScreen
        onBack={() => setScreen('home')}
        onHistory={() => setScreen('pointHistory')}
      />
    );
  }
  if (screen === 'pointHistory') {
    return <EmptyHistory title="LỊCH SỬ ĐIỂM" message="Bạn chưa có lịch sử tiêu điểm" onBack={() => setScreen('points')} />;
  }
  if (screen === 'transactions') {
    return <EmptyHistory title="LỊCH SỬ GIAO DỊCH" message="Bạn chưa có lịch sử giao dịch nào" receipt onBack={() => setScreen('home')} />;
  }
  if (screen === 'card') {
    return <CardScreen onBack={() => setScreen('home')} />;
  }
  if (screen === 'account') {
    return <AccountScreen onBack={() => setScreen('home')} />;
  }
  if (screen === 'changePassword') {
    return <ChangePasswordScreen onBack={() => setScreen('home')} />;
  }

  return <HomeScreen onBack={onBack} onOpen={setScreen} />;
}

function HomeScreen({
  onBack,
  onOpen,
}: {
  onBack: () => void;
  onOpen: (screen: ScreenName) => void;
}) {
  const [confirm, setConfirm] = useState<'logout' | 'delete' | null>(null);

  return (
    <View style={styles.screen}>
      <Header title="THÀNH VIÊN BETA" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.homeContent}>
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
            Bạn cần tích luỹ thêm <Text style={styles.vipAmount}>3.000.000 đ</Text> để thăng hạng{'\n'}VIP
          </Text>
          <View style={styles.progressBar} />
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>0 đ</Text>
            <Text style={styles.progressText}>3.000.000 đ</Text>
          </View>
        </View>

        <View style={styles.rowList}>
          {rows.map(row => (
            <MenuRow
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
          <Icon name="logout" color="#fff" />
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

function PointsScreen({
  onBack,
  onHistory,
}: {
  onBack: () => void;
  onHistory: () => void;
}) {
  return (
    <View style={styles.screen}>
      <Header title="ĐIỂM BETA" onBack={onBack} rightIcon="history" onRightPress={onHistory} />
      <View style={styles.pointsCard}>
        <PointRow icon="trend" color="#37a4ff" label="Tổng điểm tích luỹ" />
        <PointRow icon="cart" color="#ff9817" label="Tổng điểm đã sử dụng" />
        <PointRow icon="wallet" color="#4ab460" label="Điểm hiện tại" bold />
      </View>
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
      <Header title={title} onBack={onBack} />
      <View style={styles.emptyWrap}>
        {receipt ? <ReceiptIcon /> : <HistoryBigIcon />}
        <Text style={styles.emptyText}>{message}</Text>
      </View>
    </View>
  );
}

function CardScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <Header title="THẺ THÀNH VIÊN" onBack={onBack} />
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

function AccountScreen({ onBack }: { onBack: () => void }) {
  const [editing, setEditing] = useState(false);
  const [gender, setGender] = useState('');
  const [province, setProvince] = useState('');
  const [picker, setPicker] = useState<'gender' | 'province' | null>(null);
  const [search, setSearch] = useState('');
  const filtered = provinces.filter(item =>
    item.toLowerCase().includes(search.trim().toLowerCase()),
  );

  if (editing) {
    return (
      <View style={styles.screen}>
        <Header title="THÔNG TIN CÁ NHÂN" onBack={() => setEditing(false)} />
        <ScrollView contentContainerStyle={styles.formContent}>
          <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
          <EditBox label="Email" value="ngank301006@gmail.com" disabled required />
          <EditBox label="Họ và tên" value="Lê Thị Ngọc Anh" required />
          <SelectBox label="Giới tính" value={gender} placeholder="Chọn giới tính" onPress={() => setPicker('gender')} />
          <SelectBox label="Ngày sinh" value="" placeholder="Chọn ngày sinh" icon="calendar" onPress={() => undefined} />
          <Text style={[styles.sectionTitle, styles.sectionGap]}>Thông tin liên hệ</Text>
          <EditBox label="CMND/CCCD" placeholder="Nhập cmnd/cccd" />
          <EditBox label="Số điện thoại" value="0357276740" required />
          <SelectBox label="Tỉnh/Thành phố" value={province} placeholder="Chọn tỉnh/thành phố" onPress={() => setPicker('province')} />
          <SelectBox label="Quận/Huyện" value="" placeholder="Chọn quận/huyện" onPress={() => undefined} />
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
        <ProvinceSheet
          visible={picker === 'province'}
          search={search}
          options={filtered}
          onSearch={setSearch}
          onClose={() => setPicker(null)}
          onSelect={value => {
            setProvince(value);
            setPicker(null);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="THÔNG TIN CÁ NHÂN" onBack={onBack} rightIcon="edit" onRightPress={() => setEditing(true)} />
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
        <Info label="Quận/Huyện" />
        <Info label="Địa chỉ" />
      </ScrollView>
    </View>
  );
}

function ChangePasswordScreen({ onBack }: { onBack: () => void }) {
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
      <Header title="ĐỔI MẬT KHẨU" onBack={onBack} />
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
          onToggle={() => setVisible(current => ({ ...current, confirm: !current.confirm }))}
        />
        <TouchableOpacity style={styles.changeButton} onPress={submit}>
          <Text style={styles.changeText}>Đổi mật khẩu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Header({
  title,
  onBack,
  rightIcon,
  onRightPress,
}: {
  title: string;
  onBack: () => void;
  rightIcon?: 'history' | 'edit';
  onRightPress?: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerButton} onPress={onBack}>
        <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
          <Path d="M17.5 5.5L9 14l8.5 8.5" stroke="#fff" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity style={styles.headerButton} onPress={onRightPress} disabled={!rightIcon}>
        {rightIcon === 'history' && <Icon name="history" color="#fff" />}
        {rightIcon === 'edit' && (
          <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <Path d="M5 22l1.2-5.5L18 4.8l4.8 4.8L11 21.4 5 22z" fill="#fff" />
          </Svg>
        )}
      </TouchableOpacity>
    </View>
  );
}

function MenuRow({ row, onPress }: { row: Row; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Icon name={row.icon} color={BLUE} />
      </View>
      <Text style={styles.menuText}>{row.title}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function Barcode() {
  return (
    <Svg width="88%" height={92} viewBox="0 0 280 92">
      {Array.from({ length: 64 }, (_, index) => {
        const width = index % 5 === 0 ? 4 : index % 2 === 0 ? 2 : 1;
        return <Rect key={index} x={index * 4.3} y={4} width={width} height={84} fill="#000" />;
      })}
    </Svg>
  );
}

function PointRow({ icon, color, label, bold }: { icon: IconName; color: string; label: string; bold?: boolean }) {
  return (
    <View style={styles.pointRow}>
      <View style={[styles.pointIcon, { backgroundColor: `${color}18` }]}>
        <Icon name={icon} color={color} />
      </View>
      <Text style={[styles.pointLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.pointValue, bold && styles.green]}>0</Text>
    </View>
  );
}

function PasswordInput({
  value,
  placeholder,
  visible,
  error,
  onChangeText,
  onToggle,
}: {
  value: string;
  placeholder: string;
  visible: boolean;
  error: string;
  onChangeText: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <View style={styles.passwordWrap}>
      <View style={[styles.passwordBox, !!error && styles.errorBorder]}>
        <Icon name="lock" color="#111" />
        <TextInput
          style={styles.passwordInput}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#c4c4c4"
          secureTextEntry={!visible}
          onChangeText={onChangeText}
        />
        <TouchableOpacity style={styles.eyeButton} onPress={onToggle}>
          <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <Path d="M4 14s3.6-5.5 10-5.5S24 14 24 14s-3.6 5.5-10 5.5S4 14 4 14z" stroke="#999" strokeWidth={2.2} />
            {!visible && <Path d="M5 23L23 5" stroke="#999" strokeWidth={2.5} strokeLinecap="round" />}
          </Svg>
        </TouchableOpacity>
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
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

function EditBox({ label, value = '', placeholder, required, disabled }: { label: string; value?: string; placeholder?: string; required?: boolean; disabled?: boolean }) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}{required && <Text style={styles.required}> *</Text>}</Text>
      <TextInput style={[styles.input, disabled && styles.disabledInput]} value={value} placeholder={placeholder} placeholderTextColor="#bbb" editable={!disabled} />
    </View>
  );
}

function SelectBox({ label, value, placeholder, icon, onPress }: { label: string; value: string; placeholder: string; icon?: 'calendar'; onPress: () => void }) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={onPress}>
        <Text style={[styles.selectText, !value && styles.placeholder]}>{value || placeholder}</Text>
        <Text style={styles.selectIcon}>{icon === 'calendar' ? '▣' : '⌄'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function OptionSheet({ visible, title, options, onClose, onSelect }: { visible: boolean; title: string; options: string[]; onClose: () => void; onSelect: (value: string) => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.bottomSheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map(option => (
            <TouchableOpacity key={option} style={styles.optionRow} onPress={() => onSelect(option)}>
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function ProvinceSheet({ visible, search, options, onSearch, onClose, onSelect }: { visible: boolean; search: string; options: string[]; onSearch: (value: string) => void; onClose: () => void; onSelect: (value: string) => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.provinceSheet}>
          <Text style={styles.sheetTitle}>Tỉnh/Thành phố</Text>
          <TextInput style={styles.searchInput} value={search} placeholder="Tìm kiếm" placeholderTextColor="#bbb" onChangeText={onSearch} />
          <ScrollView>
            {options.map(option => (
              <TouchableOpacity key={option} style={styles.provinceRow} onPress={() => onSelect(option)}>
                <Text style={styles.provinceText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function ConfirmDialog({ visible, title, message, cancelText, confirmText, onClose }: { visible: boolean; title: string; message: string; cancelText: string; confirmText: string; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.confirmOverlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmTitle}>{title}</Text>
          <Text style={styles.confirmMessage}>{message}</Text>
          <View style={styles.confirmDivider} />
          <View style={styles.confirmActions}>
            <TouchableOpacity style={styles.confirmAction} onPress={onClose}>
              <Text style={styles.confirmCancel}>{cancelText}</Text>
            </TouchableOpacity>
            <View style={styles.confirmActionDivider} />
            <TouchableOpacity style={styles.confirmAction} onPress={onClose}>
              <Text style={styles.confirmOk}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Icon({ name, color }: { name: IconName; color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26" fill="none">
      {name === 'star' && <><Circle cx={13} cy={13} r={11} fill={color} /><Path d="M13 6.8l1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6L13 6.8z" fill="#fff" /></>}
      {name === 'history' && <><Path d="M9 15H4l3.4 3.4A9.2 9.2 0 1 0 6.5 7" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" /><Path d="M13 7.5V13l4.2 2.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" /></>}
      {name === 'card' && <><Rect x={4} y={7} width={18} height={13} rx={1.4} stroke={color} strokeWidth={2.4} /><Line x1={5} y1={11} x2={21} y2={11} stroke={color} strokeWidth={2.4} /></>}
      {name === 'person' && <><Circle cx={13} cy={8} r={3.4} fill={color} /><Path d="M5 21c1.6-4.4 4.2-6.6 8-6.6s6.4 2.2 8 6.6H5z" fill={color} /></>}
      {name === 'trash' && <><Path d="M8 8h10v13H8zM6.5 6.5h13v2h-13zM10.5 4.5h5v2h-5z" fill={color} /><Path d="M10.2 12l1.8 1.8 1.8-1.8 1.4 1.4-1.8 1.8 1.8 1.8-1.4 1.4-1.8-1.8-1.8 1.8L8.8 17l1.8-1.8-1.8-1.8L10.2 12z" fill="#fff" /></>}
      {name === 'lock' && <><Rect x={6} y={11} width={14} height={11} rx={1.5} stroke={color} strokeWidth={2.2} /><Path d="M9 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2.2} /><Circle cx={13} cy={16.2} r={1.4} fill={color} /></>}
      {name === 'trend' && <><Path d="M5 18l5.5-5.5 4 4L21 9" stroke={color} strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round" /><Path d="M16 9h5v5" stroke={color} strokeWidth={2.7} strokeLinecap="round" /></>}
      {name === 'cart' && <><Path d="M4 6h3l2 10h9.5l2.2-7.2H8.4L8 6z" fill={color} /><Circle cx={10} cy={20} r={2} fill={color} /><Circle cx={18} cy={20} r={2} fill={color} /></>}
      {name === 'wallet' && <><Path d="M5 7h16v12H5z" fill={color} /><Path d="M12 11h10v6H12z" fill="#fff" /><Circle cx={17.5} cy={14} r={1.5} fill={color} /></>}
      {name === 'logout' && <><Path d="M10 6H6v14h4M13 13h8M18 9l4 4-4 4" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /></>}
    </Svg>
  );
}

function HistoryBigIcon() {
  return <Icon name="history" color="#aaa" />;
}

function ReceiptIcon() {
  return (
    <Svg width={70} height={70} viewBox="0 0 70 70">
      <Path d="M22 15h30v38c0 6-4 9-9 9H24c-6 0-10-4-10-10v-6h8V15z" fill="#c6c6c8" />
      <Path d="M29 28h17v5H29zM29 39h14v5H29z" fill="#dedcdc" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  historyScreen: { flex: 1, backgroundColor: '#dedcdc' },
  header: { height: 64, backgroundColor: BLUE, flexDirection: 'row', alignItems: 'center' },
  headerButton: { width: 56, height: 64, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, color: '#fff', fontSize: 22, fontWeight: '900' },
  homeContent: { paddingBottom: 16 },
  profileCard: { margin: 6, marginTop: 14, padding: 18, alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, elevation: 5, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10 },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 1.7, borderColor: '#2a73bd', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#1f7ed9', fontSize: 32, fontWeight: '800' },
  name: { color: '#111', fontSize: 20, fontWeight: '900', marginTop: 10 },
  codeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  codeLabel: { color: MUTED, fontSize: 15, marginRight: 12 },
  code: { color: TEXT, fontSize: 16, fontWeight: '900', letterSpacing: 1.5 },
  summaryBox: { width: '100%', minHeight: 58, marginTop: 16, borderWidth: 1, borderColor: '#888', borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 44, backgroundColor: '#999' },
  summaryLabel: { color: TEXT, fontSize: 13, fontWeight: '600' },
  summaryValue: { color: '#1b79d8', fontSize: 19, fontWeight: '900' },
  vipText: { textAlign: 'center', fontWeight: '700', lineHeight: 20, marginTop: 24 },
  vipAmount: { color: '#ff4a3f', fontWeight: '900' },
  progressBar: { width: '100%', height: 8, borderRadius: 4, backgroundColor: '#aaa', marginTop: 12 },
  progressLabels: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  progressText: { color: '#444', fontSize: 14 },
  rowList: { marginTop: 36 },
  menuRow: { minHeight: 56, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER, flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 40, height: 40, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eaf3fb', marginRight: 20 },
  menuText: { flex: 1, color: MUTED, fontSize: 16, fontWeight: '600' },
  chevron: { color: '#aaa', fontSize: 34 },
  logoutButton: { minHeight: 50, margin: 8, marginTop: 20, borderRadius: 8, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  logoutText: { color: '#fff', fontSize: 18, fontWeight: '900', marginLeft: 8 },
  pointsCard: { margin: 16, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 14, backgroundColor: '#fff', elevation: 5 },
  pointRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: BORDER },
  pointIcon: { width: 54, height: 54, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 18 },
  pointLabel: { flex: 1, color: TEXT, fontSize: 20 },
  pointValue: { color: TEXT, fontSize: 25, fontWeight: '900' },
  bold: { fontWeight: '900' },
  green: { color: '#4ab460' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 90 },
  emptyText: { color: '#b7b4b4', fontSize: 22, marginTop: 16 },
  cardDetail: { padding: 16, paddingTop: 24 },
  memberCard: { borderWidth: 2, borderColor: '#31a1ff', borderRadius: 8, padding: 24, backgroundColor: '#fff', elevation: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  memberCardTitle: { flex: 1, fontSize: 22, fontWeight: '900', color: '#050505' },
  badge: { backgroundColor: '#35a5ff', borderRadius: 17, paddingHorizontal: 14, paddingVertical: 7 },
  badgeText: { color: '#fff', fontWeight: '900' },
  cardInfo: { color: '#333', fontSize: 20, marginTop: 10 },
  accountContent: { paddingHorizontal: 32, paddingTop: 24 },
  sectionTitle: { color: '#35358d', fontSize: 26, fontWeight: '900' },
  sectionGap: { marginTop: 26 },
  infoRow: { minHeight: 96, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ccc', justifyContent: 'center' },
  infoLabel: { color: '#3f3f3f', fontSize: 24 },
  infoValue: { color: '#050505', fontSize: 22, fontWeight: '900', marginTop: 14 },
  formContent: { padding: 24, paddingBottom: 28 },
  editField: { marginTop: 16 },
  editLabel: { color: '#363636', fontSize: 19, fontWeight: '800', marginBottom: 9 },
  required: { color: DANGER },
  input: { minHeight: 70, borderWidth: 1, borderColor: '#c9c9c9', borderRadius: 7, paddingHorizontal: 18, color: '#5d5d5d', fontSize: 22, flexDirection: 'row', alignItems: 'center' },
  disabledInput: { backgroundColor: '#c6c6c6' },
  selectText: { flex: 1, color: '#5d5d5d', fontSize: 22 },
  placeholder: { color: '#bbb' },
  selectIcon: { color: '#999', fontSize: 26 },
  saveButton: { minHeight: 60, borderRadius: 10, backgroundColor: '#3f82f1', alignItems: 'center', justifyContent: 'center', marginTop: 36 },
  saveText: { color: '#fff', fontSize: 20, fontWeight: '900' },
  cancelButton: { minHeight: 58, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  cancelText: { color: '#f24b40', fontSize: 20, fontWeight: '900' },
  passwordContent: { paddingHorizontal: 8, paddingTop: 26 },
  passwordWrap: { marginBottom: 28 },
  passwordBox: { minHeight: 74, borderWidth: 1.4, borderColor: '#cfcfcf', borderRadius: 7, paddingLeft: 24, paddingRight: 18, flexDirection: 'row', alignItems: 'center' },
  errorBorder: { borderColor: DANGER },
  passwordInput: { flex: 1, color: '#2f2f2f', fontSize: 24, paddingHorizontal: 18 },
  eyeButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: DANGER, fontSize: 18, marginTop: 12, marginLeft: 22 },
  changeButton: { minHeight: 74, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: BLUE, marginTop: 8 },
  changeText: { color: '#fff', fontSize: 25, fontWeight: '900' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.48)' },
  bottomSheet: { minHeight: 330, padding: 22, backgroundColor: '#fff' },
  provinceSheet: { maxHeight: '72%', minHeight: 470, paddingTop: 20, backgroundColor: '#fff' },
  sheetTitle: { color: '#373737', fontSize: 25, fontWeight: '900', textAlign: 'center', marginBottom: 22 },
  optionRow: { minHeight: 66, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#d6d6d6' },
  optionText: { color: '#393939', fontSize: 21 },
  searchInput: { minHeight: 66, marginHorizontal: 4, borderWidth: 1, borderColor: '#cfcfcf', borderRadius: 7, paddingHorizontal: 18, fontSize: 22 },
  provinceRow: { minHeight: 72, justifyContent: 'center', paddingHorizontal: 40 },
  provinceText: { color: '#555', fontSize: 22 },
  confirmOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, backgroundColor: 'rgba(0,0,0,0.52)' },
  confirmCard: { width: '100%', maxWidth: 520, borderRadius: 18, backgroundColor: '#fff', overflow: 'hidden' },
  confirmTitle: { color: '#2f2f2f', fontSize: 24, fontWeight: '900', textAlign: 'center', marginTop: 28 },
  confirmMessage: { color: '#565656', fontSize: 22, lineHeight: 29, textAlign: 'center', paddingHorizontal: 26, marginTop: 22, marginBottom: 24 },
  confirmDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#d7d7d7', marginHorizontal: 26 },
  confirmActions: { minHeight: 58, flexDirection: 'row', alignItems: 'center' },
  confirmAction: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center' },
  confirmActionDivider: { width: StyleSheet.hairlineWidth, height: 50, backgroundColor: '#d7d7d7' },
  confirmCancel: { color: '#a7a7a7', fontSize: 21 },
  confirmOk: { color: '#3e94ff', fontSize: 21, fontWeight: '900' },
});

export default MemberScreen;
