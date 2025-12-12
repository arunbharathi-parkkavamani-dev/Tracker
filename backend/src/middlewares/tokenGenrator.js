import crypto from "crypto";

const tokenGenerator = () => {
  return crypto.randomBytes(32).toString("hex"); // 64-char strong token
};

export default tokenGenerator;