import { useState, useEffect } from 'react';
import { 
  fetchQualifications as apiGetQualifications,
  fetchSpecializationQualifications,
  fetchServiceQualifications as apiGetServiceQualifications
} from '../services/api';
import { MESSAGES } from '../utils/constants';
import { sortQualificationsByPriority } from '../utils/helpers';

export const useQualificationsData = () => {
  const [qualifications, setQualifications] = useState([]);
  const [availableQualifications, setAvailableQualifications] = useState([]);
  const [serviceQualifications, setServiceQualifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQualifications();
  }, []);

  const loadQualifications = async () => {
    setLoading(true);
    try {
      const data = await apiGetQualifications();
      const sorted = sortQualificationsByPriority(data);
      setQualifications(sorted);
    } catch (error) {
      console.error(MESSAGES.ERROR_FETCH_QUALIFICATIONS, error);
    } finally {
      setLoading(false);
    }
  };

  const loadQualificationsBySpecialization = async (specializationId) => {
    if (!specializationId) {
      setAvailableQualifications([]);
      return;
    }

    try {
      const filteredData = await fetchSpecializationQualifications(specializationId);
      const qualIds = filteredData.map(item => item.qualification_id);
      const availableQuals = qualifications.filter(q => qualIds.includes(q.id));
      setAvailableQualifications(availableQuals);
    } catch (error) {
      console.error(MESSAGES.ERROR_FETCH_SPEC_QUALS, error);
      console.warn(MESSAGES.WARN_FETCH_SPEC_QUALS);
      setAvailableQualifications(qualifications);
    }
  };

  const loadServiceQualifications = async (serviceId) => {
    try {
      const data = await apiGetServiceQualifications(serviceId);
      setServiceQualifications(data);
      return data;
    } catch (error) {
      console.error(MESSAGES.ERROR_FETCH_SERVICE_QUALS, error);
      return [];
    }
  };

  const clearAvailableQualifications = () => {
    setAvailableQualifications([]);
  };

  return {
    qualifications,
    availableQualifications,
    serviceQualifications,
    loading,
    loadQualifications,
    loadQualificationsBySpecialization,
    loadServiceQualifications,
    clearAvailableQualifications
  };
};