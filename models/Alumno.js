const mongoose = require('mongoose');

const alumnoSchema = new mongoose.Schema({
  dni: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  curso: { type: String, required: true },
  email: { type: String, required: true },
  confirmado: { type: Boolean, default: false },
  fechaConfirmacion: { type: String },
  fechaLimite: Date,
  fueraDePadron: { type: Boolean, default: false } // La nueva etiqueta para el panel
});

module.exports = mongoose.model('Alumno', alumnoSchema);