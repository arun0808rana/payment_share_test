const express = require("express");
const app = express();
const PORT = 9898;
const path = require("node:path");
const { createPaymentLink, validatePaymentLink } = require("./utils");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
// const secretKey = crypto.randomBytes(32); 
// secretKey must be 32 bytes long exact
const secretKey = 'hnvGR5gYmimcHybR2Lzhi5lIGMREI0Fp'

app.get("/", (req, res) => {
  const paymentPayload = {
    amount: 1000,
    currency: "USD",
    userId: 12345,
  };
//   const secretKey = "your-secret-key";
  const paymentLink = createPaymentLink(paymentPayload, secretKey);
  console.log("Payment link:", paymentLink);

  res.send(paymentLink);
});

app.get("/payment", (req, res) => {
  const { payload, signature } = req.query;
  // Verify if the payload and signature are present
  if (!payload || !signature) {
    return { valid: false, message: "Invalid payment link" };
  }

  console.log('---payload', payload);
  console.log('---sign', signature);

  const result = validatePaymentLink(payload, signature, secretKey);

  if (!result.valid) {
    return res.status(400).send(result.message);
  }

  // Process payment or display the payment details
  res.send(
    `Payment amount: ${result.payment.amount}, currency: ${result.payment.currency}`
  );
});

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
