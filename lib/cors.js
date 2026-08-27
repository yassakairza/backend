// Cookies (used for login sessions) only work cross-origin when the CORS
// response reflects the exact request origin AND allows credentials --
// a wildcard '*' origin is rejected by browsers for credentialed requests.
function setCors(req, res) {
  const origin = (req && req.headers && req.headers.origin) || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

module.exports = { setCors };
