import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { BLUE, BORDER, DANGER, MemberIconName, MenuRow } from './memberData';

const WEEK_DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MONTHS = Array.from({ length: 12 }, (_, index) => `Tháng ${index + 1}`);

export function formatBirthDate(date: Date) {
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

  return Array.from({ length: 42 }, (_, index) => {
    return new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + index,
    );
  });
}

export function MemberHeader({
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
          <Path
            d="M17.5 5.5L9 14l8.5 8.5"
            stroke="#fff"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity
        style={styles.headerButton}
        disabled={!rightIcon}
        onPress={onRightPress}
      >
        {rightIcon === 'history' && <MemberIcon name="history" color="#fff" />}
        {rightIcon === 'edit' && (
          <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <Path d="M5 22l1.2-5.5L18 4.8l4.8 4.8L11 21.4 5 22z" fill="#fff" />
          </Svg>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function MemberIcon({ name, color }: { name: MemberIconName; color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 26 26" fill="none">
      {name === 'star' && (
        <>
          <Circle cx={13} cy={13} r={11} fill={color} />
          <Path
            d="M13 6.8l1.8 3.7 4.1.6-3 2.9.7 4.1-3.6-1.9-3.6 1.9.7-4.1-3-2.9 4.1-.6L13 6.8z"
            fill="#fff"
          />
        </>
      )}
      {name === 'history' && (
        <>
          <Path
            d="M9 15H4l3.4 3.4A9.2 9.2 0 1 0 6.5 7"
            stroke={color}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M13 7.5V13l4.2 2.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
        </>
      )}
      {name === 'card' && (
        <>
          <Rect x={4} y={7} width={18} height={13} rx={1.4} stroke={color} strokeWidth={2.4} />
          <Line x1={5} y1={11} x2={21} y2={11} stroke={color} strokeWidth={2.4} />
        </>
      )}
      {name === 'person' && (
        <>
          <Circle cx={13} cy={8} r={3.4} fill={color} />
          <Path d="M5 21c1.6-4.4 4.2-6.6 8-6.6s6.4 2.2 8 6.6H5z" fill={color} />
        </>
      )}
      {name === 'trash' && (
        <>
          <Path d="M8 8h10v13H8zM6.5 6.5h13v2h-13zM10.5 4.5h5v2h-5z" fill={color} />
          <Path d="M10.2 12l1.8 1.8 1.8-1.8 1.4 1.4-1.8 1.8 1.8 1.8-1.4 1.4-1.8-1.8-1.8 1.8L8.8 17l1.8-1.8-1.8-1.8L10.2 12z" fill="#fff" />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x={6} y={11} width={14} height={11} rx={1.5} stroke={color} strokeWidth={2.2} />
          <Path d="M9 11V8a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2.2} />
          <Circle cx={13} cy={16.2} r={1.4} fill={color} />
        </>
      )}
      {name === 'trend' && (
        <>
          <Path d="M5 18l5.5-5.5 4 4L21 9" stroke={color} strokeWidth={2.7} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M16 9h5v5" stroke={color} strokeWidth={2.7} strokeLinecap="round" />
        </>
      )}
      {name === 'cart' && (
        <>
          <Path d="M4 6h3l2 10h9.5l2.2-7.2H8.4L8 6z" fill={color} />
          <Circle cx={10} cy={20} r={2} fill={color} />
          <Circle cx={18} cy={20} r={2} fill={color} />
        </>
      )}
      {name === 'wallet' && (
        <>
          <Path d="M5 7h16v12H5z" fill={color} />
          <Path d="M12 11h10v6H12z" fill="#fff" />
          <Circle cx={17.5} cy={14} r={1.5} fill={color} />
        </>
      )}
      {name === 'logout' && (
        <Path
          d="M10 6H6v14h4M13 13h8M18 9l4 4-4 4"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
}

export function MemberMenuRow({ row, onPress }: { row: MenuRow; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuIcon}>
        <MemberIcon name={row.icon} color={BLUE} />
      </View>
      <Text style={styles.menuText}>{row.title}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export function Barcode() {
  return (
    <Svg width="88%" height={92} viewBox="0 0 280 92">
      {Array.from({ length: 64 }, (_, index) => {
        const width = index % 5 === 0 ? 4 : index % 2 === 0 ? 2 : 1;
        return (
          <Rect
            key={index}
            x={index * 4.3}
            y={4}
            width={width}
            height={84}
            fill="#000"
          />
        );
      })}
    </Svg>
  );
}

export function ConfirmDialog({
  visible,
  title,
  message,
  cancelText,
  confirmText,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
  onClose: () => void;
  onConfirm?: () => void;
}) {
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
            <TouchableOpacity
              style={styles.confirmAction}
              onPress={() => {
                onConfirm?.();
              }}>
              <Text style={styles.confirmOk}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function PasswordInput({
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
        <MemberIcon name="lock" color="#111" />
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

export function EditBox({
  label,
  value = '',
  placeholder,
  required,
  disabled,
  onChangeText,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onChangeText?: (value: string) => void;
}) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, disabled && styles.disabledInput]}
        value={value}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        editable={!disabled}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export function SelectBox({
  label,
  value,
  placeholder,
  icon,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  icon?: 'calendar';
  onPress: () => void;
}) {
  return (
    <View style={styles.editField}>
      <Text style={styles.editLabel}>{label}</Text>
      <TouchableOpacity style={styles.input} onPress={onPress}>
        <Text style={[styles.selectText, !value && styles.placeholder]}>
          {value || placeholder}
        </Text>
        <Text style={styles.selectIcon}>{icon === 'calendar' ? '▣' : '⌄'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function DatePickerModal({
  visible,
  currentMonth,
  selectedDate,
  onClose,
  onChangeMonth,
  onSelectDate,
}: {
  visible: boolean;
  currentMonth: Date;
  selectedDate: Date | null;
  onClose: () => void;
  onChangeMonth: (date: Date) => void;
  onSelectDate: (date: Date) => void;
}) {
  const [pickerMode, setPickerMode] = useState<'day' | 'month' | 'year'>('day');
  const days = getCalendarDays(currentMonth);
  const yearPageStart =
    currentMonth.getFullYear() - (currentMonth.getFullYear() % 12);
  const years = Array.from({ length: 12 }, (_, index) => yearPageStart + index);

  const movePage = (offset: number) => {
    if (pickerMode === 'day') {
      onChangeMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1),
      );
      return;
    }
    if (pickerMode === 'month') {
      onChangeMonth(
        new Date(currentMonth.getFullYear() + offset, currentMonth.getMonth(), 1),
      );
      return;
    }
    onChangeMonth(
      new Date(currentMonth.getFullYear() + offset * 12, currentMonth.getMonth(), 1),
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.calendarOverlay} onPress={onClose}>
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
                  <Text style={styles.calendarTitle}>
                    {currentMonth.getFullYear()}
                  </Text>
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
                  const isSelected =
                    !!selectedDate && isSameDay(date, selectedDate);
                  const isCurrentMonth =
                    date.getMonth() === currentMonth.getMonth();
                  return (
                    <TouchableOpacity
                      key={`${date.toISOString()}-${index}`}
                      activeOpacity={0.75}
                      style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                      ]}
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
                    style={[
                      styles.optionCell,
                      isSelected && styles.optionCellSelected,
                    ]}
                    onPress={() => {
                      onChangeMonth(
                        new Date(currentMonth.getFullYear(), index, 1),
                      );
                      setPickerMode('day');
                    }}>
                    <Text
                      style={[
                        styles.calendarOptionText,
                        isSelected && styles.calendarOptionTextSelected,
                      ]}>
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
                    style={[
                      styles.optionCell,
                      isSelected && styles.optionCellSelected,
                    ]}
                    onPress={() => {
                      onChangeMonth(new Date(year, currentMonth.getMonth(), 1));
                      setPickerMode('month');
                    }}>
                    <Text
                      style={[
                        styles.calendarOptionText,
                        isSelected && styles.calendarOptionTextSelected,
                      ]}>
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

export function OptionSheet({
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
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.bottomSheet}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              style={styles.optionRow}
              onPress={() => onSelect(option)}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export function ProvinceSheet({
  visible,
  search,
  options,
  onSearch,
  onClose,
  onSelect,
}: {
  visible: boolean;
  search: string;
  options: string[];
  onSearch: (value: string) => void;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.provinceSheet}>
          <Text style={styles.sheetTitle}>Tỉnh/Thành phố</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            placeholder="Tìm kiếm"
            placeholderTextColor="#bbb"
            onChangeText={onSearch}
          />
          <ScrollView>
            {options.map(option => (
              <TouchableOpacity
                key={option}
                style={styles.provinceRow}
                onPress={() => onSelect(option)}
              >
                <Text style={styles.provinceText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 56,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  menuRow: {
    minHeight: 56,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf3fb',
    marginRight: 20,
  },
  menuText: {
    flex: 1,
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    color: '#aaa',
    fontSize: 34,
  },
  passwordWrap: {
    marginBottom: 28,
  },
  passwordBox: {
    minHeight: 74,
    borderWidth: 1.4,
    borderColor: '#cfcfcf',
    borderRadius: 7,
    paddingLeft: 24,
    paddingRight: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBorder: {
    borderColor: DANGER,
  },
  passwordInput: {
    flex: 1,
    color: '#2f2f2f',
    fontSize: 24,
    paddingHorizontal: 18,
  },
  eyeButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: DANGER,
    fontSize: 18,
    marginTop: 12,
    marginLeft: 22,
  },
  editField: {
    marginTop: 16,
  },
  editLabel: {
    color: '#363636',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 9,
  },
  required: {
    color: DANGER,
  },
  input: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#c9c9c9',
    borderRadius: 7,
    paddingHorizontal: 18,
    color: '#5d5d5d',
    fontSize: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledInput: {
    backgroundColor: '#c6c6c6',
  },
  selectText: {
    flex: 1,
    color: '#5d5d5d',
    fontSize: 22,
  },
  placeholder: {
    color: '#bbb',
  },
  selectIcon: {
    color: '#999',
    fontSize: 26,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  bottomSheet: {
    minHeight: 330,
    padding: 22,
    backgroundColor: '#fff',
  },
  provinceSheet: {
    maxHeight: '72%',
    minHeight: 470,
    paddingTop: 20,
    backgroundColor: '#fff',
  },
  sheetTitle: {
    color: '#373737',
    fontSize: 25,
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
  },
  searchInput: {
    minHeight: 66,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#cfcfcf',
    borderRadius: 7,
    paddingHorizontal: 18,
    fontSize: 22,
  },
  provinceRow: {
    minHeight: 72,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  provinceText: {
    color: '#555',
    fontSize: 22,
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
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  confirmTitle: {
    color: '#2f2f2f',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 28,
  },
  confirmMessage: {
    color: '#565656',
    fontSize: 22,
    lineHeight: 29,
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
  confirmCancel: {
    color: '#a7a7a7',
    fontSize: 21,
  },
  confirmOk: {
    color: '#3e94ff',
    fontSize: 21,
    fontWeight: '900',
  },
  calendarOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  calendarCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 14,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  monthButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonText: {
    color: BLUE,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 30,
  },
  calendarTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarTitle: {
    color: '#222',
    fontSize: 17,
    fontWeight: '800',
  },
  calendarTitleSlash: {
    color: '#222',
    fontSize: 17,
    fontWeight: '800',
    marginHorizontal: 4,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekDay: {
    width: '14.28%',
    textAlign: 'center',
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
  },
  dayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: BLUE,
    borderRadius: 20,
  },
  dayText: {
    color: '#222',
    fontSize: 15,
    fontWeight: '600',
  },
  dayTextMuted: {
    color: '#bbb',
  },
  dayTextSelected: {
    color: '#fff',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 8,
  },
  optionCell: {
    width: '33.33%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  optionCellSelected: {
    backgroundColor: '#e8f3fb',
  },
  calendarOptionText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  calendarOptionTextSelected: {
    color: BLUE,
    fontWeight: '800',
  },
});
