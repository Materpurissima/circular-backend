require('dotenv').config();
const mongoose = require('mongoose');
const Alumno = require('./models/Alumno');

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Conectado a MongoDB para limpieza anual');

    // Esto borra absolutamente todas las confirmaciones guardadas en la colección
    await Alumno.deleteMany({});

    console.log('🧹 ¡Listo! La lista de alumnos confirmados está en cero para el nuevo ciclo lectivo.');
    process.exit();
  })
  .catch(err => {
    console.error('❌ Error conectando a Mongo:', err);
    process.exit(1);
  });

  //
 // ¿Desde dónde lo ejecutás?
//Siempre desde la terminal de tu computadora (el PowerShell o la terminal integrada de Visual Studio Code).
//Tenés que asegurarte de que la consola esté ubicada adentro de tu carpeta nueva, es decir, que la línea de la consola empiece así:
//PS C:\Users\Docente\Desktop\circular-backend>
//
//¿Cómo lo ejecutás?
//Simplemente escribís este comando y apretás Enter:
//
//Bash
//node resetearAnio.js
  //