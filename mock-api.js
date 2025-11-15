const http = require('http');
const url = require('url');

const mockData = {
  '/api/auth/login': { token: 'mock-token-12345', user: { id: 1, email: 'admin@arkuszowniasmb.pl', name: 'Admin' } },
  '/api/user/profile': { id: 1, email: 'admin@arkuszowniasmb.pl', name: 'Admin User', role: 'admin' },
  '/api/admin/users': [
    { id: 1, email: 'admin@arkuszowniasmb.pl', name: 'Admin', role: 'admin' },
    { id: 2, email: 'user@arkuszowniasmb.pl', name: 'Regular User', role: 'user' }
  ],
  '/api/admin/subscription-plans': [
    { id: 1, name: 'Basic', price: 99, duration_days: 30 },
    { id: 2, name: 'Pro', price: 199, duration_days: 30 }
  ],
  '/api/orders': [
    { id: 'ORD001', customer: 'Acme Corp', amount: 5000, status: 'completed', date: '2025-01-10' },
    { id: 'ORD002', customer: 'Tech Solutions', amount: 3500, status: 'pending', date: '2025-01-12' },
    { id: 'ORD003', customer: 'Global Industries', amount: 7200, status: 'in_progress', date: '2025-01-15' }
  ],
  '/api/shortages': [
    { item_id: 'ITM001', name: 'Component A', quantity: 50, order_id: 'ORD002' },
    { item_id: 'ITM005', name: 'Material B', quantity: 120, order_id: 'ORD003' }
  ],
  '/api/products': [
    { id: 'PROD001', name: 'Product A', price: 100, stock: 500 },
    { id: 'PROD002', name: 'Product B', price: 250, stock: 250 },
    { id: 'PROD003', name: 'Product C', price: 75, stock: 1000 }
  ],
  '/api/customers': [
    { id: 'CUST001', name: 'Acme Corp', email: 'contact@acme.com', status: 'active' },
    { id: 'CUST002', name: 'Tech Solutions', email: 'info@techsol.com', status: 'active' },
    { id: 'CUST003', name: 'Global Industries', email: 'sales@global.com', status: 'inactive' }
  ],
  '/api/admin/api-keys': [
    { id: 'key1', key: 'sk_prod_v1_***', name: 'Production Key', created: '2025-01-01' }
  ]
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, x-admin-key, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle POST requests (login, create, etc)
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log(`[POST] ${pathname}`, data);
        
        if (pathname === '/api/auth/login') {
          res.writeHead(200);
          res.end(JSON.stringify({ 
            token: 'mock-token-xyz', 
            user: { id: 1, email: data.email, name: 'User' } 
          }));
        } else if (pathname.includes('/api/admin/')) {
          res.writeHead(201);
          res.end(JSON.stringify({ id: Math.random(), ...data }));
        } else {
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, ...data }));
        }
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // Handle GET requests
  if (mockData[pathname]) {
    res.writeHead(200);
    res.end(JSON.stringify(mockData[pathname]));
  } else if (pathname.includes('/api/finance/') || pathname.includes('/api/planned-time/')) {
    res.writeHead(200);
    res.end(JSON.stringify({ orderId: pathname.split('/').pop(), data: 'mock' }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(8000, '0.0.0.0', () => {
  console.log('Mock API running on http://0.0.0.0:8000');
  console.log('Serving mock data for all /api/* endpoints');
});
