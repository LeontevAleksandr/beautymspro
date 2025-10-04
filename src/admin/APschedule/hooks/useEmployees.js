import { useState, useEffect } from 'react';
import { fetchEmployees as apiFetchEmployees } from '../services/api';

export const useEmployees = (showSnackbar) => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployees] = useState([]);

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const data = await apiFetchEmployees();
            setEmployees(data);
        } catch (error) {
            showSnackbar(error.message, 'error');
        }
    };

    return {
        employees,
        selectedEmployees,
        loadEmployees
    };
};