const jwt = require('jsonwebtoken');

const JWT_SECRET = 'S7gDW0/9uY1/a02ifoLHV40unNYYdJqNBIMHBQjcnPo=';
const now = Math.floor(Date.now() / 1000);

const anonPayload = {
  role: 'anon',
  iss: 'supabase-demo',
  iat: now,
  exp: now + 31536000000
};

const serviceRolePayload = {
  role: 'service_role',
  iss: 'supabase-demo',
  iat: now,
  exp: now + 31536000000
};

const anonKey = jwt.sign(anonPayload, JWT_SECRET, { algorithm: 'HS256' });
const serviceRoleKey = jwt.sign(serviceRolePayload, JWT_SECRET, { algorithm: 'HS256' });

console.log('ANON_KEY=' + anonKey);
console.log('SERVICE_ROLE_KEY=' + serviceRoleKey);
