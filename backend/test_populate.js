import http from 'http';

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/populate/read/ticket_participants',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(data);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(JSON.stringify({
  filter: {},
  populateFields: {
    userId: "basicInfo.firstName,basicInfo.lastName,name"
  }
}));

req.end();
