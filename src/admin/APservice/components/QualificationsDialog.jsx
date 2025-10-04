import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box
} from '@mui/material';

const QualificationsDialog = ({
  open,
  selectedService,
  serviceQualifications,
  qualifications,
  onClose
}) => {
  const getQualificationName = (id) => {
    const qual = qualifications.find(q => q.id === id);
    return qual ? qual.name : `Квалификация ${id}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: '1px solid #e0e0e0',
          pb: 2,
          fontWeight: 500
        }}
      >
        Квалификации для услуги: {selectedService?.name}
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <TableContainer
          sx={{
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            borderRadius: 2,
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
                    py: 1.5
                  }}
                >
                  Квалификация
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#424242',
                    borderBottom: '1px solid #e0e0e0',
                    py: 1.5
                  }}
                >
                  Цена
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: '#424242',
                    borderBottom: '1px solid #e0e0e0',
                    py: 1.5
                  }}
                >
                  Разрешена
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {serviceQualifications.map((sq) => (
                <TableRow
                  key={sq.qualification_id}
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: '#f5f7fa'
                    }
                  }}
                >
                  <TableCell
                    sx={{
                      py: 1.5,
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {getQualificationName(sq.qualification_id)}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1.5,
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
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}
                    >
                      {sq.price_modified} ₽
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      py: 1.5,
                      borderBottom: '1px solid #f0f0f0'
                    }}
                  >
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        backgroundColor: sq.is_allowed ? '#e3f2fd' : '#ffebee',
                        color: sq.is_allowed ? '#1976d2' : '#d32f2f',
                        borderRadius: '8px',
                        px: 1.5,
                        py: 0.5,
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}
                    >
                      {sq.is_allowed ? 'Да' : 'Нет'}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {serviceQualifications.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    align="center"
                    sx={{
                      py: 3,
                      color: '#666'
                    }}
                  >
                    <Typography variant="body2">
                      Нет доступных квалификаций для этой услуги
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: '1px solid #e0e0e0',
          p: 2.5
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            borderRadius: 2,
            px: 3
          }}
        >
          Закрыть
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QualificationsDialog;