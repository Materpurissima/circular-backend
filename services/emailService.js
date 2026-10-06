const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

// Diccionario para mapear el número de curso al nombre real
const nombresCursos = {
  1: "Sala de 3", 2: "Sala de 4", 3: "Sala de 5",
  4: "Primer grado", 5: "Segundo grado", 6: "Tercer grado",
  7: "Cuarto grado", 8: "Quinto grado", 9: "Sexto grado",
  10: "Primer año", 11: "Segundo año", 12: "Tercer año",
  13: "Cuarto año", 14: "Quinto año", 15: "Sexto año",
};

async function enviarConfirmacionEmail(destinatario, alumno) {
  const fecha = alumno.fechaConfirmacion
                ? new Date(alumno.fechaConfirmacion).toLocaleString('es-AR')
                : new Date().toLocaleString('es-AR');

 const emailData = {
    sender: { email: process.env.FROM_EMAIL, name: 'Colegio Mater Purissima' },
    to: [{ email: destinatario }],
    subject: 'Confirmación de inscripción',
    htmlContent: `
      <html lang="es">
        <body>
          <div style="text-align:center;">
            <img src="https://circular-backend-k0ta.onrender.com/logo.png" alt="Logo Colegio Mater Purissima" style="width:150px; height:auto; margin-bottom:20px;" />
          </div>
          <h2>Hola ${alumno.nombre} ${alumno.apellido}!</h2>
          <p>Tu confirmación de inscripción fue registrada exitosamente.</p>
          <p><b>Curso:</b> ${nombresCursos[alumno.curso] || alumno.curso}</p>
          <p><b>DNI:</b> ${alumno.dni}</p>
          <p>Fecha: ${fecha}</p>
          <br/>
          <p>Saludos,<br/>Colegio Mater Purissima</p>
        </body>
      </html>
    `
  };

  try {
    const data = await tranEmailApi.sendTransacEmail(emailData);
    console.log(`📧 Email enviado a ${destinatario}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error.response ? error.response.body : error.message);
    return false;
  }
}

module.exports = { enviarConfirmacionEmail };
