const mongoose = require('mongoose');

const AlumnoSchema = new mongoose.Schema({
  dni: { type: String, required: true, unique: true },
  nombre: String,
  apellido: String,
  curso: Number,
  confirmado: { type: Boolean, default: false },
  fechaConfirmacion: Date,
});

module.exports = mongoose.model('Alumno', AlumnoSchema);
