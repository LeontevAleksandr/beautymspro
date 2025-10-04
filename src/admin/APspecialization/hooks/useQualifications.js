import { useState, useEffect } from 'react';
import * as api from '../services/api';
import { INITIAL_QUALIFICATION, CONFIRM_MESSAGES } from '../utils/constants';
import { isValidName, canMovePriority, getTargetIndex, handleError } from '../utils/helpers';

export const useQualifications = () => {
  const [qualifications, setQualifications] = useState([]);
  const [newQualification, setNewQualification] = useState(INITIAL_QUALIFICATION);
  const [editingQualification, setEditingQualification] = useState(null);

  useEffect(() => {
    loadQualifications();
  }, []);

  const loadQualifications = async () => {
    try {
      const data = await api.fetchQualifications();
      setQualifications(data);
    } catch (error) {
      handleError('получении квалификаций', error);
    }
  };

  const handleChange = (e) => {
    setNewQualification({
      ...newQualification,
      [e.target.name]: e.target.value
    });
  };

  const handleAdd = async () => {
    if (!isValidName(newQualification.name)) return;
    
    try {
      const success = await api.createQualification(newQualification);
      if (success) {
        setNewQualification(INITIAL_QUALIFICATION);
        loadQualifications();
        return true;
      }
    } catch (error) {
      handleError('добавлении квалификации', error);
    }
    return false;
  };

  const handleUpdate = async () => {
    if (!editingQualification || !isValidName(editingQualification.name)) return;
    
    try {
      const success = await api.updateQualification(editingQualification.id, {
        name: editingQualification.name,
        priority: editingQualification.priority
      });
      if (success) {
        setEditingQualification(null);
        loadQualifications();
        return true;
      }
    } catch (error) {
      handleError('обновлении квалификации', error);
    }
    return false;
  };

  const handleDelete = async (id) => {
    if (!window.confirm(CONFIRM_MESSAGES.DELETE_QUALIFICATION)) return;
    
    try {
      const success = await api.deleteQualification(id);
      if (success) {
        loadQualifications();
      }
    } catch (error) {
      handleError('удалении квалификации', error);
    }
  };

  const handleMovePriority = async (qualificationId, direction) => {
    const qualification = qualifications.find(q => q.id === qualificationId);
    if (!qualification) return;
    
    const currentIndex = qualifications.findIndex(q => q.id === qualificationId);
    
    if (!canMovePriority(currentIndex, direction, qualifications.length)) {
      return;
    }
    
    const targetIndex = getTargetIndex(currentIndex, direction);
    const targetQualification = qualifications[targetIndex];
    
    try {
      // Меняем приоритеты местами
      await api.updateQualification(qualification.id, {
        ...qualification,
        priority: targetQualification.priority
      });
      
      await api.updateQualification(targetQualification.id, {
        ...targetQualification,
        priority: qualification.priority
      });
      
      loadQualifications();
    } catch (error) {
      handleError('изменении приоритета', error);
    }
  };

  return {
    qualifications,
    newQualification,
    editingQualification,
    setEditingQualification,
    handleChange,
    handleAdd,
    handleUpdate,
    handleDelete,
    handleMovePriority
  };
};