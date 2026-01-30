const fs = require('fs').promises;

exports.handler = async (event) => {
  const ip = event.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const time = new Date().toISOString();
  
  const file = '/tmp/ips.txt';
  const log = `${time} | ${ip}\n`;
  
  try {
    const data = await fs.readFile(file, 'utf8');
    await fs.writeFile(file, log + data);
  } catch {
    await fs.writeFile(file, log);
  }
  
  return { statusCode: 200 };
};
