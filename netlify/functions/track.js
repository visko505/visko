// netlify/functions/track.js
exports.handler = async function(event, context) {
  // Получаем IP
  const ip = event.headers['x-forwarded-for']?.split(',')[0]?.trim() 
          || event.headers['client-ip']
          || event.headers['x-real-ip']
          || "IP not found";

  let geoInfo = {};
  let error = null;

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,query`);
    geoInfo = await response.json();
    if (geoInfo.status !== 'success') {
      error = geoInfo.message || 'Unknown error';
    }
  } catch (e) {
    error = e.message;
  }

  if (!error) {
    console.log(`IP: ${ip} | ${geoInfo.country}, ${geoInfo.regionName}, ${geoInfo.city}`);
  } else {
    console.log(`IP: ${ip} | Гео ошибка: ${error}`);
  }

  return {
    statusCode: 200,
    body: "ok"
  };
};
