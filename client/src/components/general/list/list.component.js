import React, { useState, useMemo } from "react";
import TableWithFilters from "../table/table.component";

const List = ({
  data = [],
  setData,
  columns = [],
  filtersConfig = [],
  actions = [],
  idField = "id",
  enableSearch = false,
  enableTotals = false,
  totalFields = [],
  fileName = "data_list",
}) => {
  const [selected, setSelected] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Save handler (example: updating backend)
  const handleSave = (updatedData) => {
    setData(updatedData);
    setHasChanges(false);
    alert("Data saved successfully!");
  };

  return (
    <TableWithFilters
      data={data}
      setData={setData}
      columns={columns}
      filtersConfig={filtersConfig}
      actions={actions}
      idField={idField}
      enableSearch={enableSearch}
      enableTotals={enableTotals}
      totalFields={totalFields}
      fileName={fileName}
      selected={selected}
      setSelected={setSelected}
      hasChanges={hasChanges}
      setHasChanges={setHasChanges}
      onSave={handleSave}
    />
  );
};

export default List;
