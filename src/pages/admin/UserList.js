// /pages/admin/UserList.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../AxiosInstance';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TablePagination, Button, Typography
} from '@mui/material';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage]);

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get(`/admin/users?page=${page + 1}&limit=${rowsPerPage}`);
      console.log(response);
      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUserClick = (userId) => {
    navigate(`/dashboard/admin/users/${userId}/activity`);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', padding: 2 }}>
      <Typography variant="h4" gutterBottom>User List</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.contact}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    onClick={() => handleUserClick(user.id)}
                  >
                    View Activity
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default UserList;
