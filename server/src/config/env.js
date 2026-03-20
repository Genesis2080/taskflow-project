require('dotenv').config();

const PORT = process.env.PORT || 3000;

if (!PORT) {
  throw new Error('El puerto no está definido');
}

module.exports = { PORT };