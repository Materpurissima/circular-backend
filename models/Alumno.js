const mongoose = require('mongoose');

const AlumnoSchema = new mongoose.Schema({
  dni: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  curso: { type: Number, required: true },
  confirmado: { type: Boolean, default: false },
  fechaConfirmacion: Date,
  fechaLimite: Date, // Fecha límite para enviar mail automático
  email: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Alumno', AlumnoSchema);
