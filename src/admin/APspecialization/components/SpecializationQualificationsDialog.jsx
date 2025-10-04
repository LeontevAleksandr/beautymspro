import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, List, ListItem, ListItemText, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export const SpecializationQualificationsDialog = ({
  open,
  specialization,
  allQualifications,
  selectedQualifications,
  onClose,
  onAdd,
  onRemove
}) => {
  const availableQualifications = allQualifications.filter(
    qual => !selectedQualifications.some(sq => sq.id === qual.id)
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        {specialization ? `Квалификации для специализации: ${specialization.name}` : 'Квалификации специализации'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, height: '400px' }}>
          {/* Список доступных квалификаций */}
          <Box sx={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', overflow: 'auto' }}>
            <Typography variant="subtitle1" sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
              Доступные квалификации
            </Typography>
            <List>
              {availableQualifications.length === 0 ? (
                <ListItem>
                  <ListItemText primary="Нет доступных квалификаций" />
                </ListItem>
              ) : (
                availableQualifications.map(qual => (
                  <ListItem 
                    key={qual.id}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => onAdd(qual.id)}
                      >
                        <AddIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText 
                      primary={qual.name} 
                      secondary={`Приоритет: ${qual.priority}`} 
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Box>
          
          {/* Список выбранных квалификаций */}
          <Box sx={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', overflow: 'auto' }}>
            <Typography variant="subtitle1" sx={{ p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
              Выбранные квалификации
            </Typography>
            <List>
              {selectedQualifications.length === 0 ? (
                <ListItem>
                  <ListItemText primary="Нет выбранных квалификаций" />
                </ListItem>
              ) : (
                selectedQualifications.map(qual => (
                  <ListItem 
                    key={qual.id}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        color="error"
                        onClick={() => onRemove(qual.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText 
                      primary={qual.name} 
                      secondary={`Приоритет: ${qual.priority}`} 
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};