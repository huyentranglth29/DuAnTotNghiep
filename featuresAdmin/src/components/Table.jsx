function Table({columns = [], data = [], emptyText = 'Không có dữ liệu'}) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key}>{column.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length || 1}>{emptyText}</td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={item.id || index}>
                {columns.map(column => (
                  <td key={column.key}>
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
