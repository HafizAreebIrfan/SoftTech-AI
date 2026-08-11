export const renderCoordinate = (value: unknown): React.ReactNode => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return number.toFixed(6);
};
