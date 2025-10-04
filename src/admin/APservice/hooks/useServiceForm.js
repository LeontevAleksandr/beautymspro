import { useState } from 'react';
import { INITIAL_FORM_STATE } from '../utils/constants';
import { updateQualificationPrice, transformServiceQualificationsToForm } from '../utils/helpers';

export const useServiceForm = (
  loadQualificationsBySpecialization,
  loadServiceQualifications,
  clearAvailableQualifications
) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Если изменилась специализация, обновляем доступные квалификации
    if (name === 'specialization_id') {
      loadQualificationsBySpecialization(value);
      // Очищаем выбранные квалификации при смене специализации
      setFormData({
        ...formData,
        [name]: value,
        qualification_prices: []
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleQualificationPriceChange = (qualificationId, price) => {
    const updatedPrices = updateQualificationPrice(
      formData.qualification_prices,
      qualificationId,
      price
    );
    
    setFormData({
      ...formData,
      qualification_prices: updatedPrices
    });
  };

  const handleEdit = async (service, serviceQualifications) => {
    setIsEditing(true);
    setEditingId(service.id);
    
    // Получаем квалификации для выбранной специализации
    await loadQualificationsBySpecialization(service.specialization_id);
    
    // Получаем квалификации для выбранной услуги
    const loadedQuals = await loadServiceQualifications(service.id);
    
    // Формируем массив qualification_prices на основе полученных данных
    const qualificationPrices = transformServiceQualificationsToForm(
      loadedQuals.length > 0 ? loadedQuals : serviceQualifications
    );
    
    setFormData({
      name: service.name,
      specialization_id: service.specialization_id,
      base_price: service.base_price,
      duration: service.duration,
      qualification_prices: qualificationPrices
    });
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setIsEditing(false);
    setEditingId(null);
    clearAvailableQualifications();
  };

  return {
    formData,
    isEditing,
    editingId,
    handleChange,
    handleQualificationPriceChange,
    handleEdit,
    resetForm
  };
};