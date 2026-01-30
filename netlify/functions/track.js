const fetch = require('node-fetch');

exports.handler = async (event) => {
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const time = new Date().toISOString();
  let geo = '';

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,regionName,city,query,status,message`);
    const data = await res.json();
    if (data.status === 'success') {
      geo = `Страна: ${data.country}, Регион: ${data.regionName}, Город: ${data.city} (IP: ${data.query})`;
    } else {
      geo = `Ошибка ip-api: ${data.message || 'Не удалось определить геолокацию'}`;
    }
  } catch (e) {
    geo = `Ошибка запроса: ${e.message}`;
  }

  console.log(`${time} | IP: ${ip} | ${geo}`);
  return { statusCode: 200, body: "ok" };
};
