import React from "react";
import { TablePagination } from "@mui/material";

const Pagination = ({ count, rowsPerPage, page, onChangePage, onChangeRowsPerPage }) => (
  <TablePagination
    rowsPerPageOptions={[5, 10, 25]}
    component="div"
    count={count}
    rowsPerPage={rowsPerPage}
    page={page}
    onPageChange={(_, newPage) => onChangePage(newPage)}
    onRowsPerPageChange={(e) => onChangeRowsPerPage(parseInt(e.target.value, 10))}
  />
);

export default Pagination;
