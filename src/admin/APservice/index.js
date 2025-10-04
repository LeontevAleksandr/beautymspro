import React from 'react';
import { Box } from '@mui/material';

// Hooks
import { useServicesData } from './hooks/useServicesData';
import { useSpecializationsData } from './hooks/useSpecializationsData';
import { useQualificationsData } from './hooks/useQualificationsData';
import { useServiceForm } from './hooks/useServiceForm';
import { useQualificationsDialog } from './hooks/useQualificationsDialog';

// Components
import ServiceHeader from './components/ServiceHeader';
import ServiceForm from './components/ServiceForm';
import ServiceListHeader from './components/ServiceListHeader';
import ServicesTable from './components/ServicesTable';
import QualificationsDialog from './components/QualificationsDialog';

const APservice = () => {
  // Загрузка данных
  const { services, handleSaveService, handleDeleteService } = useServicesData();
  const { specializations } = useSpecializationsData();
  const {
    qualifications,
    availableQualifications,
    serviceQualifications,
    loadQualificationsBySpecialization,
    loadServiceQualifications,
    clearAvailableQualifications
  } = useQualificationsData();

  // Управление формой
  const {
    formData,
    isEditing,
    editingId,
    handleChange,
    handleQualificationPriceChange,
    handleEdit,
    resetForm
  } = useServiceForm(
    loadQualificationsBySpecialization,
    loadServiceQualifications,
    clearAvailableQualifications
  );

  // Управление диалогом
  const {
    openDialog,
    selectedService,
    handleOpenDialog,
    handleCloseDialog
  } = useQualificationsDialog(loadServiceQualifications);

  // Обработчики
  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await handleSaveService(formData, isEditing, editingId);
    if (success) {
      resetForm();
    }
  };

  const handleEditClick = async (service) => {
    await handleEdit(service, serviceQualifications);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Заголовок */}
      <ServiceHeader />

      {/* Форма добавления/редактирования */}
      <ServiceForm
        formData={formData}
        isEditing={isEditing}
        specializations={specializations}
        availableQualifications={availableQualifications}
        onChange={handleChange}
        onQualificationPriceChange={handleQualificationPriceChange}
        onSubmit={handleSubmit}
        onCancel={resetForm}
      />

      {/* Заголовок списка */}
      <ServiceListHeader />

      {/* Таблица услуг */}
      <ServicesTable
        services={services}
        onEdit={handleEditClick}
        onDelete={handleDeleteService}
        onOpenQualifications={handleOpenDialog}
      />

      {/* Диалог квалификаций */}
      <QualificationsDialog
        open={openDialog}
        selectedService={selectedService}
        serviceQualifications={serviceQualifications}
        qualifications={qualifications}
        onClose={handleCloseDialog}
      />
    </Box>
  );
};

export default APservice;