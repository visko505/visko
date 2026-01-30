const fetch = require('node-fetch');

exports.handler = async (event) => {
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const time = new Date().toISOString();
  let geo = 'Геолокация не определена';

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,query`);
    const data = await res.json();
    geo = `Страна: ${data.country}, Регион: ${data.regionName}, Город: ${data.city} (IP: ${data.query})`;
  } catch (e) {
    geo = 'Ошибка определения геолокации';
  }
  
  console.log(`${time} | IP: ${ip} | ${geo}`);
  return { statusCode: 200 };
};
