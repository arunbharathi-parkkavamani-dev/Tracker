import express from 'express';
import http from 'http';

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.get('/populate', (req, res) => {
  // Sample data to populate
  const sampleData = [
    { message: 'Hello, World!' },
  ];
  res.status(200).json({ data: sampleData });
});

const PORT = 3001;

server.listen(PORT, "0.0.0.0", () => {
  // console.log(`Populate service running on port ${PORT}`);
});

