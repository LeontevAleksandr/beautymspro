import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Checkbox,
  Typography
} from '@mui/material';

const QualificationsTable = ({
  availableQualifications,
  formData,
  isQualificationIncluded,
  getPriceForQualification,
  onQualificationPriceChange
}) => {
  return (
    <TableContainer
      component={Paper}
      sx={{
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        borderRadius: 2,
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        mb: 2
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
              Уровень квалификации
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: '#424242',
                borderBottom: '1px solid #e0e0e0',
                py: 1.5,
                width: '120px'
              }}
            >
              Включить
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: '#424242',
                borderBottom: '1px solid #e0e0e0',
                py: 1.5,
                width: '180px'
              }}
            >
              Цена
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(availableQualifications.length > 0 ? availableQualifications : []).map((qual) => {
            const isIncluded = isQualificationIncluded(formData.qualification_prices, qual.id);
            const price = getPriceForQualification(formData.qualification_prices, qual.id) || '';

            return (
              <TableRow
                key={qual.id}
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
                    {qual.name}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    py: 1.5,
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <Checkbox
                    checked={isIncluded}
                    onChange={(e) => {
                      if (e.target.checked && !isIncluded) {
                        onQualificationPriceChange(qual.id, formData.base_price || 0);
                      } else if (!e.target.checked && isIncluded) {
                        onQualificationPriceChange(qual.id, '');
                      }
                    }}
                    disabled={!formData.specialization_id}
                    size="small"
                    sx={{
                      color: '#bbbbbb',
                      '&.Mui-checked': {
                        color: '#1976d2',
                      }
                    }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    py: 1.5,
                    borderBottom: '1px solid #f0f0f0'
                  }}
                >
                  <TextField
                    type="number"
                    size="small"
                    value={price}
                    onChange={(e) => onQualificationPriceChange(qual.id, e.target.value)}
                    disabled={!isIncluded || !formData.specialization_id}
                    InputProps={{
                      inputProps: { min: 0, step: 50 },
                      sx: { borderRadius: 1.5 }
                    }}
                    sx={{ width: '150px' }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
          {availableQualifications.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} align="center" sx={{ py: 3, color: '#666' }}>
                {!formData.specialization_id
                  ? "Выберите специализацию, чтобы увидеть доступные квалификации"
                  : "Для выбранной специализации не найдено квалификаций"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default QualificationsTable;