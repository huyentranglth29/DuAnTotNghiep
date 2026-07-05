import {DataTable, PageTitle} from '../../components/AdminMock';

function ProductList() {
  return (
    <section>
      <PageTitle title="Quản lý sản phẩm" />
      <DataTable
        headers={['Sản phẩm', 'Giá', 'Tồn kho', 'Trạng thái']}
        rows={[
          ['🍿 Combo 1', '120.000 đ', '52', 'Hoạt động'],
          ['🍿 Combo 2', '150.000 đ', '32', 'Hoạt động'],
          ['🍟 Bắp lớn', '70.000 đ', '100', 'Hoạt động'],
          ['🥤 Nước ngọt', '40.000 đ', '200', 'Hoạt động'],
        ]}
      />
    </section>
  );
}

export default ProductList;
