import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Stack
} from '@mui/material';
import { LocalOffer, Category, Timer } from '@mui/icons-material';
import ServiceTableRow from './ServiceTableRow';

const ServicesTable = ({ services, onEdit, onDelete, onOpenQualifications }) => {
  return (
    <TableContainer
      component={Paper}
      sx={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        borderRadius: 3,
        border: '1px solid #e0e0e0',
        overflow: 'hidden'
      }}
    >
      <Table size="small">
        <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: 600,
                color: '#424242',
                borderBottom: '1px solid #e0e0e0',
                py: 2,
                width: '25%'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <LocalOffer sx={{ fontSize: 18, color: '#666' }} />
                <span>Название</span>
              </Stack>
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: '#424242',
                borderBottom: '1px solid #e0e0e0',
                py: 2,
                width: '20%'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Category sx={{ fontSize: 18, color: '#666' }} />
                <span>Специализация</span>
              </Stack>
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: '#424242',
                borderBottom: '1px solid #e0e0e0',
                py: 2,
                width: '15%'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>Базовая цена</span>
              </Stack>
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: '#424242',
                borderBottom: '1px solid #e0e0e0',
                py: 2,
                width: '15%'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Timer sx={{ fontSize: 18, color: '#666' }} />
                <span>Длительность</span>
              </Stack>
            </TableCell>
            <TableCell
              align="center"
              sx={{
                fontWeight: 600,
                color: '#424242',
                borderBottom: '1px solid #e0e0e0',
                py: 2,
                width: '25%'
              }}
            >
              Действия
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {services.length > 0 ? (
            services.map((service, index) => (
              <ServiceTableRow
                key={service.id}
                service={service}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                onOpenQualifications={onOpenQualifications}
              />
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                align="center"
                sx={{
                  py: 6,
                  color: '#666'
                }}
              >
                <Typography variant="body2">
                  Нет данных
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ServicesTable;