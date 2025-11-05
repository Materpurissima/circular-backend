const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();
const path = require('path');
const Alumno = require('./models/Alumno');
const { enviarConfirmacionEmail } = require('./services/emailService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// Cron: todos los días 9:00 am revisa alumnos no confirmados y con fechaLimite pasada
cron.schedule('0 9 * * *', async () => {
  console.log('🟡 Revisando alumnos pendientes...');

  const hoy = new Date();
  const alumnos = await Alumno.find({ confirmado: false, fechaLimite: { $lte: hoy } });

  for (const a of alumnos) {
    await enviarConfirmacionEmail(a.email, a);
  }

  console.log(`🟢 Correos procesados: ${alumnos.length}`);
});

// Rutas de API
app.use('/api', require('./routes/alumnos'));

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Puerto
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Servidor escuchando en puerto ${PORT}`));
