const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const Movie = require('../models/Movie');

dotenv.config({path: path.resolve(__dirname, '../../.env')});

const moviesData = [
  // --- ĐANG CHIẾU (now-showing) ---
  {
    title: 'Ám Ảnh',
    synopsis: 'Câu chuyện rùng rợn xoay quanh một ngôi nhà cổ bị ám bởi những linh hồn u uất, nơi một gia đình trẻ vô tình giải thoát cho thế lực tà ác ẩn giấu hàng thế kỷ.',
    description: 'Câu chuyện rùng rợn xoay quanh một ngôi nhà cổ bị ám bởi những linh hồn u uất.',
    duration: '109 phút',
    genre: 'Kinh dị / Bí ẩn',
    director: 'Nguyễn Minh Vy',
    cast: [
      { id: 1, name: 'Hồng Ánh', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120' },
      { id: 2, name: 'Quang Tuấn', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800',
    status: 'now-showing',
    ageRating: 'T18',
    isHot: true,
    rating: 8.5,
    price: 85000
  },
  {
    title: 'Bầy Xác Sống',
    synopsis: 'Thảm họa kép ập xuống thành phố khi một loại virus đột biến biến người dân thành xác sống khát máu. Một nhóm người sống sót phải tìm đường thoát thân trước khi quân đội phong tỏa khu vực.',
    description: 'Thảm họa zombie kinh hoàng càn quét thành phố.',
    duration: '122 phút',
    genre: 'Kinh dị / Hành động',
    director: 'Trần Hữu Tấn',
    cast: [
      { id: 3, name: 'Huỳnh Lập', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120' },
      { id: 4, name: 'Khả Như', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800',
    status: 'now-showing',
    ageRating: 'T16',
    isHot: true,
    rating: 8.0,
    price: 85000
  },
  {
    title: 'Lầu Chủ Hòa',
    synopsis: 'Một bộ phim tâm lý xã hội sâu sắc lấy bối cảnh khu chung cư cũ lộn xộn, nơi những con người từ nhiều tầng lớp cố gắng tìm kiếm sự hòa thuận và tình người giữa bộn bề lo toan.',
    description: 'Bức tranh sống động về tình làng nghĩa xóm chốn đô thị.',
    duration: '94 phút',
    genre: 'Tình cảm / Tâm lý',
    director: 'Vũ Ngọc Đãng',
    cast: [
      { id: 5, name: 'Thái Hòa', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120' },
      { id: 6, name: 'Thu Trang', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=800',
    status: 'now-showing',
    ageRating: 'T18',
    isHot: true,
    rating: 7.8,
    price: 80000
  },
  {
    title: 'Backrooms',
    synopsis: 'Lấy cảm hứng từ truyền thuyết đô thị nổi tiếng Internet, bộ phim đưa người xem vào một không gian vô tận đầy ám ảnh của những căn phòng màu vàng, nơi có những sinh vật dị dạng đang săn lùng kẻ lạc lối.',
    description: 'Hành trình sinh tồn nghẹt thở trong không gian vô tận màu vàng.',
    duration: '93 phút',
    genre: 'Kinh dị / Giật gân',
    director: 'Kane Pixels',
    cast: [
      { id: 7, name: 'Thomas Cole', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800',
    status: 'now-showing',
    ageRating: 'T16',
    isHot: true,
    rating: 7.5,
    price: 85000
  },
  {
    title: 'Doraemon',
    synopsis: 'Doraemon và nhóm bạn Nobita tham gia vào một cuộc phiêu lưu kỳ thú đến hòn đảo kho báu trên bầu trời, đối đầu với những tên cướp biển vũ trụ để bảo vệ hòa bình thế giới.',
    description: 'Nobita và Doraemon thám hiểm hòn đảo kỳ bí trên bầu trời.',
    duration: '105 phút',
    genre: 'Hoạt hình / Gia đình',
    director: 'Kazuaki Imai',
    cast: [
      { id: 8, name: 'Doraemon', avatarUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=120' },
      { id: 9, name: 'Nobita', avatarUrl: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800',
    status: 'now-showing',
    ageRating: 'P',
    isHot: false,
    rating: 9.2,
    price: 75000
  },
  {
    title: 'Thám Tử Lừng Danh',
    synopsis: 'Conan đối đầu với Tổ chức Áo đen trong một vụ án bắt cóc xuyên quốc gia liên quan đến hệ thống nhận diện khuôn mặt toàn cầu bằng trí tuệ nhân tạo.',
    description: 'Cuộc chiến nghẹt thở giữa Conan và Tổ chức Áo đen.',
    duration: '111 phút',
    genre: 'Trinh thám / Hoạt hình',
    director: 'Yuzuru Tachikawa',
    cast: [
      { id: 10, name: 'Edogawa Conan', avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800',
    status: 'now-showing',
    ageRating: 'T18',
    isHot: false,
    rating: 8.7,
    price: 80000
  },

  // --- SẮP CHIẾU (coming-soon) ---
  {
    title: 'Minions & Quái Vật',
    synopsis: 'Đội quân Minions vàng ươm tinh nghịch vô tình giải thoát một quái vật cổ đại dễ thương. Cả nhóm phải tìm cách đưa quái vật trở về nhà trước khi rắc rối lớn xảy ra.',
    description: 'Cuộc phiêu lưu quậy phá siêu hài hước của đội quân Minions.',
    duration: '95 phút',
    genre: 'Hài hước / Hoạt hình',
    director: 'Kyle Balda',
    cast: [
      { id: 11, name: 'Kevin', avatarUrl: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800',
    status: 'coming-soon',
    ageRating: 'P',
    isHot: true,
    rating: 0,
    price: 75000,
    releaseDate: '01-07-2026'
  },
  {
    title: 'Đèn La Sát',
    synopsis: 'Truyền thuyết kinh hoàng về chiếc đèn dầu cổ có khả năng triệu hồi quỷ dữ từ cõi âm. Những ai thắp sáng chiếc đèn này đều phải trả giá bằng sinh mạng.',
    description: 'Truyền thuyết chiếc đèn quỷ ám hại người.',
    duration: '115 phút',
    genre: 'Kinh dị',
    director: 'Lâm Bửu Lộc',
    cast: [
      { id: 12, name: 'Lê Giang', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1505635330303-319530796a4b?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800',
    status: 'coming-soon',
    ageRating: 'T18',
    isHot: false,
    rating: 0,
    price: 80000,
    releaseDate: '03-07-2026'
  },
  {
    title: 'Đồng Dao Ma Quái',
    synopsis: 'Một nhóm bạn trẻ vô tình hát lại bài đồng dao cổ bị nguyền rủa tại một ngôi làng bỏ hoang, kích hoạt chuỗi sự kiện mất tích đầy bí ẩn.',
    description: 'Lời nguyền chết chóc từ bài đồng dao cổ.',
    duration: '100 phút',
    genre: 'Kinh dị / Giật gân',
    director: 'Lý Hải',
    cast: [
      { id: 13, name: 'Quốc Cường', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1519074069444-1ba4e6664104?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=800',
    status: 'coming-soon',
    ageRating: 'T18',
    isHot: false,
    rating: 0,
    price: 80000,
    releaseDate: '03-07-2026'
  },
  {
    title: 'Bóng Quỷ',
    synopsis: 'Người mẹ trẻ phải đối mặt với nỗi sợ hãi tột cùng khi phát hiện ra bóng đen kỳ lạ xuất hiện trong phòng của con mình mỗi đêm không phải là ảo ảnh.',
    description: 'Thế lực hắc ám ẩn mình trong bóng tối căn phòng.',
    duration: '102 phút',
    genre: 'Kinh dị / Tâm lý',
    director: 'Victor Vũ',
    cast: [
      { id: 14, name: 'Midu', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=800',
    status: 'coming-soon',
    ageRating: 'T18',
    isHot: false,
    rating: 0,
    price: 80000,
    releaseDate: '03-07-2026'
  },
  {
    title: 'Sheep In The Box',
    synopsis: 'Bộ phim hoạt hình viễn tưởng kể về cuộc phiêu lưu của chú cừu bông thông minh robot bị lạc vào một chiếc hộp không gian đa chiều kỳ ảo.',
    description: 'Hành trình vượt không gian đa chiều của chú cừu bông robot.',
    duration: '90 phút',
    genre: 'Hoạt hình / Viễn tưởng',
    director: 'Andrew Stanton',
    cast: [
      { id: 15, name: 'Cừu Bông', avatarUrl: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800',
    status: 'coming-soon',
    ageRating: 'T13',
    isHot: false,
    rating: 0,
    price: 75000,
    releaseDate: '03-07-2026'
  },
  {
    title: 'Moana',
    synopsis: 'Moana tiếp tục giong buồm ra khơi vượt đại dương bao la để kết nối lại các bộ lạc xa xôi dưới sự dẫn dắt của á thần Maui tinh nghịch.',
    description: 'Chuyến hải trình mới kết nối các đại dương của Moana và Maui.',
    duration: '113 phút',
    genre: 'Phiêu lưu / Nhạc kịch',
    director: 'Ron Clements',
    cast: [
      { id: 16, name: 'Moana', avatarUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=120' },
      { id: 17, name: 'Maui', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800',
    status: 'coming-soon',
    ageRating: 'K',
    isHot: false,
    rating: 0,
    price: 75000,
    releaseDate: '03-07-2026'
  },

  // --- SUẤT CHIẾU SỚM / NỔI BẬT (featured) ---
  {
    title: 'Ma Nữ Oán Tình',
    synopsis: 'Mối lương duyên trái ngang và oán hận kéo dài trăm năm của một ma nữ xinh đẹp chốn cổ tự, tìm kiếm công lý và sự giải thoát.',
    description: 'Truyền thuyết tình duyên oán hận trăm năm chốn cổ tự.',
    duration: '105 phút',
    genre: 'Kinh dị / Cổ trang',
    director: 'Hàm Trần',
    cast: [
      { id: 18, name: 'Jun Vũ', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800',
    status: 'featured',
    ageRating: 'T18',
    isHot: true,
    rating: 8.9,
    price: 90000
  },
  {
    title: 'Quỷ Bất Hồn',
    synopsis: 'Một căn biệt thự cô lập giữa rừng sâu bỗng trở thành hiện trường của hàng loạt hiện tượng siêu nhiên kỳ bí thách thức khoa học.',
    description: 'Những vụ án siêu nhiên kỳ bí tại biệt thự trong rừng.',
    duration: '103 phút',
    genre: 'Kinh dị / Giật gân',
    director: 'Nguyễn Quang Dũng',
    cast: [
      { id: 19, name: 'Thanh Hằng', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120' }
    ],
    posterUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=400',
    backdropUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=800',
    status: 'featured',
    ageRating: 'T16',
    isHot: true,
    rating: 8.3,
    price: 90000
  }
];

async function seedMovies() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing in backend/.env');
  }

  console.log('Connecting to MongoDB database to seed movies...');
  await mongoose.connect(process.env.MONGO_URI);

  // Xóa phim cũ và nạp phim mới đồng bộ
  await Movie.deleteMany({});
  await Movie.insertMany(moviesData);

  console.log(`✅ Seeded ${moviesData.length} movies matching Showtime data successfully.`);
  await mongoose.disconnect();
}

seedMovies().catch(async error => {
  console.error('❌ Seed movies error:', error);
  await mongoose.disconnect();
  process.exit(1);
});
