const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

const Voucher = require('../models/Voucher');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

dotenv.config({path: path.resolve(__dirname, '../../.env')});

const vouchersData = [
  {
    code: 'FILMGO20',
    description: 'Giảm 20% tổng hóa đơn đặt vé (tối đa 50k) nhân dịp ra mắt phiên bản mới.',
    discountType: 'percent',
    discountValue: 20,
    minOrderValue: 80000,
    maxDiscount: 50000,
    quantity: 100,
    startDate: new Date(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 ngày sau
    status: 'active',
  },
  {
    code: 'GIAM50K',
    description: 'Giảm ngay 50.000đ cho đơn hàng đặt vé kèm bắp nước từ 200.000đ trở lên.',
    discountType: 'amount',
    discountValue: 50000,
    minOrderValue: 200000,
    maxDiscount: 50000,
    quantity: 50,
    startDate: new Date(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15), // 15 ngày sau
    status: 'active',
  },
  {
    code: 'BAPNUOC30K',
    description: 'Ưu đãi giảm giá 30.000đ khi đặt Combo bắp nước trực tuyến.',
    discountType: 'amount',
    discountValue: 30000,
    minOrderValue: 70000,
    maxDiscount: 30000,
    quantity: 120,
    startDate: new Date(),
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45), // 45 ngày sau
    status: 'active',
  },
];

const productsData = [
  {
    name: 'Combo Solo (1 Bắp + 1 Nước)',
    image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400',
    price: 75000,
    stock: 999,
    description: 'Gồm 1 bắp ngọt lớn thơm giòn tự chọn vị và 1 ly nước ngọt Coca-Cola/Sprite cỡ vừa mát lạnh.',
    isActive: true,
  },
  {
    name: 'Combo Couple (1 Bắp + 2 Nước)',
    image: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=400',
    price: 99000,
    stock: 999,
    description: 'Gồm 1 bắp lớn vị caramel/phô mai ngon mê ly và 2 ly nước ngọt lớn sảng khoái cho cặp đôi.',
    isActive: true,
  },
  {
    name: 'Combo Gia Đình (2 Bắp + 3 Nước)',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=400',
    price: 159000,
    stock: 500,
    description: 'Combo tiết kiệm cho cả nhà với 2 bắp lớn tự chọn vị và 3 ly nước ngọt giải khát thoải mái.',
    isActive: true,
  },
  {
    name: 'Bắp Phô Mai Thượng Hạng',
    image: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?q=80&w=400',
    price: 55000,
    stock: 2000,
    description: 'Bắp rang bơ phủ lớp bột phô mai nhập khẩu béo ngậy cực kỳ kích thích vị giác.',
    isActive: true,
  },
];

const notificationsData = [
  {
    title: 'Khai trương cụm rạp Cine Prestige thứ 10!',
    content: 'Đón chào cụm rạp sang trọng chuẩn 5 sao mới. Tuần lễ khai trương áp dụng mua 1 vé tặng 1 vé xem phim và tặng bắp rang bơ miễn phí cho 100 khách hàng đầu tiên mỗi ngày.',
    target: 'all',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600',
    sentAt: new Date(),
  },
  {
    title: 'Đồng giá vé 45k cho Học sinh - Sinh viên',
    content: 'Xem phim thỏa thích ngày thường không lo về giá! Áp dụng đồng giá vé 45.000đ cho mọi suất chiếu 2D từ Thứ 2 đến Thứ 6 hàng tuần khi xuất trình thẻ học sinh, sinh viên.',
    target: 'all',
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=600',
    sentAt: new Date(),
  },
  {
    title: 'Thành viên VIP - Nhận quà hết ý từ FilmGo',
    content: 'Chương trình tri ân thành viên VIP năm 2026. Nhận ngay 1 vé xem phim 2D miễn phí và 1 combo bắp nước ngọt ngào vào tháng sinh nhật của bạn cùng nhiều ưu đãi phòng chờ thương gia.',
    target: 'vip',
    image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600',
    sentAt: new Date(),
  },
];

async function seedAll() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  console.log('Connecting to MongoDB database...');
  await mongoose.connect(process.env.MONGO_URI);

  // 1. Seed Vouchers
  await Voucher.deleteMany({});
  await Voucher.insertMany(vouchersData);
  console.log(`✅ Seeded ${vouchersData.length} Vouchers successfully.`);

  // 2. Seed Products (Combos)
  await Product.deleteMany({});
  await Product.insertMany(productsData);
  console.log(`✅ Seeded ${productsData.length} Products (Combos) successfully.`);

  // 3. Seed Notifications (News)
  await Notification.deleteMany({});
  await Notification.insertMany(notificationsData);
  console.log(`✅ Seeded ${notificationsData.length} Notifications (News/Events) successfully.`);

  await mongoose.disconnect();
  console.log('Disconnecting database. Seed completed!');
}

seedAll().catch(async error => {
  console.error('❌ Seed error:', error);
  await mongoose.disconnect();
  process.exit(1);
});
