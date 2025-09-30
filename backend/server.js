import dotenv from "dotenv";
import { server, io } from "./src/index.js"; // import the HTTP server, not just app

dotenv.config();

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
