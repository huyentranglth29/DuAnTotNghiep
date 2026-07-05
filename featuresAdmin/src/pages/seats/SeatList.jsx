import Table from '../../components/Table';

function SeatList() {
  return (
    <section>
      <h2>Ghế</h2>
      <Table columns={[{key: 'code', title: 'Mã ghế'}]} data={[]} />
    </section>
  );
}

export default SeatList;
