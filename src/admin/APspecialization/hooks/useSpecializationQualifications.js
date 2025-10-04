import { useState } from 'react';
import * as api from '../services/api';
import { handleError } from '../utils/helpers';

export const useSpecializationQualifications = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState(null);
  const [specializationQualifications, setSpecializationQualifications] = useState([]);

  const loadSpecializationQualifications = async (specializationId) => {
    try {
      const data = await api.fetchSpecializationQualifications(specializationId);
      setSpecializationQualifications(data);
    } catch (error) {
      handleError('получении квалификаций специализации', error);
    }
  };

  const handleOpen = (specialization) => {
    setSelectedSpecialization(specialization);
    loadSpecializationQualifications(specialization.id);
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setSelectedSpecialization(null);
    setSpecializationQualifications([]);
  };

  const handleAdd = async (qualificationId) => {
    if (!selectedSpecialization) return;
    
    try {
      const success = await api.addQualificationToSpecialization(
        selectedSpecialization.id,
        qualificationId
      );
      if (success) {
        loadSpecializationQualifications(selectedSpecialization.id);
      }
    } catch (error) {
      handleError('добавлении квалификации к специализации', error);
    }
  };

  const handleRemove = async (qualificationId) => {
    if (!selectedSpecialization) return;
    
    try {
      const response = await fetch(
        `http://localhost:5000/api/specialization_qualifications/${selectedSpecialization.id}/${qualificationId}`,
        { method: 'DELETE' }
      );
      
      if (response.ok) {
        loadSpecializationQualifications(selectedSpecialization.id);
      }
    } catch (error) {
      handleError('удалении квалификации из специализации', error);
    }
  };

  return {
    openDialog,
    selectedSpecialization,
    specializationQualifications,
    handleOpen,
    handleClose,
    handleAdd,
    handleRemove
  };
};