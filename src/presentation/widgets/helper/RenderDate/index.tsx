export const renderDate = (
  value: unknown,
  includeTime: boolean,
): React.ReactNode => {
  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    ...(includeTime
      ? {
          timeStyle: "short",
        }
      : {}),
  });
};
