require('dotenv').config();

if (!process.env.PORT) {
  throw new Error('El puerto no está definido');
}

module.exports = {
  PORT: process.env.PORT,
};