const express = require('express');
const router = express.Router();
const Alumno = require('../models/Alumno');
const { enviarConfirmacionEmail } = require('../services/emailService');

// Buscar alumno por DNI
router.get('/alumnos/dni/:dni', async (req, res) => {
  try {
    const alumno = await Alumno.findOne({ dni: req.params.dni });
    if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json(alumno);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno' });
  }
});

// Confirmar inscripción
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
      alumno.nombre = nombre;
      alumno.apellido = apellido;
      alumno.curso = curso;
      alumno.email = email;
    }

    // Intentamos enviar el correo
    const emailEnviado = await enviarConfirmacionEmail(email, alumno);

    if (!emailEnviado) {
      return res.status(500).json({ confirmado: false, message: 'No se pudo enviar el correo de confirmación' });
    }

    alumno.confirmado = true;
    alumno.fechaConfirmacion = new Date();
    await alumno.save();

    res.json({ confirmado: false, message: 'Confirmación exitosa y correo enviado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al confirmar' });
  }
});

// Listar confirmaciones con filtros
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

// Nueva ruta para mostrar confirmaciones en HTML
router.get('/confirmaciones/html', async (req, res) => {
  try {
    const alumnos = await Alumno.find({});
    let html = `
      <html>
        <head><title>Confirmaciones</title></head>
        <body>
          <h1>Listado de confirmaciones</h1>
          <table border="1" cellpadding="5" cellspacing="0">
            <tr>
              <th>DNI</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Curso</th>
              <th>Email</th>
              <th>Confirmado</th>
              <th>Fecha Confirmación</th>
            </tr>
    `;
    alumnos.forEach(a => {
      html += `
        <tr>
          <td>${a.dni}</td>
          <td>${a.nombre}</td>
          <td>${a.apellido}</td>
          <td>${a.curso}</td>
          <td>${a.email}</td>
          <td>${a.confirmado ? 'Sí' : 'No'}</td>
          <td>${a.fechaConfirmacion ? new Date(a.fechaConfirmacion).toLocaleString() : ''}</td>
        </tr>
      `;
    });
    html += `</table></body></html>`;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al generar HTML');
  }
});

module.exports = router;
