import React from 'react';
import {
  Paper, Typography, Stack, Button, IconButton, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SchoolIcon from '@mui/icons-material/School';

export const QualificationsTable = ({
  qualifications,
  onOpenDialog,
  onMovePriority,
  onEdit,
  onDelete
}) => {
  return (
    <Paper sx={{ 
      p: 2, 
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)', 
      borderRadius: 3,
      border: '1px solid #e0e0e0' 
    }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <SchoolIcon sx={{ fontSize: 20, color: '#666' }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 500,
              color: '#424242'
            }}
          >
            Уровни квалификации
          </Typography>
        </Stack>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={onOpenDialog}
          sx={{ 
            minWidth: '220px',
            borderRadius: 2, 
            textTransform: 'none',
            backgroundColor: '#1976d2',
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)'
          }}
        >
          Добавить квалификацию
        </Button>
      </Stack>

      <TableContainer sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
            <TableRow>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  color: '#424242',
                  borderBottom: '1px solid #e0e0e0',
                  py: 2,
                  width: '15%'
                }}
              >
                Приоритет
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  color: '#424242',
                  borderBottom: '1px solid #e0e0e0',
                  py: 2,
                  width: '35%'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <SchoolIcon sx={{ fontSize: 18, color: '#666' }} />
                  <span>Название</span>
                </Stack>
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 600, 
                  color: '#424242',
                  borderBottom: '1px solid #e0e0e0',
                  py: 2,
                  width: '50%'
                }}
              >
                Действия
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {qualifications.map((qual, index) => (
              <TableRow key={qual.id}>
                <TableCell>{qual.priority}</TableCell>
                <TableCell>{qual.name}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      disabled={index === 0}
                      onClick={() => onMovePriority(qual.id, 'up')}
                    >
                      <ArrowUpwardIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      disabled={index === qualifications.length - 1}
                      onClick={() => onMovePriority(qual.id, 'down')}
                    >
                      <ArrowDownwardIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => onEdit(qual)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => onDelete(qual.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};