export const formatDate = (date = new Date()) => {
  const pad = (num, size) => num.toString().padStart(size, '0');
  
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1, 2);
  const day = pad(date.getDate(), 2);
  
  return `${day}.${month}.${year}`;
};