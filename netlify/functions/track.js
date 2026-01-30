exports.handler = async (event) => {
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const time = new Date().toISOString();
  console.log(`${time} | IP: ${ip}`); // Выводится прямо в Netlify логах
  return { statusCode: 200 };
};
