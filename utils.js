const crypto = require("crypto");

// Function to encrypt the payload
function encrypt(text, secretKey) {
  if (secretKey.length !== 32) {
    throw new Error("Invalid key length. Must be 32 bytes for AES-256.");
  }
  const iv = crypto.randomBytes(16); // Generate a random initialization vector (IV)
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey),
    iv
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`; // Return the IV and the encrypted data together
}

// Function to create a signed payment link
function createPaymentLink(payload, secretKey) {
  try {
    // Set an expiration time (in seconds)
    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 1; // 1 minutes from now

    // Add the expiration time to the payload
    payload.exp = expirationTime;

    // Encrypt the payload
    const encryptedPayload = encrypt(JSON.stringify(payload), secretKey);

    console.log("--enc pay", encryptedPayload);

    // Sign the encrypted payload with the secret key
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(encryptedPayload)
      .digest("hex");

    // Create the shareable URL
    return `http://localhost:9898/payment?payload=${encodeURIComponent(
      encryptedPayload
    )}&signature=${signature}`;
  } catch (error) {
    console.error("Error in createPaymentLink fn", error);
  }
}

function decrypt(encryptedText, secretKey) {
  const [iv, encrypted] = encryptedText.split(":"); // Separate IV from encrypted text
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted; // Return the decrypted data as plain text
}

// Function to validate the payment link
function validatePaymentLink(payload, signature, secretKey) {
  try {
    // Recompute the signature and compare it with the one in the URL
    const computedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(payload)
      .digest("hex");
    if (signature !== computedSignature) {
      return { valid: false, message: "Invalid signature" };
    }

    // Decrypt the payload
    const decryptedPayload = JSON.parse(
      decrypt(decodeURIComponent(payload), secretKey)
    );

    // Check if the payment link has expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decryptedPayload.exp < currentTime) {
      return { valid: false, message: "Payment link has expired" };
    }

    console.log("--decrypted", decryptedPayload);
    // If everything is valid, return the payment details
    return { valid: true, payment: decryptedPayload };
  } catch (error) {
    console.error("Error in validatePaymentLink fn", error);
  }
}

module.exports = { createPaymentLink, validatePaymentLink };
