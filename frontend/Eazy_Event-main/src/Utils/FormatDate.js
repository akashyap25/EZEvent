const formatDateTime = (datetime) => {
  const date = new Date(datetime);
  
  const dateOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const timeOptions = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  const formattedDate = new Intl.DateTimeFormat('en-IN', dateOptions).format(date);
  const formattedTime = new Intl.DateTimeFormat('en-IN', timeOptions).format(date);

  return {
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

export default formatDateTime;
