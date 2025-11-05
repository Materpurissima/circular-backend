const express = require('express');
const router = express.Router();
const Alumno = require('../models/Alumno');
const { enviarConfirmacionEmail } = require('../services/emailService');

// Ruta para buscar alumno por DNI
router.get('/alumnos/dni/:dni', async (req, res) => {
  try {
    const alumno = await Alumno.findOne({ dni: req.params.dni });
    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }
    res.json(alumno);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// Ruta para confirmar inscripción (crea o actualiza alumno)
router.post('/confirmar', async (req, res) => {
  const { dni, nombre, apellido, curso, email } = req.body;

  if (!dni || !nombre || !apellido || !curso || !email) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });
  }

  try {
    let alumno = await Alumno.findOne({ dni });

    if (alumno && alumno.confirmado) {
      return res.json({ confirmado: true, message: 'Ya confirmado' });
    }

    if (!alumno) {
      alumno = new Alumno({ dni, nombre, apellido, curso, email });
    } else {
      // Actualizamos datos por si cambiaron
      alumno.nombre = nombre;
      alumno.apellido = apellido;
      alumno.curso = curso;
      alumno.email = email;
    }

    // Primero enviamos el email
    await enviarConfirmacionEmail(email, alumno);

    // Guardamos la confirmación solo si el email se envió correctamente
    alumno.confirmado = true;
    alumno.fechaConfirmacion = new Date();
    await alumno.save();

    res.json({ confirmado: false, message: 'Confirmación exitosa y correo enviado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al confirmar' });
  }
});

// Ruta para listar confirmaciones (con filtros)
router.get('/confirmaciones', async (req, res) => {
  try {
    const { curso, confirmado, dni } = req.query;
    let filtro = {};
    if (dni) filtro.dni = dni;
    if (curso) filtro.curso = curso;
    if (confirmado !== undefined) filtro.confirmado = confirmado === 'true';

    const alumnos = await Alumno.find(filtro);
    res.json(alumnos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al consultar confirmaciones' });
  }
});

module.exports = router;
