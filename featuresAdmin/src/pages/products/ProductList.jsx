import productApi from '../../api/productApi';
import AdminListPage from '../../components/AdminListPage';
import {formatVnd} from '../../utils/adminFormatters';

function ProductList() {
  return (
    <AdminListPage
      title="Quản lý sản phẩm"
      api={productApi}
      searchPlaceholder="Tìm kiếm sản phẩm..."
      fields={[
        {name: 'name', label: 'Tên sản phẩm', required: true},
        {name: 'image', label: 'Ảnh URL'},
        {name: 'price', label: 'Giá', type: 'number', required: true},
        {name: 'stock', label: 'Tồn kho', type: 'number'},
        {name: 'description', label: 'Mô tả', type: 'textarea'},
        {
          name: 'isActive',
          label: 'Trạng thái',
          type: 'select',
          defaultValue: 'true',
          options: [
            {value: 'true', label: 'Hoạt động'},
            {value: 'false', label: 'Tạm tắt'},
          ],
        },
      ]}
      normalizeSubmit={payload => ({
        ...payload,
        isActive: payload.isActive === true || payload.isActive === 'true',
      })}
      columns={[
        {key: 'name', title: 'Sản phẩm'},
        {key: 'price', title: 'Giá', render: item => formatVnd(item.price)},
        {key: 'stock', title: 'Tồn kho'},
        {key: 'isActive', title: 'Trạng thái', render: item => item.isActive ? 'Hoạt động' : 'Tạm tắt'},
      ]}
    />
  );
}

export default ProductList;
