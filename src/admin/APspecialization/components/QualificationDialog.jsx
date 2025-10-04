import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box
} from '@mui/material';

export const QualificationDialog = ({
  open,
  isEditing,
  qualification,
  onClose,
  onChange,
  onSubmit
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        {isEditing ? 'Редактирование квалификации' : 'Добавление новой квалификации'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1, width: '400px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Название квалификации"
            name="name"
            value={qualification.name}
            onChange={onChange}
            fullWidth
          />
          <TextField
            label="Приоритет"
            name="priority"
            type="number"
            value={qualification.priority}
            onChange={onChange}
            fullWidth
            InputProps={{ inputProps: { min: 1 } }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onSubmit}
        >
          {isEditing ? 'Сохранить' : 'Добавить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};