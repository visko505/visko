const fetch = require('node-fetch');

exports.handler = async (event) => {
  let logText = "";
  let ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || "Unknown";
  ip = ip.split(',')[0].trim();

  let ipData;
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=66846719`);
    ipData = await res.json();
  } catch (e) {
    ipData = { status: 'fail', message: e.message };
  }

  if (ipData.status === 'success') {
    logText += `IP: ${ip} | Город (по IP): ${ipData.city}, Регион: ${ipData.regionName}, Страна: ${ipData.country} | Индекс: ${ipData.zip} | ISP: ${ipData.isp} [Источник: ip-api.com]\n`;
    logText += `❗️Город определён по базе IP, может не совпадать с реальным положением, особенно на мобильном интернете.\n`;
  } else {
    logText += `IP: ${ip} | Не удалось получить геоданные по IP: ${ipData.message}\n`;
  }

  console.log(logText);

  return {
    statusCode: 200,
    body: 'ok'
  };
};
