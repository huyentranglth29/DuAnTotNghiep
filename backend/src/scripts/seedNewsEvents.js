require("dotenv").config();
const connectDB = require("../config/db");
const NewsEvent = require("../models/NewsEvent");

const rows = [
  {
    title: "Khai trương cụm rạp FilmGo Hà Trung",
    summary: "Không gian điện ảnh hiện đại cùng nhiều quà tặng trong tuần lễ khai trương.",
    content: "FilmGo Hà Trung chào đón khán giả với hệ thống phòng chiếu hiện đại, âm thanh sống động và nhiều chương trình quà tặng hấp dẫn.",
    image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200",
    category: "su_kien", status: "da_dang", isFeatured: true,
  },
  {
    title: "Đồng giá vé dành cho học sinh, sinh viên",
    summary: "Tận hưởng phim hay với mức giá ưu đãi vào các ngày trong tuần.",
    content: "Chương trình áp dụng cho học sinh, sinh viên xuất trình thẻ hợp lệ tại FilmGo Hà Trung.",
    image: "https://images.unsplash.com/photo-1489185078527-9f04b7aa0fba?w=1200",
    category: "khuyen_mai", status: "da_dang",
  },
  {
    title: "Trải nghiệm điện ảnh trọn vẹn tại FilmGo",
    summary: "Những lưu ý giúp bạn có một buổi xem phim thoải mái và đáng nhớ.",
    content: "Vui lòng đến trước giờ chiếu 15 phút, kiểm tra thông tin vé và nhận combo tại quầy trước khi vào phòng chiếu.",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200",
    category: "tin_tuc", status: "da_dang",
  },
];

connectDB().then(async () => {
  for (const row of rows) {
    await NewsEvent.updateOne({title: row.title}, {$setOnInsert: row}, {upsert: true});
  }
  console.log(`Đã chuẩn bị ${rows.length} bài Tin tức & Sự kiện.`);
  process.exit(0);
}).catch(error => {
  console.error(error);
  process.exit(1);
});
