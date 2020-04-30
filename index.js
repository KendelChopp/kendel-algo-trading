const Alpaca = require('@alpacahq/alpaca-trade-api');

const alpaca = new Alpaca({
  keyId: process.env.API_KEY,
  secretKey: process.env.SECRET_API_KEY,
  paper: true
});

async function printAccount() {
  const account = await alpaca.getAccount();
  console.log(account);
}

printAccount();
