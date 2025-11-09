import crypto from "crypto";

const ALGO = "aes-256-cbc";

// 🔐 Encrypt text → Base64 string
function encrypt(text, secret) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(secret, "salt", 32);
  const cipher = crypto.createCipheriv(ALGO, key, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  return `${iv.toString("base64")}:${encrypted}`;
}

// 🔓 Decrypt Base64 string → original text
function decrypt(encData, secret) {
  const [ivStr, data] = encData.split(":");
  const iv = Buffer.from(ivStr, "base64");
  const key = crypto.scryptSync(secret, "salt", 32);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);

  let decrypted = decipher.update(data, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

const hash = (data, alg = "sha1") => {
  return crypto
    .createHash(alg || "sha256")
    .update(data)
    .digest("hex");
};

class Cryptography {
  encrypt = async (data, secret) => {
    if (!secret) return data;
    return encrypt(data, secret);
  };

  decrypt = async (data, secret) => {
    if (!secret) return data;
    return decrypt(data, secret);
  };
}

export default Cryptography;
export { decrypt, encrypt, hash };
