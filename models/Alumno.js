const mongoose = require('mongoose');

const AlumnoSchema = new mongoose.Schema({
  dni: { type: String, required: true, unique: true },
  nombre: String,
  apellido: String,
  curso: Number,
  confirmado: { type: Boolean, default: false },
  fechaConfirmacion: Date,
  fechaLimite: Date, // Fecha límite para enviar mail automático
  email: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Alumno', AlumnoSchema);
