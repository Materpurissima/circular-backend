
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const Alumno = require('./models/Alumno');

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos (opcional, por si subís un index.html después)
app.use(express.static(path.join(__dirname, 'public')));

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// ✅ Ruta para generar HTML con logs de depuración
app.get('/api/confirmaciones/html', async (req, res) => {
  try {
    console.log('🟡 Consultando alumnos desde MongoDB...');
    const alumnos = await Alumno.find().sort({ fechaConfirmacion: -1 });
    console.log(`🟢 Se encontraron ${alumnos.length} alumnos`);

    let html = `
      <html>
      <head><title>Confirmaciones</title></head>
      <body>
        <h2>Listado de confirmaciones</h2>
        <table border="1" cellpadding="5" cellspacing="0">
          <tr>
            <th>DNI</th><th>Nombre</th><th>Apellido</th><th>Curso</th>
            <th>Confirmado</th><th>Fecha</th>
          </tr>
    `;

    alumnos.forEach(a => {
      html += `
        <tr>
          <td>${a.dni}</td>
          <td>${a.nombre}</td>
          <td>${a.apellido}</td>
          <td>${a.curso}</td>
          <td>${a.confirmado ? '✅' : '❌'}</td>
          <td>${a.fechaConfirmacion ? new Date(a.fechaConfirmacion).toLocaleString('es-AR') : ''}</td>
        </tr>
      `;
    });

    html += `
        </table>
      </body>
      </html>
    `;

    res.send(html);

  } catch (err) {
    console.error('❌ Error generando el HTML:', err);
    res.status(500).send('Error generando el HTML');
  }
});

// ✅ Rutas de la API
app.use('/api', require('./routes/alumnos'));

// Puerto
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT}`));

