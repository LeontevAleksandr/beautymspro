import React from 'react';
import { TableRow, TableCell, Typography, Box, Stack, Button } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const ServiceTableRow = ({ service, index, onEdit, onDelete, onOpenQualifications }) => {
  return (
    <TableRow
      hover
      sx={{
        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
        borderLeft: '4px solid transparent',
        '&:hover': {
          backgroundColor: '#f5f7fa',
          borderLeft: '4px solid #e3f2fd'
        }
      }}
    >
      <TableCell
        sx={{
          py: 2,
          borderBottom: '1px solid #f0f0f0',
          pl: 3
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontWeight: 500,
            color: '#1a1a1a'
          }}
        >
          {service.name}
        </Typography>
      </TableCell>
      <TableCell
        sx={{
          py: 2,
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: '#424242'
          }}
        >
          {service.specialization ? service.specialization.name : 'Не указана'}
        </Typography>
      </TableCell>
      <TableCell
        sx={{
          py: 2,
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            borderRadius: '8px',
            px: 1.5,
            py: 0.5,
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          {service.base_price} ₽
        </Box>
      </TableCell>
      <TableCell
        sx={{
          py: 2,
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <Typography
          variant="body2"
          sx={{ color: '#424242' }}
        >
          {service.duration} мин
        </Typography>
      </TableCell>
      <TableCell
        align="center"
        sx={{
          py: 2,
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <Stack direction="row" spacing={1} justifyContent="center">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => onEdit(service)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              borderColor: '#e0e0e0',
              color: '#1976d2',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                borderColor: '#1976d2'
              }
            }}
          >
            Изменить
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onOpenQualifications(service)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              borderColor: '#e0e0e0',
              color: '#9c27b0',
              '&:hover': {
                backgroundColor: 'rgba(156, 39, 176, 0.08)',
                borderColor: '#9c27b0'
              }
            }}
          >
            Квалификации
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Delete />}
            onClick={() => onDelete(service.id)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              borderColor: '#e0e0e0',
              color: '#d32f2f',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.08)',
                borderColor: '#d32f2f'
              }
            }}
          >
            Удалить
          </Button>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

export default ServiceTableRow;