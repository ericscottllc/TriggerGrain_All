export const formatDateUTC = (dateString: string): string => {
  const d = new Date(`${dateString}T00:00:00.000Z`);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  });
};
