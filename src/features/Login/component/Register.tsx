import React, {useState} from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';

const BLUE = '#005f98';
const ACTION_BLUE = '#3f86ee';
const TEXT = '#222222';
const BORDER = '#c9c9c9';
const PLACEHOLDER = '#bcbcbc';
const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = Array.from({length: 12}, (_, index) => `Tháng ${index + 1}`);
const GENDERS = ['Nam', 'Nữ', 'Khác'];

type RegisterProps = {
  onBackToLogin?: () => void;
  onRegisterSuccess?: (user: {
    fullName: string;
    email: string;
    password: string;
  }) => void | Promise<void>;
};

function Register({onBackToLogin, onRegisterSuccess}: RegisterProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [gender, setGender] = useState('');
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu nhập lại không khớp.');
      return;
    }

    if (!acceptedTerms) {
      Alert.alert('Thông báo', 'Vui lòng đồng ý điều khoản sử dụng.');
      return;
    }

    try {
      setIsRegistering(true);

      await onRegisterSuccess?.({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      Alert.alert('Thành công', 'Đăng ký tài khoản thành công.');
    } catch {
      Alert.alert(
        'Thông báo',
        'Không thể lưu tài khoản. Vui lòng thử lại.',
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE} />

      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.backButton}
          onPress={onBackToLogin}>
          <BackIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ĐĂNG KÝ</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>THÔNG TIN BẮT BUỘC</Text>

        <FormField
          label="Họ và tên"
          required
          placeholder="Nhập họ và tên"
          value={fullName}
          onChangeText={setFullName}
        />
        <FormField
          label="Địa chỉ Email"
          required
          placeholder="Nhập địa chỉ email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <PasswordField
          label="Mật khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={securePassword}
          onToggleSecure={() => setSecurePassword(value => !value)}
        />
        <PasswordField
          label="Nhập lại mật khẩu"
          placeholder="Nhập nhập lại mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={secureConfirmPassword}
          onToggleSecure={() => setSecureConfirmPassword(value => !value)}
        />
        <FormField
          label="Số điện thoại"
          placeholder="Nhập số điện thoại"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Text style={[styles.sectionTitle, styles.extraSection]}>
          THÔNG TIN BỔ SUNG
        </Text>

        <SelectField
          label="Ngày sinh"
          placeholder="Chọn ngày sinh"
          value={birthDate ? formatDate(birthDate) : undefined}
          icon="calendar"
          onPress={() => setShowCalendar(true)}
        />
        <SelectField
          label="Giới tính"
          placeholder="Chọn giới tính"
          value={gender || undefined}
          icon="chevron"
          onPress={() => setShowGenderPicker(true)}
        />

        <View style={styles.termsRow}>
          <Pressable
            hitSlop={10}
            style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
            onPress={() => setAcceptedTerms(value => !value)}>
            {acceptedTerms && <View style={styles.checkboxMark} />}
          </Pressable>
          <Text style={styles.termsText}>
            Tôi cam kết tuân theo{' '}
            <Text style={styles.linkText}>chính sách bảo mật</Text> và{' '}
            <Text style={styles.linkText}>điều khoản sử dụng</Text> của
            FilmGo.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={isRegistering ? 1 : 0.85}
          disabled={isRegistering}
          style={[
            styles.registerButton,
            isRegistering && styles.registerButtonDisabled,
          ]}
          onPress={handleRegister}>
          <Text style={styles.registerButtonText}>
            {isRegistering ? 'ĐANG ĐĂNG KÝ...' : 'Đăng ký'}
          </Text>
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginMuted}>Đăng kí tài khoản FilmGo</Text>
          <TouchableOpacity activeOpacity={0.75} onPress={onBackToLogin}>
            <Text style={styles.loginLink}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DatePickerModal
        visible={showCalendar}
        currentMonth={calendarMonth}
        selectedDate={birthDate}
        onClose={() => setShowCalendar(false)}
        onChangeMonth={setCalendarMonth}
        onSelectDate={date => {
          setBirthDate(date);
          setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
          setShowCalendar(false);
        }}
      />

      <GenderPickerModal
        visible={showGenderPicker}
        selectedGender={gender}
        onClose={() => setShowGenderPicker(false)}
        onSelectGender={value => {
          setGender(value);
          setShowGenderPicker(false);
        }}
      />
    </SafeAreaView>
  );
}

type FormFieldProps = {
  label: string;
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  required?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

function FormField({
  label,
  placeholder,
  value,
  onChangeText,
  required,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FormFieldProps) {
  return (
    <View style={styles.field}>
      <FieldLabel label={label} required={required} />
      <View style={styles.inputBox}>
        <TextInput
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={PLACEHOLDER}
          value={value}
          onChangeText={onChangeText}
          style={styles.input}
        />
      </View>
    </View>
  );
}

type PasswordFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry: boolean;
  onToggleSecure: () => void;
};

function PasswordField({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  onToggleSecure,
}: PasswordFieldProps) {
  return (
    <View style={styles.field}>
      <FieldLabel label={label} required />
      <View style={styles.inputBox}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={PLACEHOLDER}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          style={styles.input}
        />
        <Pressable hitSlop={12} style={styles.trailingIcon} onPress={onToggleSecure}>
          {secureTextEntry ? <EyeOffIcon /> : <EyeIcon />}
        </Pressable>
      </View>
    </View>
  );
}

type SelectFieldProps = {
  label: string;
  placeholder: string;
  value?: string;
  icon: 'calendar' | 'chevron';
  onPress?: () => void;
};

function SelectField({label, placeholder, value, icon, onPress}: SelectFieldProps) {
  return (
    <View style={styles.field}>
      <FieldLabel label={label} />
      <TouchableOpacity activeOpacity={0.75} style={styles.inputBox} onPress={onPress}>
        <Text style={[styles.selectPlaceholder, value && styles.selectValue]}>
          {value ?? placeholder}
        </Text>
        <View style={styles.trailingIcon}>
          {icon === 'calendar' ? <CalendarIcon /> : <ChevronDownIcon />}
        </View>
      </TouchableOpacity>
    </View>
  );
}

type DatePickerModalProps = {
  visible: boolean;
  currentMonth: Date;
  selectedDate: Date | null;
  onClose: () => void;
  onChangeMonth: (date: Date) => void;
  onSelectDate: (date: Date) => void;
};

function DatePickerModal({
  visible,
  currentMonth,
  selectedDate,
  onClose,
  onChangeMonth,
  onSelectDate,
}: DatePickerModalProps) {
  const [pickerMode, setPickerMode] = useState<'day' | 'month' | 'year'>('day');
  const days = getCalendarDays(currentMonth);
  const yearPageStart = currentMonth.getFullYear() - (currentMonth.getFullYear() % 12);
  const years = Array.from({length: 12}, (_, index) => yearPageStart + index);

  const movePage = (offset: number) => {
    if (pickerMode === 'day') {
      onChangeMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1),
      );
      return;
    }

    if (pickerMode === 'month') {
      onChangeMonth(new Date(currentMonth.getFullYear() + offset, currentMonth.getMonth(), 1));
      return;
    }

    onChangeMonth(new Date(currentMonth.getFullYear() + offset * 12, currentMonth.getMonth(), 1));
  };

  const selectMonth = (monthIndex: number) => {
    onChangeMonth(new Date(currentMonth.getFullYear(), monthIndex, 1));
    setPickerMode('day');
  };

  const selectYear = (year: number) => {
    onChangeMonth(new Date(year, currentMonth.getMonth(), 1));
    setPickerMode('month');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.monthButton}
              onPress={() => movePage(-1)}>
              <Text style={styles.monthButtonText}>‹</Text>
            </TouchableOpacity>
            {pickerMode === 'year' ? (
              <Text style={styles.calendarTitle}>
                {yearPageStart} - {yearPageStart + 11}
              </Text>
            ) : (
              <View style={styles.calendarTitleRow}>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setPickerMode('month')}>
                  <Text style={styles.calendarTitle}>
                    Tháng {currentMonth.getMonth() + 1}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.calendarTitleSlash}>/</Text>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => setPickerMode('year')}>
                  <Text style={styles.calendarTitle}>{currentMonth.getFullYear()}</Text>
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.monthButton}
              onPress={() => movePage(1)}>
              <Text style={styles.monthButtonText}>›</Text>
            </TouchableOpacity>
          </View>

          {pickerMode === 'day' && (
            <>
              <View style={styles.weekRow}>
                {WEEK_DAYS.map(day => (
                  <Text key={day} style={styles.weekDay}>
                    {day}
                  </Text>
                ))}
              </View>

              <View style={styles.dayGrid}>
                {days.map((date, index) => {
                  const isSelected = !!selectedDate && isSameDay(date, selectedDate);
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth();

                  return (
                    <TouchableOpacity
                      key={`${date.toISOString()}-${index}`}
                      activeOpacity={0.75}
                      style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                      onPress={() => onSelectDate(date)}>
                      <Text
                        style={[
                          styles.dayText,
                          !isCurrentMonth && styles.dayTextMuted,
                          isSelected && styles.dayTextSelected,
                        ]}>
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {pickerMode === 'month' && (
            <View style={styles.optionGrid}>
              {MONTHS.map((month, index) => {
                const isSelected = index === currentMonth.getMonth();

                return (
                  <TouchableOpacity
                    key={month}
                    activeOpacity={0.75}
                    style={[styles.optionCell, isSelected && styles.optionCellSelected]}
                    onPress={() => selectMonth(index)}>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {pickerMode === 'year' && (
            <View style={styles.optionGrid}>
              {years.map(year => {
                const isSelected = year === currentMonth.getFullYear();

                return (
                  <TouchableOpacity
                    key={year}
                    activeOpacity={0.75}
                    style={[styles.optionCell, isSelected && styles.optionCellSelected]}
                    onPress={() => selectYear(year)}>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type GenderPickerModalProps = {
  visible: boolean;
  selectedGender: string;
  onClose: () => void;
  onSelectGender: (gender: string) => void;
};

function GenderPickerModal({
  visible,
  selectedGender,
  onClose,
  onSelectGender,
}: GenderPickerModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.genderCard}>
          <Text style={styles.genderTitle}>Chọn giới tính</Text>
          {GENDERS.map(item => {
            const isSelected = item === selectedGender;

            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.75}
                style={[styles.genderOption, isSelected && styles.genderOptionSelected]}
                onPress={() => onSelectGender(item)}>
                <Text
                  style={[
                    styles.genderOptionText,
                    isSelected && styles.genderOptionTextSelected,
                  ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatDate(date: Date) {
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

function getCalendarDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDay = new Date(year, monthIndex, 1);
  const mondayStartIndex = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, monthIndex, 1 - mondayStartIndex);

  return Array.from({length: 42}, (_, index) => {
    return new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + index,
    );
  });
}

function FieldLabel({label, required}: {label: string; required?: boolean}) {
  return (
    <Text style={styles.label}>
      {label} {required && <Text style={styles.required}>*</Text>}
    </Text>
  );
}

function BackIcon() {
  return (
    <Svg width={25} height={43} viewBox="0 0 25 43" fill="none">
      <Path
        d="M21.5 4L4 21.5L21.5 39"
        stroke="#ffffff"
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeOffIcon() {
  return (
    <Svg width={31} height={24} viewBox="0 0 31 24" fill="none">
      <Path
        d="M2 12C5.4 6.5 10 3.8 15.5 3.8C21 3.8 25.6 6.5 29 12C27.9 13.8 26.6 15.3 25.2 16.5"
        stroke="#9d9d9d"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 15.2C19 16.2 17.4 16.9 15.5 16.9C12.7 16.9 10.5 14.7 10.5 12C10.5 10.2 11.5 8.7 13.1 7.8"
        stroke="#9d9d9d"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M5 2L26 22"
        stroke="#9d9d9d"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function EyeIcon() {
  return (
    <Svg width={31} height={24} viewBox="0 0 31 24" fill="none">
      <Path
        d="M2 12C5.4 6.5 10 3.8 15.5 3.8C21 3.8 25.6 6.5 29 12C25.6 17.5 21 20.2 15.5 20.2C10 20.2 5.4 17.5 2 12Z"
        stroke="#9d9d9d"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 16.9C18.3 16.9 20.5 14.7 20.5 12C20.5 9.3 18.3 7.1 15.5 7.1C12.7 7.1 10.5 9.3 10.5 12C10.5 14.7 12.7 16.9 15.5 16.9Z"
        stroke="#9d9d9d"
        strokeWidth={3}
      />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
      <Rect x={4} y={6} width={20} height={18} rx={1.5} fill="#8f8f8f" />
      <Rect x={7} y={11} width={14} height={10} fill="#ffffff" />
      <Path
        d="M9 3V8M19 3V8"
        stroke="#8f8f8f"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M10 14H12M16 14H18M10 18H12M16 18H18"
        stroke="#8f8f8f"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ChevronDownIcon() {
  return (
    <Svg width={25} height={15} viewBox="0 0 25 15" fill="none">
      <Path
        d="M3 3L12.5 12L22 3"
        stroke="#9d9d9d"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 96,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: BLUE,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    height: 44,
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    marginLeft: 26,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    marginBottom: 10,
  },
  extraSection: {
    marginTop: 8,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    color: TEXT,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  required: {
    color: '#e23b3b',
  },
  inputBox: {
    height: 48,
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 7,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: TEXT,
    fontSize: 14,
    paddingVertical: 0,
  },
  trailingIcon: {
    height: 38,
    width: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectPlaceholder: {
    flex: 1,
    color: PLACEHOLDER,
    fontSize: 14,
  },
  selectValue: {
    color: TEXT,
  },
  termsRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: 18,
  },
  checkbox: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ACTION_BLUE,
    marginTop: 4,
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: ACTION_BLUE,
  },
  checkboxMark: {
    width: 10,
    height: 10,
    backgroundColor: '#ffffff',
  },
  termsText: {
    flex: 1,
    color: TEXT,
    fontSize: 14,
    lineHeight: 20,
  },
  linkText: {
    color: '#2e9be8',
  },
  registerButton: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: ACTION_BLUE,
    marginBottom: 16,
  },
  registerButtonDisabled: {
    opacity: 0.65,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  loginRow: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  loginMuted: {
    color: '#9d9d9d',
    fontSize: 13,
    marginRight: 12,
  },
  loginLink: {
    color: '#2f80dc',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 24,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  calendarHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    color: ACTION_BLUE,
    fontSize: 28,
    fontWeight: '700',
  },
  calendarTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
  },
  calendarTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  calendarTitleSlash: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 3,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDay: {
    width: `${100 / 7}%`,
    color: '#7f7f7f',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  dayCellSelected: {
    backgroundColor: ACTION_BLUE,
  },
  dayText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextMuted: {
    color: '#c4c4c4',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 4,
  },
  optionCell: {
    width: '33.333%',
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  optionCellSelected: {
    backgroundColor: ACTION_BLUE,
  },
  optionText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  genderCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  genderTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  genderOption: {
    height: 46,
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 14,
  },
  genderOptionSelected: {
    backgroundColor: ACTION_BLUE,
  },
  genderOptionText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '700',
  },
  genderOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
});

export default Register;
