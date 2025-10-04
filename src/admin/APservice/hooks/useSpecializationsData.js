import { useState, useEffect } from 'react';
import { fetchSpecializations as apiGetSpecializations } from '../services/api';
import { MESSAGES } from '../utils/constants';

export const useSpecializationsData = () => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSpecializations();
  }, []);

  const loadSpecializations = async () => {
    setLoading(true);
    try {
      const data = await apiGetSpecializations();
      setSpecializations(data);
    } catch (error) {
      console.error(MESSAGES.ERROR_FETCH_SPECIALIZATIONS, error);
    } finally {
      setLoading(false);
    }
  };

  return {
    specializations,
    loading,
    loadSpecializations
  };
};