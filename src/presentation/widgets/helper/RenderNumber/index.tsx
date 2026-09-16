export const renderNumber = (value: unknown): React.ReactNode => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return number.toLocaleString();
};
