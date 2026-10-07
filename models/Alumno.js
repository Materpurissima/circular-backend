const mongoose = require('mongoose');

const AlumnoSchema = new mongoose.Schema({
  dni: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  curso: { type: String, required: true }, // Cambiado a String para aceptar cualquier formato de curso sin chistar
  confirmado: { type: Boolean, default: false },
  fechaConfirmacion: { type: String },     // Cambiado a String para que guarde perfectamente la hora local de Argentina
  fechaLimite: Date, 
  email: { type: String, required: true }  // Quitamos unique: true en email por si dos hermanos usan el mismo correo de los padres
});

const mongoose = require('mongoose');

const alumnoSchema = new mongoose.Schema({
  nombre: String,
  curso: String,
  dni: String,
  email: String,
  // ... (tus otros campos)
  fechaConfirmacion: Date,
  fueraDePadron: { type: Boolean, default: false } // Agregamos esta línea
});

module.exports = mongoose.model('Alumno', alumnoSchema);

