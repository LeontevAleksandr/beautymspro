import { useState, useEffect } from 'react';
import { 
  fetchServices as apiGetServices,
  createService,
  updateService,
  deleteService,
  deleteServiceQualifications,
  createServiceQualification
} from '../services/api';
import { MESSAGES } from '../utils/constants';
import { prepareServiceData } from '../utils/helpers';

export const useServicesData = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await apiGetServices();
      setServices(data);
    } catch (error) {
      console.error(MESSAGES.ERROR_FETCH_SERVICES, error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (formData) => {
    const serviceData = prepareServiceData(formData);
    const responseData = await createService(serviceData);
    return responseData.id;
  };

  const handleUpdateService = async (serviceId, formData) => {
    const serviceData = prepareServiceData(formData);
    await updateService(serviceId, serviceData);
    return serviceId;
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm(MESSAGES.DELETE_CONFIRM)) return false;
    
    try {
      await deleteService(serviceId);
      await loadServices();
      return true;
    } catch (error) {
      console.error(MESSAGES.ERROR_DELETE_SERVICE, error);
      return false;
    }
  };

  const saveServiceQualifications = async (serviceId, qualificationPrices, isEditing) => {
    if (!qualificationPrices || qualificationPrices.length === 0) return;

    // Удаляем существующие связи при редактировании
    if (isEditing) {
      await deleteServiceQualifications(serviceId);
    }

    // Добавляем новые связи
    for (const qualPrice of qualificationPrices) {
      await createServiceQualification(
        serviceId,
        qualPrice.qualification_id,
        qualPrice.price
      );
    }
  };

  const handleSaveService = async (formData, isEditing, editingId) => {
    try {
      let serviceId;

      if (isEditing) {
        serviceId = await handleUpdateService(editingId, formData);
      } else {
        serviceId = await handleCreateService(formData);
      }

      await saveServiceQualifications(serviceId, formData.qualification_prices, isEditing);
      await loadServices();
      
      return true;
    } catch (error) {
      console.error(MESSAGES.ERROR_SAVE_SERVICE, error);
      return false;
    }
  };

  return {
    services,
    loading,
    loadServices,
    handleSaveService,
    handleDeleteService
  };
};