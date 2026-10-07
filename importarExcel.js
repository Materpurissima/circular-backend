require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const Padron = require('./models/Padron');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado para importar'))
  .catch(err => console.log('❌ Error conectando a Mongo:', err));

const importarDatos = async () => {
  try {
    const workbook = xlsx.readFile('Alumnos_todos.XLS');
    const sheet_name_list = workbook.SheetNames;

    await Padron.deleteMany({});
    console.log('🧹 Padrón anterior limpiado.');

    let todosLosAlumnos = [];

    // Recorre todas las pestañas del Excel
    sheet_name_list.forEach(sheetName => {
      const xlData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const alumnosHoja = xlData.map(fila => ({
        nombre: fila['Nombre y Apellido'],
        curso: String(fila['Cur']),
        nivel: fila['Nivel'],
        anio: String(fila['Año']),
        dni: String(fila['D.N.I.']),
        emailPadre: fila['E-Mail Padre'] || '',
        emailMadre: fila['E-Mail Madre'] || ''
      }));

      todosLosAlumnos = todosLosAlumnos.concat(alumnosHoja);
    });

    await Padron.insertMany(todosLosAlumnos);
    console.log(`🎉 ¡Éxito! Se importaron ${todosLosAlumnos.length} alumnos al padrón de Mongo.`);

    process.exit();
  } catch (error) {
    console.error("❌ Error importando:", error);
    process.exit(1);
  }
};

importarDatos();