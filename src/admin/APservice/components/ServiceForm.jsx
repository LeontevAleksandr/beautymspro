import React from 'react';
import { Box, Paper, Typography, Stack, Divider, Button } from '@mui/material';
import { Save, Cancel } from '@mui/icons-material';
import BasicInfoSection from './BasicInfoSection';
import ServiceParamsSection from './ServiceParamsSection';
import QualificationsSection from './QualificationsSection';
import { isQualificationIncluded, getPriceForQualification } from '../utils/helpers';

const ServiceForm = ({
  formData,
  isEditing,
  specializations,
  availableQualifications,
  onChange,
  onQualificationPriceChange,
  onSubmit,
  onCancel
}) => {
  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e0e0e0'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: '#1a1a1a', mb: 2 }}>
        {isEditing ? 'Редактирование услуги' : 'Добавление новой услуги'}
      </Typography>

      <Box component="form" onSubmit={onSubmit}>
        <Stack spacing={2.5}>
          {/* Основная информация */}
          <BasicInfoSection
            formData={formData}
            specializations={specializations}
            onChange={onChange}
          />

          <Divider sx={{ my: 1 }} />

          {/* Параметры услуги */}
          <ServiceParamsSection
            formData={formData}
            onChange={onChange}
          />

          <Divider sx={{ my: 1 }} />

          {/* Уровни квалификации */}
          <QualificationsSection
            formData={formData}
            availableQualifications={availableQualifications}
            isQualificationIncluded={isQualificationIncluded}
            getPriceForQualification={getPriceForQualification}
            onQualificationPriceChange={onQualificationPriceChange}
          />

          {/* Кнопки действий */}
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={isEditing ? <Save /> : <Save />}
              disabled={!formData.name || !formData.specialization_id || !formData.base_price || !formData.duration}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                backgroundColor: '#1976d2',
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.25)',
                minWidth: 160,
                '&:hover': {
                  backgroundColor: '#1565c0',
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.35)'
                }
              }}
            >
              {isEditing ? 'Сохранить изменения' : 'Добавить услугу'}
            </Button>

            {isEditing && (
              <Button
                variant="outlined"
                onClick={onCancel}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#e0e0e0',
                  color: '#666',
                  '&:hover': {
                    borderColor: '#bdbdbd',
                    backgroundColor: '#f5f5f5'
                  }
                }}
              >
                Отмена
              </Button>
            )}
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
};

export default ServiceForm;