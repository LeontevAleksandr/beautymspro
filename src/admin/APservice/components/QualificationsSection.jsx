import React from 'react';
import { FormControl, Typography } from '@mui/material';
import QualificationsTable from './QualificationsTable';

const QualificationsSection = ({
  formData,
  availableQualifications,
  isQualificationIncluded,
  getPriceForQualification,
  onQualificationPriceChange
}) => {
  return (
    <FormControl fullWidth>
      <Typography
        variant="subtitle2"
        sx={{
          color: '#424242',
          fontWeight: 500,
          mb: 2
        }}
      >
        Уровни квалификации и цены
      </Typography>

      <QualificationsTable
        availableQualifications={availableQualifications}
        formData={formData}
        isQualificationIncluded={isQualificationIncluded}
        getPriceForQualification={getPriceForQualification}
        onQualificationPriceChange={onQualificationPriceChange}
      />

      {!formData.specialization_id && (
        <Typography variant="caption" color="error" sx={{ mt: 1 }}>
          Выберите специализацию, чтобы увидеть доступные квалификации
        </Typography>
      )}
      {formData.specialization_id && availableQualifications.length === 0 && (
        <Typography variant="caption" color="error" sx={{ mt: 1 }}>
          Для выбранной специализации не найдено квалификаций. Добавьте их в разделе "Специализации"
        </Typography>
      )}
    </FormControl>
  );
};

export default QualificationsSection;