exports.handler = async function(event) {
  // Получить IP клиента максимально надёжно
  const ip =
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.headers["client-ip"] ||
    event.headers["x-real-ip"] ||
    "IP not found";

  let geo = {};
  let error = null;

  // Есть ли координаты от клиента?
  let coords = null;
  if (event.body) {
    try {
      const body = JSON.parse(event.body);
      if (body.lat && body.lon) {
        coords = { lat: body.lat, lon: body.lon };
        // Логируем координаты явно!
        console.log(`IP: ${ip} | GEO COORDS: ${coords.lat},${coords.lon}`);
      }
    } catch {}
  }

  // Всегда делаем запрос по IP через ip-api.com
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,zip,isp,query`
    );
    geo = await response.json();
    if (geo.status !== "success") {
      error = geo.message || "Unknown error";
    }
  } catch (e) {
    error = e.message;
  }

  if (!error) {
    console.log(
      `IP: ${ip} | ${geo.country}, ${geo.regionName}, ${geo.city}, ${geo.zip}, ISP: ${geo.isp}`
    );
  } else {
    console.log(`IP: ${ip} | Гео ошибка: ${error}`);
  }

  return {
    statusCode: 200,
    body: "ok",
  };
};
