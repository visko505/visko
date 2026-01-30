const fetch = require('node-fetch');

exports.handler = async (event) => {
  let logText = "";
  let ip = event.headers['x-forwarded-for'] || event.headers['client-ip'] || "Unknown";
  ip = ip.split(',')[0].trim();

  // Получаем геоданные по IP
  let ipData;
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=66846719`);
    ipData = await res.json();
  } catch (e) {
    ipData = { status: 'fail', message: e.message };
  }

  // Данные по IP
  if (ipData.status === 'success') {
    logText += `IP: ${ip} | Город (по IP): ${ipData.city}, Регион: ${ipData.regionName}, Страна: ${ipData.country} | Индекс: ${ipData.zip} | ISP: ${ipData.isp} [Источник: ip-api.com]\n`;
    logText += `❗️Город определён по базе IP, может не совпадать с реальным положением, особенно на мобильном интернете.\n`;
  } else {
    logText += `IP: ${ip} | Не удалось получить геоданные по IP: ${ipData.message}\n`;
  }

  // Парсим тело запроса
  let coordsData, geoError;
  try {
    const body = JSON.parse(event.body || '{}');
    if (body.lat && body.lon) coordsData = { lat: body.lat, lon: body.lon };
    if (body.geoError) geoError = body.geoError;
  } catch {}

  // Если координаты есть — обратное геокодирование
  if (coordsData) {
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coordsData.lat}&lon=${coordsData.lon}`);
      const geoJson = await geoRes.json();
      const cityByGPS = geoJson.address.city || geoJson.address.town || geoJson.address.village || geoJson.address.state || "Не найдено";
      logText += `GPS: ${coordsData.lat}, ${coordsData.lon} | Город (по GPS): ${cityByGPS} [Источник: браузер+OSM]\n`;

      if (ipData.city && cityByGPS !== ipData.city) {
        logText += `🔄 Несовпадение: город по IP "${ipData.city}" ≠ город по GPS "${cityByGPS}"\n`;
      } else if (ipData.city) {
        logText += `✅ Совпадение города по IP и GPS (${cityByGPS})\n`;
      }
    } catch (e) {
      logText += `Ошибка обратного геокодирования: ${e.message}\n`;
    }
  } else if (geoError) {
    logText += `GPS не получен. Причина: [${geoError.code}] ${geoError.message}\n`;
    logText += "Определение положения только по IP.\n";
  } else {
    logText += "Координаты по GPS не получены — определение только по IP.\n";
  }

  // Логируем
  console.log(logText);

  return {
    statusCode: 200,
    body: 'ok'
  };
};
