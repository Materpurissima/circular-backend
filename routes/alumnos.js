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
    alumno.fechaConfirmacion = new Date().toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour12: false
    });
    await alumno.save();

    res.json({ success: true, message: 'Confirmación exitosa y correo enviado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al confirmar' });
  }
});

// Eliminar alumno por DNI
router.delete('/alumnos/dni/:dni', async (req, res) => {
  try {
    const alumno = await Alumno.findOneAndDelete({ dni: req.params.dni });
    if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
    res.json({ success: true, message: 'Alumno eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno al eliminar' });
  }
});

// Listar confirmaciones con filtros (Panel Interactivo Completo)
router.get('/confirmaciones/html', async (req, res) => {
  try {
    const alumnos = await Alumno.find({});

    // Mapeo de cursos para la tabla
    const nombresCursos = {
      1: "Sala de 3", 2: "Sala de 4", 3: "Sala de 5",
      4: "Primer grado", 5: "Segundo grado", 6: "Tercer grado",
      7: "Cuarto grado", 8: "Quinto grado", 9: "Sexto grado",
      10: "Primer año", 11: "Segundo año", 12: "Tercer año",
      13: "Cuarto año", 14: "Quinto año", 15: "Sexto año",
    };

    let html = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Panel de Confirmaciones</title>
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" />
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        </head>
        <body class="bg-light">
          <div class="container-fluid mt-5 px-4">
            <h1 class="mb-4 font-weight-bold">Listado de Confirmaciones 2027</h1>

            <!-- Barra de Filtros -->
            <div class="row mb-4">
              <div class="col-md-4 mb-2">
                <input type="text" id="searchInput" class="form-control" placeholder="Buscar por DNI, Nombre o Apellido...">
              </div>
              <div class="col-md-4 mb-2">
                <select id="cursoFilter" class="form-control">
                  <option value="">Todos los cursos</option>
                  <optgroup label="Nivel Inicial">
                    <option value="1">Sala de 3</option>
                    <option value="2">Sala de 4</option>
                    <option value="3">Sala de 5</option>
                  </optgroup>
                  <optgroup label="Nivel Primario">
                    <option value="4">Primer grado</option>
                    <option value="5">Segundo grado</option>
                    <option value="6">Tercer grado</option>
                    <option value="7">Cuarto grado</option>
                    <option value="8">Quinto grado</option>
                    <option value="9">Sexto grado</option>
                  </optgroup>
                  <optgroup label="Nivel Secundario">
                    <option value="10">Primer año</option>
                    <option value="11">Segundo año</option>
                    <option value="12">Tercer año</option>
                    <option value="13">Cuarto año</option>
                    <option value="14">Quinto año</option>
                    <option value="15">Sexto año</option>
                  </optgroup>
                </select>
              </div>
              <div class="col-md-4 mb-2 text-right">
                <span class="badge badge-primary p-2" style="font-size: 1rem;">Total Alumnos: <span id="totalCount">${alumnos.length}</span></span>
              </div>
            </div>

            <!-- Tabla de Datos -->
            <div class="table-responsive bg-white shadow-sm rounded">
              <table class="table table-hover mb-0" id="alumnosTable">
                <thead class="thead-dark">
                  <tr>
                    <th>DNI</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Curso</th>
                    <th>Email</th>
                    <th>Confirmado</th>
                    <th>Fecha Confirmación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
    `;

    alumnos.forEach(a => {
      const nombreCurso = nombresCursos[a.curso] || a.curso;
      const badgeConfirmado = a.confirmado
        ? '<span class="badge badge-success">Sí</span>'
        : '<span class="badge badge-warning text-dark">No</span>';
      
      const fechaFormateada = a.fechaConfirmacion || '-';

      html += `
        <tr class="alumno-row">
          <td class="dni-cell">${a.dni}</td>
          <td class="nombre-cell">${a.nombre}</td>
          <td class="apellido-cell">${a.apellido}</td>
          <td data-curso="${a.curso}">${nombreCurso}</td>
          <td>${a.email}</td>
          <td>${badgeConfirmado}</td>
          <td>${fechaFormateada}</td>
          <td>
            <button class="btn btn-outline-danger btn-sm" onclick="eliminarAlumno('${a.dni}')">🗑️ Eliminar</button>
          </td>
        </tr>
      `;
    });

    html += `
                </tbody>
              </table>
            </div>
          </div>

          <!-- Lógica de Javascript para filtrado y eliminación -->
          <script>
            const searchInput = document.getElementById('searchInput');
            const cursoFilter = document.getElementById('cursoFilter');
            const rows = document.querySelectorAll('.alumno-row');
            const totalCount = document.getElementById('totalCount');

            // Filtrado dinámico
            function filtrarTabla() {
              const searchTerm = searchInput.value.toLowerCase();
              const cursoId = cursoFilter.value;
              let visibles = 0;

              rows.forEach(row => {
                const dni = row.querySelector('.dni-cell').textContent.toLowerCase();
                const nombre = row.querySelector('.nombre-cell').textContent.toLowerCase();
                const apellido = row.querySelector('.apellido-cell').textContent.toLowerCase();
                const rowCursoId = row.cells[3].getAttribute('data-curso');

                const coincideTexto = dni.includes(searchTerm) || nombre.includes(searchTerm) || apellido.includes(searchTerm);
                const coincideCurso = cursoId === "" || rowCursoId === cursoId;

                if (coincideTexto && coincideCurso) {
                  row.style.display = "";
                  visibles++;
                } else {
                  row.style.display = "none";
                }
              });

              totalCount.textContent = visibles;
            }

            searchInput.addEventListener('keyup', filtrarTabla);
            cursoFilter.addEventListener('change', filtrarTabla);

            // Eliminar registro
            async function eliminarAlumno(dni) {
              const confirmacion = await Swal.fire({
                title: '¿Eliminar alumno?',
                text: "Esta acción borrará el registro de la base de datos de forma permanente.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
              });

              if (confirmacion.isConfirmed) {
                try {
                  const response = await fetch('/api/alumnos/dni/' + dni, {
                    method: 'DELETE'
                  });
                  const data = await response.json();

                  if (data.success) {
                    await Swal.fire('Eliminado', 'El alumno ha sido borrado correctamente.', 'success');
                    location.reload();
                  } else {
                    Swal.fire('Error', 'No se pudo eliminar: ' + data.message, 'error');
                  }
                } catch (error) {
                  Swal.fire('Error', 'Hubo un problema de conexión con el servidor.', 'error');
                }
              }
            }
          </script>
        </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al generar el panel HTML');
  }
});

module.exports = router;
