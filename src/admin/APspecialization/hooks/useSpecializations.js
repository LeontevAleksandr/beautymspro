import { useState, useEffect } from 'react';
import * as api from '../services/api';
import { INITIAL_SPECIALIZATION, CONFIRM_MESSAGES } from '../utils/constants';
import { isValidName, handleError } from '../utils/helpers';

export const useSpecializations = () => {
  const [specializations, setSpecializations] = useState([]);
  const [newSpecialization, setNewSpecialization] = useState(INITIAL_SPECIALIZATION);
  const [editingSpecialization, setEditingSpecialization] = useState(null);

  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    try {
      const data = await api.fetchSpecializations();
      setSpecializations(data);
    } catch (error) {
      handleError('получении специализаций', error);
    }
  };

  const handleChange = (e) => {
    setNewSpecialization({
      ...newSpecialization,
      [e.target.name]: e.target.value
    });
  };

  const handleAdd = async () => {
    if (!isValidName(newSpecialization.name)) return;
    
    try {
      const success = await api.createSpecialization(newSpecialization);
      if (success) {
        setNewSpecialization(INITIAL_SPECIALIZATION);
        loadSpecializations();
      }
    } catch (error) {
      handleError('добавлении специализации', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingSpecialization || !isValidName(editingSpecialization.name)) return;
    
    try {
      const success = await api.updateSpecialization(
        editingSpecialization.id,
        { name: editingSpecialization.name }
      );
      if (success) {
        setEditingSpecialization(null);
        loadSpecializations();
      }
    } catch (error) {
      handleError('обновлении специализации', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(CONFIRM_MESSAGES.DELETE_SPECIALIZATION)) return;
    
    try {
      const success = await api.deleteSpecialization(id);
      if (success) {
        loadSpecializations();
      }
    } catch (error) {
      handleError('удалении специализации', error);
    }
  };

  return {
    specializations,
    newSpecialization,
    editingSpecialization,
    setEditingSpecialization,
    handleChange,
    handleAdd,
    handleUpdate,
    handleDelete
  };
};