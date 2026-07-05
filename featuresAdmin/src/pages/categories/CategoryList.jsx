import Table from '../../components/Table';

function CategoryList() {
  return (
    <section>
      <h2>Thể loại</h2>
      <Table columns={[{key: 'name', title: 'Tên thể loại'}]} data={[]} />
    </section>
  );
}

export default CategoryList;
