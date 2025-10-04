// Сортировка квалификаций по приоритету
export const sortQualificationsByPriority = (qualifications) => {
  return [...qualifications].sort((a, b) => a.priority - b.priority);
};

// Проверка, включена ли квалификация в список цен
export const isQualificationIncluded = (qualificationPrices, qualificationId) => {
  return qualificationPrices.some(item => item.qualification_id === qualificationId);
};

// Получение цены для конкретной квалификации
export const getPriceForQualification = (qualificationPrices, qualificationId) => {
  const item = qualificationPrices.find(item => item.qualification_id === qualificationId);
  return item ? item.price : '';
};

// Получение имени квалификации по ID
export const getQualificationName = (qualifications, id) => {
  const qual = qualifications.find(q => q.id === id);
  return qual ? qual.name : `Квалификация ${id}`;
};

// Получение имени специализации по ID
export const getSpecializationName = (specializations, id) => {
  const spec = specializations.find(s => s.id === id);
  return spec ? spec.name : '';
};

// Обновление цены квалификации
export const updateQualificationPrice = (qualificationPrices, qualificationId, price) => {
  const updatedPrices = [...qualificationPrices];
  const existingIndex = updatedPrices.findIndex(item => item.qualification_id === qualificationId);
  
  if (price === '') {
    // Если цена пустая, удаляем квалификацию из списка
    if (existingIndex !== -1) {
      updatedPrices.splice(existingIndex, 1);
    }
  } else {
    // Иначе обновляем или добавляем
    const priceValue = parseFloat(price);
    if (existingIndex !== -1) {
      updatedPrices[existingIndex] = {
        qualification_id: qualificationId,
        price: priceValue,
        is_allowed: true
      };
    } else {
      updatedPrices.push({
        qualification_id: qualificationId,
        price: priceValue,
        is_allowed: true
      });
    }
  }
  
  return updatedPrices;
};

// Подготовка данных услуги для отправки
export const prepareServiceData = (formData) => {
  return {
    name: formData.name,
    specialization_id: parseInt(formData.specialization_id),
    base_price: parseFloat(formData.base_price),
    duration: parseInt(formData.duration)
  };
};

// Преобразование квалификаций услуги в формат формы
export const transformServiceQualificationsToForm = (serviceQualifications) => {
  return serviceQualifications.map(sq => ({
    qualification_id: sq.qualification_id,
    price: sq.price_modified,
    is_allowed: sq.is_allowed
  }));
};