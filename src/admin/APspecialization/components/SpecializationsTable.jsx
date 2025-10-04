import React from 'react';
import {
  Paper, Typography, Stack, Box, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BadgeIcon from '@mui/icons-material/Badge';
import ViewListIcon from '@mui/icons-material/ViewList';

export const SpecializationsTable = ({
  specializations,
  newSpecialization,
  editingSpecialization,
  onSpecializationChange,
  onAdd,
  onUpdate,
  onDelete,
  onEdit,
  onCancelEdit,
  onOpenQualifications
}) => {
  return (
    <Paper sx={{ 
      p: 2, 
      mb: 3, 
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
          <BadgeIcon sx={{ fontSize: 20, color: '#666' }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 500,
              color: '#424242'
            }}
          >
            Специализации
          </Typography>
        </Stack>
      </Stack>
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Название специализации"
            name="name"
            value={newSpecialization.name}
            onChange={onSpecializationChange}
            fullWidth
            size="small"
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={onAdd}
            startIcon={<AddIcon />}
            sx={{ 
              minWidth: '160px',
              borderRadius: 2, 
              textTransform: 'none',
              backgroundColor: '#1976d2',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)'
            }}
          >
            Добавить
          </Button>
        </Box>
      </Box>
      
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
                  width: '50%'
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <BadgeIcon sx={{ fontSize: 18, color: '#666' }} />
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
            {specializations.map((spec) => (
              <TableRow key={spec.id} sx={{ 
                '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}>
                <TableCell sx={{ py: 1.5 }}>
                  {editingSpecialization && editingSpecialization.id === spec.id ? (
                    <TextField
                      value={editingSpecialization.name}
                      onChange={(e) => onEdit({
                        ...editingSpecialization,
                        name: e.target.value
                      })}
                      size="small"
                      fullWidth
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  ) : (
                    spec.name
                  )}
                </TableCell>
                <TableCell sx={{ py: 1.5 }}>
                  {editingSpecialization && editingSpecialization.id === spec.id ? (
                    <Stack direction="row" spacing={1}>
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="primary" 
                        onClick={onUpdate}
                        sx={{ 
                          borderRadius: 2, 
                          textTransform: 'none',
                          boxShadow: 'none'
                        }}
                      >
                        Сохранить
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={onCancelEdit}
                        sx={{ 
                          borderRadius: 2, 
                          textTransform: 'none'
                        }}
                      >
                        Отмена
                      </Button>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => onEdit(spec)}
                        startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                        sx={{ 
                          borderRadius: 2, 
                          textTransform: 'none',
                          borderColor: '#1976d2',
                          color: '#1976d2'
                        }}
                      >
                        Изменить
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="secondary"
                        onClick={() => onOpenQualifications(spec)}
                        startIcon={<ViewListIcon sx={{ fontSize: 16 }} />}
                        sx={{ 
                          borderRadius: 2, 
                          textTransform: 'none',
                          borderColor: '#673ab7',
                          color: '#673ab7'
                        }}
                      >
                        Квалификации
                      </Button>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="error" 
                        onClick={() => onDelete(spec.id)}
                        startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                        sx={{ 
                          borderRadius: 2, 
                          textTransform: 'none'
                        }}
                      >
                        Удалить
                      </Button>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};