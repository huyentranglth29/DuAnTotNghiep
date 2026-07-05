import Table from '../../components/Table';

function CinemaList() {
  return (
    <section>
      <h2>Rạp chiếu</h2>
      <Table columns={[{key: 'name', title: 'Tên rạp'}]} data={[]} />
    </section>
  );
}

export default CinemaList;
