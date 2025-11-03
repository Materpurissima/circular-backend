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

// Ruta para confirmar inscripción
router.post('/confirmar', async (req, res) => {
  const { dni, nombre, apellido, curso } = req.body;

  try {
    let alumno = await Alumno.findOne({ dni });
    if (alumno && alumno.confirmado) {
      return res.json({ confirmado: true, message: 'Ya confirmado' });
    }

    if (!alumno) {
      alumno = new Alumno({ dni, nombre, apellido, curso });
    }

    alumno.confirmado = true;
    alumno.fechaConfirmacion = new Date();
    await alumno.save();

    res.json({ confirmado: false, message: 'Confirmación exitosa' });
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

// Ruta para confirmar inscripción
router.post('/confirmar', async (req, res) => {
  const { dni, nombre, apellido, curso, email } = req.body;

  try {
    let alumno = await Alumno.findOne({ dni });

    if (alumno && alumno.confirmado) {
      return res.json({ confirmado: true, message: 'Ya confirmado' });
    }

    if (!alumno) {
      alumno = new Alumno({ dni, nombre, apellido, curso, email });
    }

    alumno.confirmado = true;
    alumno.fechaConfirmacion = new Date();
    await alumno.save();

    // ✅ Enviar el correo de confirmación
    if (email) {
      await enviarConfirmacionEmail(email, alumno);
    }

    res.json({ confirmado: false, message: 'Confirmación exitosa y correo enviado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al confirmar' });
  }
});

module.exports = router;


