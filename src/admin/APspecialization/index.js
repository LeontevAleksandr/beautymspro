import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useSpecializations } from './hooks/useSpecializations';
import { useQualifications } from './hooks/useQualifications';
import { useSpecializationQualifications } from './hooks/useSpecializationQualifications';
import { Header } from './components/Header';
import { SpecializationsTable } from './components/SpecializationsTable';
import { QualificationsTable } from './components/QualificationsTable';
import { QualificationDialog } from './components/QualificationDialog';
import { SpecializationQualificationsDialog } from './components/SpecializationQualificationsDialog';
import { INITIAL_QUALIFICATION } from './utils/constants';
import './APspecialization.css';

function APspecialization() {
  // Hooks для управления данными
  const specializationsData = useSpecializations();
  const qualificationsData = useQualifications();
  const specQualData = useSpecializationQualifications();

  // Локальное состояние для диалога квалификаций
  const [openQualificationDialog, setOpenQualificationDialog] = useState(false);

  // Обработчики для диалога квалификаций
  const handleOpenQualificationDialog = () => {
    qualificationsData.setEditingQualification(null);
    setOpenQualificationDialog(true);
  };

  const handleCloseQualificationDialog = () => {
    setOpenQualificationDialog(false);
    qualificationsData.setEditingQualification(null);
  };

  const handleEditQualification = (qualification) => {
    qualificationsData.setEditingQualification(qualification);
    setOpenQualificationDialog(true);
  };

  const handleQualificationChange = (e) => {
    const { name, value } = e.target;
    if (qualificationsData.editingQualification) {
      qualificationsData.setEditingQualification({
        ...qualificationsData.editingQualification,
        [name]: name === 'priority' ? parseInt(value) : value
      });
    } else {
      qualificationsData.handleChange(e);
    }
  };

  const handleQualificationSubmit = async () => {
    let success;
    if (qualificationsData.editingQualification) {
      success = await qualificationsData.handleUpdate();
    } else {
      success = await qualificationsData.handleAdd();
    }
    if (success) {
      handleCloseQualificationDialog();
    }
  };

  const currentQualification = qualificationsData.editingQualification || 
    qualificationsData.newQualification || 
    INITIAL_QUALIFICATION;

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      {/* Заголовок */}
      <Header 
        specializationsCount={specializationsData.specializations.length}
        qualificationsCount={qualificationsData.qualifications.length}
      />
      
      {/* Таблица специализаций */}
      <SpecializationsTable
        specializations={specializationsData.specializations}
        newSpecialization={specializationsData.newSpecialization}
        editingSpecialization={specializationsData.editingSpecialization}
        onSpecializationChange={specializationsData.handleChange}
        onAdd={specializationsData.handleAdd}
        onUpdate={specializationsData.handleUpdate}
        onDelete={specializationsData.handleDelete}
        onEdit={specializationsData.setEditingSpecialization}
        onCancelEdit={() => specializationsData.setEditingSpecialization(null)}
        onOpenQualifications={specQualData.handleOpen}
      />
      
      {/* Таблица квалификаций */}
      <QualificationsTable
        qualifications={qualificationsData.qualifications}
        onOpenDialog={handleOpenQualificationDialog}
        onMovePriority={qualificationsData.handleMovePriority}
        onEdit={handleEditQualification}
        onDelete={qualificationsData.handleDelete}
      />
      
      {/* Диалог добавления/редактирования квалификации */}
      <QualificationDialog
        open={openQualificationDialog}
        isEditing={!!qualificationsData.editingQualification}
        qualification={currentQualification}
        onClose={handleCloseQualificationDialog}
        onChange={handleQualificationChange}
        onSubmit={handleQualificationSubmit}
      />
      
      {/* Диалог управления квалификациями специализации */}
      <SpecializationQualificationsDialog
        open={specQualData.openDialog}
        specialization={specQualData.selectedSpecialization}
        allQualifications={qualificationsData.qualifications}
        selectedQualifications={specQualData.specializationQualifications}
        onClose={specQualData.handleClose}
        onAdd={specQualData.handleAdd}
        onRemove={specQualData.handleRemove}
      />
    </Box>
  );
}

export default APspecialization;