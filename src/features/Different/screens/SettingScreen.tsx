import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BLUE = '#005f98';

type SettingScreenProps = {
  onBack: () => void;
};

type SettingRow = {
  title: string;
  screen: SettingDetailScreen;
};

type SettingDetailScreen = 'faq' | 'paymentPolicy' | 'privacyPolicy';
type FaqGroup = 'online' | 'general';

const settingRows: SettingRow[] = [
  { title: 'Hỏi đáp', screen: 'faq' },
  { title: 'Chính sách thanh toán', screen: 'paymentPolicy' },
  { title: 'Chính sách bảo mật', screen: 'privacyPolicy' },
];

const onlineQuestions = [
  'Vì sao tôi đã đặt vé thành công mà chưa nhận được xác nhận đặt vé?',
  'Có thể hủy hoặc thay đổi vé đã mua online được không?',
  'Vé liệt kê trên website áp dụng cho đối tượng nào?',
  'Sau khi đặt mua vé thành công thì tôi nên làm gì?',
  'Tại sao thẻ của bạn bị từ chối, giao dịch thanh toán không thành công?',
  'Tôi đã thanh toán thành công, tiền trong tài khoản đã bị trừ, nhưng không nhận được email xác nhận từ FilmGo thì tôi phải làm gì?',
  'HƯỚNG DẪN ĐẶT VÉ ONLINE',
  'Làm sao để thanh toán Online?',
];

const generalQuestions = [
  'Tôi có được mang đồ ăn từ bên ngoài vào không?',
  'HƯỚNG DẪN ĐẶT VÉ ONLINE',
  'Vấn đề chụp hình, ghi âm tại rạp?',
  'Chính sách giảm giá cho HSSV, trẻ em và người già?',
  'FilmGo Combo, Sweet Combo và Family Combo? Việc mua combo ở Quầy vé có lợi gì?',
  '"Qui định khi xem phim" là gì?',
  'Các vị trí ghế có gì khác nhau?',
  'Tại sao không được mang thú cưng vào rạp cũng như hút thuốc trong rạp?',
  'Tôi có được hoàn lại tiền vé hoặc thay đổi suất chiếu?',
  'Trước khi trình chiếu ở Việt Nam, các bộ phim được kiểm duyệt thế nào?',
  'Các định dạng phim khác nhau chỗ nào? Tôi nên lựa chọn phim sao cho hợp lý?',
  '2D Digital là gì?',
];

function SettingScreen({ onBack }: SettingScreenProps) {
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [detailScreen, setDetailScreen] = useState<SettingDetailScreen | null>(null);

  if (detailScreen === 'faq') {
    return <FaqScreen onBack={() => setDetailScreen(null)} />;
  }

  if (detailScreen === 'paymentPolicy') {
    return <PaymentPolicyScreen onBack={() => setDetailScreen(null)} />;
  }

  if (detailScreen === 'privacyPolicy') {
    return <PrivacyPolicyScreen onBack={() => setDetailScreen(null)} />;
  }

  return (
    <View style={styles.screen}>
      <Header title="CÀI ĐẶT" onBack={onBack} />

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Ngôn ngữ</Text>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.languageRow}
          onPress={() => setLanguage('vi')}
        >
          <Text style={styles.languageText}>Tiếng Việt</Text>
          {language === 'vi' && <Text style={styles.checkMark}>✓</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.languageRow}
          onPress={() => setLanguage('en')}
        >
          <Text style={styles.languageText}>English</Text>
          {language === 'en' && <Text style={styles.checkMark}>✓</Text>}
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, styles.otherLabel]}>Khác</Text>
        <View style={styles.switchRow}>
          <Text style={styles.settingText}>Thông báo</Text>
          <Switch
            value={notificationEnabled}
            trackColor={{ false: '#bfc2c5', true: '#9bd2ff' }}
            thumbColor={notificationEnabled ? '#2d9df2' : '#f2f2f2'}
            onValueChange={setNotificationEnabled}
          />
        </View>

        {settingRows.map(row => (
          <TouchableOpacity
            key={row.title}
            activeOpacity={0.75}
            style={styles.linkRow}
            onPress={() => setDetailScreen(row.screen)}
          >
            <Text style={styles.settingText}>{row.title}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function FaqScreen({ onBack }: { onBack: () => void }) {
  const [group, setGroup] = useState<FaqGroup | null>(null);

  if (group) {
    return (
      <FaqQuestionScreen
        group={group}
        onBack={() => setGroup(null)}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <Header title="FAQ" onBack={onBack} />
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.faqCategoryRow}
        onPress={() => setGroup('online')}
      >
        <Text style={styles.faqCategoryText}>Các câu hỏi thường gặp khi đặt vé online</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.faqCategoryRow}
        onPress={() => setGroup('general')}
      >
        <Text style={styles.faqCategoryText}>Câu hỏi thường gặp</Text>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

function FaqQuestionScreen({
  group,
  onBack,
}: {
  group: FaqGroup;
  onBack: () => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const questions = group === 'online' ? onlineQuestions : generalQuestions;
  const title =
    group === 'online' ? 'FAQ - CÁC CÂU HỎI THƯỜNG G...' : 'FAQ - CÂU HỎI THƯỜNG GẶP';

  return (
    <View style={styles.faqQuestionScreen}>
      <Header title={title} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.faqQuestionContent}>
        {questions.map((question, index) => {
          const isOpen = openIndex === index;

          return (
            <TouchableOpacity
              key={`${question}-${index}`}
              activeOpacity={0.8}
              style={styles.questionCard}
              onPress={() => setOpenIndex(isOpen ? null : index)}
            >
              <View style={styles.questionHeader}>
                <Text style={styles.questionText}>{question}</Text>
                <Text style={[styles.downIcon, isOpen && styles.downIconOpen]}>⌄</Text>
              </View>
              {isOpen && (
                <Text style={styles.answerText}>
                  FilmGo sẽ hỗ trợ Quý khách kiểm tra thông tin và hướng dẫn xử lý
                  trong thời gian sớm nhất.
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PaymentPolicyScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <Header title="CHÍNH SÁCH THANH TOÁN" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.policyContent}>
        <Text style={styles.policyParagraph}>
          Xin cảm ơn và chúc Quý khách hàng có những giây phút xem phim tuyệt vời tại
          FilmGo!
        </Text>
        <Text style={styles.policyStrong}>
          Sau đây là một số lưu ý trước khi thanh toán trực tuyến:
        </Text>
        <Text style={styles.policyParagraph}>
          1. Thẻ phải được kích hoạt chức năng thanh toán trực tuyến, và có đủ hạn mức/
          số dư để thanh toán. Quý khách cần nhập chính xác thông tin thẻ (tên chủ thẻ,
          số thẻ, ngày hết hạn, số CVC, OTP,...).
        </Text>
        <Text style={styles.policyParagraph}>
          2. Vé và hàng hóa đã thanh toán thành công không thể hủy/đổi trả/hoàn tiền vì
          bất kỳ lý do gì. FilmGo chỉ thực hiện hoàn tiền trong trường hợp thẻ của
          Quý khách đã bị trừ tiền nhưng hệ thống không ghi nhận việc đặt vé/đơn hàng
          thành công.
        </Text>
        <Text style={styles.policyParagraph}>
          3. Trong vòng 30 phút kể từ khi thanh toán thành công, FilmGo sẽ gửi Quý
          khách mã xác nhận thông tin vé/đơn hàng qua email. Nếu cần hỗ trợ, Quý khách
          vui lòng phản hồi về Fanpage Facebook FilmGo trong vòng 60 phút kể từ
          khi thanh toán vé thành công.
        </Text>
        <Text style={styles.policyParagraph}>
          4. FilmGo không chịu trách nhiệm trong trường hợp thông tin địa chỉ
          email, số điện thoại Quý khách cung cấp không chính xác.
        </Text>
        <Text style={styles.policyParagraph}>
          5. FilmGo không chịu trách nhiệm trong trường hợp Quý khách bị lộ thông tin
          thẻ, mật khẩu, OTP,... dẫn đến việc bị trừ tiền trái phép.
        </Text>
        <Text style={styles.policyParagraph}>
          6. Theo quy định của Cục Điện Ảnh, một số phim sẽ không dành cho khán giả dưới
          13, hoặc 16, hoặc 18 tuổi. Khi đến lấy vé tại quầy vé, nhân viên có thể yêu cầu Quý khách
          xuất trình giấy tờ tùy thân để xác nhận độ tuổi. Nếu Quý khách không xuất trình được giấy tờ tùy thân, FilmGo có quyền từ chối phục vụ và không hoàn tiền.
        </Text>
        <Text style={styles.policyParagraph}>
          7. FilmGo có quyền từ chối phục vụ hoặc hủy vé/đơn hàng nếu phát hiện Quý
          khách vi phạm các quy định của FilmGo, hoặc có hành vi gian lận, lừa đảo,
        </Text>
      </ScrollView>
    </View>
  );

}

function PrivacyPolicyScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <Header title="CHÍNH SÁCH BẢO MẬT" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.policyContent}>
        <Text style={styles.policyTitle}>
          CHÍNH SÁCH BẢO MẬT THÔNG TIN CÁ NHÂN KHÁCH HÀNG
        </Text>
        <Text style={styles.policyStrong}>1. Mục đích và phạm vi thu thập</Text>
        <Text style={styles.policyParagraph}>
          Việc thu thập dữ liệu chủ yếu trên website FilmGo bao gồm: email, điện
          thoại, số chứng minh thư nhân dân/căn cước công dân, mật khẩu đăng nhập, địa
          chỉ khách hàng (thành viên). Đây là các thông tin mà website FilmGo
          cần thành viên cung cấp bắt buộc khi đăng ký sử dụng dịch vụ.
        </Text>
        <Text style={styles.policyParagraph}>
          Trong quá trình giao dịch thanh toán Website FilmGo, chúng tôi chỉ lưu
          giữ thông tin chi tiết về đơn hàng đã thanh toán của thành viên, các thông tin
          về số tài khoản ngân hàng của thành viên sẽ không được lưu giữ.
        </Text>
        <Text style={styles.policyParagraph}>
          Các thành viên sẽ tự chịu trách nhiệm về bảo mật và lưu giữ mọi hoạt động sử
          dụng dịch vụ dưới tên đăng ký, mật khẩu và hộp thư điện tử của mình. Ngoài ra,
          thành viên có trách nhiệm thông báo kịp thời cho Ban quản lý website về những
          hành vi sử dụng trái phép, lạm dụng, vi phạm bảo mật.
        </Text>
        <Text style={styles.policyStrong}>2. Phạm vi sử dụng thông tin</Text>
        <Text style={styles.policyParagraph}>
          Công ty sử dụng thông tin thành viên cung cấp để:
        </Text>
        <Text style={styles.policyParagraph}>
          - Gửi thông báo về các hoạt động trao đổi thông tin giữa thành viên và
          website FilmGo;
        </Text>
        <Text style={styles.policyParagraph}>
          - Ngăn ngừa các hoạt động phá hủy tài khoản người dùng của thành viên hoặc
          các hoạt động giả mạo thành viên;
        </Text>
        <Text style={styles.policyParagraph}>
          - Liên lạc và giải quyết với thành viên trong những trường hợp đặc biệt.
        </Text>
        <Text style={styles.policyParagraph}>
          - Không sử dụng thông tin cá nhân của thành viên ngoài mục đích xác nhận và
          liên lạc có liên quan đến giao dịch tại website FilmGo.
        </Text>
        <Text style={styles.policyStrong}>3. Thời gian lưu trữ thông tin</Text>
        <Text style={styles.policyParagraph}>
          Dữ liệu cá nhân của thành viên sẽ được lưu trữ cho đến khi có yêu cầu hủy bỏ
          hoặc tự thành viên đăng nhập và thực hiện hủy bỏ. Còn lại trong mọi trường hợp,
          dữ liệu cá nhân của thành viên sẽ được bảo mật trên máy chủ của website FilmGo.
        </Text>
        <Text style={styles.policyStrong}>4. Những người hoặc tổ chức có thể được tiếp cận với thông tin đó</Text>
        <Text style={styles.policyParagraph}>
          Website FilmGo có thể chia sẻ thông tin cá nhân của thành viên với các bên thứ ba trong các trường hợp sau:
        </Text>
        <Text style={styles.policyParagraph}>
          - Các đối tác kinh doanh của website FilmGo;
          - Các đơn vị cung cấp dịch vụ thanh toán;
          - Các cơ quan pháp luật khi có yêu cầu.
        </Text>
        <Text style={styles.policyStrong}>5. Phương tiện và công cụ để người dùng tiếp cận và chỉnh sửa dữ liệu cá nhân của mình</Text>
        <Text style={styles.policyParagraph}>
          Thành viên có quyền tự kiểm tra, cập nhật, điều chỉnh hoặc hủy bỏ thông tin cá nhân của mình bằng cách đăng nhập vào tài khoản và chỉnh sửa thông tin cá nhân hoặc yêu cầu FilmGo thực hiện việc này.
        </Text>
        <Text style={styles.policyStrong}>6. Cam kết bảo mật thông tin cá nhân khách hàng</Text>
        <Text style={styles.policyParagraph}>
          Thông tin cá nhân của thành viên trên website FilmGo được cam kết bảo mật tuyệt đối theo chính sách bảo vệ thông tin cá nhân của website FilmGo. Việc thu thập và sử dụng thông tin của thành viên chỉ được thực hiện khi có sự đồng ý của thành viên đó, trừ những trường hợp pháp luật có quy định khác.
        </Text>
      </ScrollView>
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity activeOpacity={0.75} style={styles.backButton} onPress={onBack}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  faqQuestionScreen: {
    flex: 1,
    backgroundColor: '#eeeeee',
  },
  header: {
    height: 64,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: BLUE,
  },
  backButton: {
    width: 58,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  content: {
    paddingTop: 18,
  },
  sectionLabel: {
    color: '#333333',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    paddingHorizontal: 20,
  },
  otherLabel: {
    marginTop: 28,
  },
  languageRow: {
    minHeight: 58,
    paddingLeft: 28,
    paddingRight: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e4',
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    flex: 1,
    color: '#66687d',
    fontSize: 17,
    lineHeight: 23,
  },
  checkMark: {
    color: '#2d9df2',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '500',
  },
  switchRow: {
    minHeight: 62,
    paddingLeft: 28,
    paddingRight: 22,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e4',
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkRow: {
    minHeight: 60,
    paddingLeft: 28,
    paddingRight: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4e4',
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
    color: '#66687d',
    fontSize: 17,
    lineHeight: 23,
  },
  chevron: {
    color: '#9e9e9e',
    fontSize: 26,
    lineHeight: 30,
  },
  faqCategoryRow: {
    minHeight: 66,
    paddingLeft: 18,
    paddingRight: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e1e1',
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqCategoryText: {
    flex: 1,
    color: '#333333',
    fontSize: 17,
    lineHeight: 24,
  },
  faqQuestionContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 20,
  },
  questionCard: {
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionText: {
    flex: 1,
    color: '#2d2d2d',
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '900',
  },
  downIcon: {
    color: '#3f87f5',
    fontSize: 22,
    lineHeight: 26,
    marginLeft: 10,
    fontWeight: '900',
  },
  downIconOpen: {
    transform: [{ rotate: '180deg' }],
  },
  answerText: {
    color: '#666666',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 12,
  },
  policyContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 34,
  },
  policyTitle: {
    color: '#555555',
    fontSize: 18,
    lineHeight: 27,
    marginBottom: 22,
  },
  policyStrong: {
    color: '#2d2d2d',
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '900',
    marginBottom: 14,
  },
  policyParagraph: {
    color: '#5a5a5a',
    fontSize: 16,
    lineHeight: 25,
    marginBottom: 16,
    textAlign: 'justify',
  },
});

export default SettingScreen;
