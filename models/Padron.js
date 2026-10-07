const mongoose = require('mongoose');

const padronSchema = new mongoose.Schema({
  nombre: String,
  curso: String,
  nivel: String,
  anio: String,
  dni: String,
  emailPadre: String,
  emailMadre: String
});

module.exports = mongoose.model('Padron', padronSchema);