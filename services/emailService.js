const SibApiV3Sdk = require('sib-api-v3-sdk');
require('dotenv').config();

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const tranEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

async function enviarConfirmacionEmail(destinatario, alumno) {
  const fecha = alumno.fechaConfirmacion
                ? new Date(alumno.fechaConfirmacion).toLocaleString('es-AR')
                : new Date().toLocaleString('es-AR');

  const emailData = {
    sender: { email: process.env.FROM_EMAIL, name: 'Colegio Mater Purissima' },
    to: [{ email: destinatario }],
    subject: 'Confirmación de inscripción',
    htmlContent: `
      <html>
        <body>
          <div style="text-align:center;">
            <img src="https://materpurissima.edu.ar/logo.png" alt="Logo Colegio Mater Purissima" style="width:150px; height:auto; margin-bottom:20px;" />
          </div>
          <h2>Hola ${alumno.nombre} ${alumno.apellido}!</h2>
          <p>Tu confirmación de inscripción fue registrada exitosamente.</p>
          <p><b>Curso:</b> ${alumno.curso}</p>
          <p><b>DNI:</b> ${alumno.dni}</p>
          <p>Fecha: ${fecha}</p>
          <br/>
          <p>Saludos,<br/>Colegio Mater Purissima</p>
        </body>
      </html>
    `
  };

  try {
    await tranEmailApi.sendTransacEmail(emailData);
    console.log(`📧 Email enviado a ${destinatario}`);
    return true; // Email enviado correctamente
  } catch (error) {
    console.error('❌ Error enviando email:', error.message);
    return false; // Email falló
  }
}

module.exports = { enviarConfirmacionEmail };
