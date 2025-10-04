// Общие стили для текстовых полей
export const textFieldStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2
  }
};

// Стили для Paper компонентов диалогов
export const dialogPaperStyle = {
  borderRadius: 3,
  boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
};

// Стили для заголовка диалога
export const dialogTitleStyle = {
  borderBottom: '1px solid #e0e0e0',
  pb: 2,
  fontWeight: 500
};

// Стили для контента диалога
export const dialogContentStyle = {
  pt: 3
};

// Стили для кнопок действий
export const actionButtonStyle = {
  borderRadius: 2,
  textTransform: 'none',
  minWidth: 100
};

// Стили для основных кнопок
export const primaryButtonStyle = {
  ...actionButtonStyle,
  backgroundColor: '#1976d2',
  '&:hover': {
    backgroundColor: '#1565c0'
  }
};

// Стили для вторичных кнопок
export const secondaryButtonStyle = {
  ...actionButtonStyle,
  color: '#666'
};