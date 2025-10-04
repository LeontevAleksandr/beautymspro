import { useState } from 'react';

export const useQualificationsDialog = (loadServiceQualifications) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const handleOpenDialog = async (service) => {
    setSelectedService(service);
    await loadServiceQualifications(service.id);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedService(null);
  };

  return {
    openDialog,
    selectedService,
    handleOpenDialog,
    handleCloseDialog
  };
};