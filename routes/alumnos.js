const express = require('express');
const router = express.Router();
const Alumno = require('../models/Alumno');
const Padron = require('../models/Padron'); // IMPORTAMOS EL PADRÓN
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

    // --- MAGIA DEL PADRÓN: Verificamos si existe en el padrón oficial ---
    const alumnoEnPadron = await Padron.findOne({ dni: String(dni) });
    const esFueraDePadron = !alumnoEnPadron; // Si no lo encuentra, es true

    if (!alumno) {
      alumno = new Alumno({
        dni,
        nombre,
        apellido,
        curso,
        email,
        fueraDePadron: esFueraDePadron // Guardamos el estado
      });
    } else {
      alumno.nombre = nombre;
      alumno.apellido = apellido;
      alumno.curso = curso;
      alumno.email = email;
      alumno.fueraDePadron = esFueraDePadron; // Actualizamos por si cargaron mal el DNI antes
    }

    // 1. GUARDAMOS EN LA BASE DE DATOS
    alumno.confirmado = true;
    alumno.fechaConfirmacion = new Date().toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour12: false
    });
    await alumno.save();

    // 2. ENVIAMOS EL CORREO
    const emailEnviado = await enviarConfirmacionEmail(email, alumno);

    if (!emailEnviado) {
      console.warn("⚠ El alumno se guardó en la base de datos, pero el correo no pudo enviarse.");
    }

    res.json({ success: true, message: 'Confirmación exitosa y registrada' });
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
          <style>
            .fuera-padron { background-color: #ffeeba; }
          </style>
        </head>
        <body class="bg-light">
          <div class="container-fluid mt-5 px-4">
            <h1 class="mb-4 font-weight-bold">Listado de Confirmaciones 2027</h1>

            <!-- Barra de Filtros -->
            <div class="row mb-4">
              <div class="col-md-3 mb-2">
                <input type="text" id="searchInput" class="form-control" placeholder="Buscar por DNI o Nombre...">
              </div>
              <div class="col-md-3 mb-2">
                <select id="cursoFilter" class="form-control">
                  <option value="">Todos los cursos</option>
                  <optgroup label="Nivel Inicial">
                    <option value="1">Sala de 3</option><option value="2">Sala de 4</option><option value="3">Sala de 5</option>
                  </optgroup>
                  <optgroup label="Nivel Primario">
                    <option value="4">Primer grado</option><option value="5">Segundo grado</option><option value="6">Tercer grado</option>
                    <option value="7">Cuarto grado</option><option value="8">Quinto grado</option><option value="9">Sexto grado</option>
                  </optgroup>
                  <optgroup label="Nivel Secundario">
                    <option value="10">Primer año</option><option value="11">Segundo año</option><option value="12">Tercer año</option>
                    <option value="13">Cuarto año</option><option value="14">Quinto año</option><option value="15">Sexto año</option>
                  </optgroup>
                </select>
              </div>
              <div class="col-md-3 mb-2">
                <!-- Botón para ver los nuevos/fuera de padrón -->
                <button id="btnFueraPadron" class="btn btn-warning w-100 font-weight-bold">⚠️ Ver Fuera de Padrón</button>
              </div>
              <div class="col-md-3 mb-2 text-right">
                <span class="badge badge-primary p-2" style="font-size: 1rem;">Total Filtrados: <span id="totalCount">${alumnos.length}</span></span>
              </div>
            </div>

            <!-- Tabla de Datos -->
            <div class="table-responsive bg-white shadow-sm rounded">
              <table class="table table-hover mb-0" id="alumnosTable">
                <thead class="thead-dark">
                  <tr>
                    <th>DNI</th>
                    <th>Nombre y Apellido</th>
                    <th>Curso</th>
                    <th>Email Responsable</th>
                    <th>Estado</th>
                    <th>Fecha Confirmación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
    `;

    alumnos.forEach(a => {
      const nombreCurso = nombresCursos[a.curso] || a.curso;
      const nombreCompleto = a.apellido + ", " + a.nombre;

      // Armamos la etiqueta de estado combinada
      let etiquetas = '';
      if (a.confirmado) {
        etiquetas += '<span class="badge badge-success mb-1 d-block">Confirmado</span>';
      }
      if (a.fueraDePadron) {
        etiquetas += '<span class="badge badge-danger">⚠️ Fuera de Padrón</span>';
      }

      const rowClass = a.fueraDePadron ? 'alumno-row fuera-padron' : 'alumno-row';
      const isFueraPadronAttr = a.fueraDePadron ? 'true' : 'false';

      html += `
        <tr class="${rowClass}" data-fuerapadron="${isFueraPadronAttr}">
          <td class="dni-cell font-weight-bold">${a.dni}</td>
          <td class="nombre-cell">${nombreCompleto}</td>
          <td data-curso="${a.curso}">${nombreCurso}</td>
          <td>${a.email}</td>
          <td>${etiquetas}</td>
          <td style="font-size: 0.9rem;">${a.fechaConfirmacion || '-'}</td>
          <td>
            <button class="btn btn-outline-danger btn-sm" onclick="eliminarAlumno('${a.dni}')">🗑️</button>
          </td>
        </tr>
      `;
    });

    html += `
                </tbody>
              </table>
            </div>
          </div>

          <script>
            const searchInput = document.getElementById('searchInput');
            const cursoFilter = document.getElementById('cursoFilter');
            const btnFueraPadron = document.getElementById('btnFueraPadron');
            const rows = document.querySelectorAll('.alumno-row');
            const totalCount = document.getElementById('totalCount');

            let filtroFueraPadronActivo = false;

            function filtrarTabla() {
              const searchTerm = searchInput.value.toLowerCase();
              const cursoId = cursoFilter.value;
              let visibles = 0;

              rows.forEach(row => {
                const textContent = row.textContent.toLowerCase();
                const rowCursoId = row.cells[2].getAttribute('data-curso');
                const esFueraPadron = row.getAttribute('data-fuerapadron') === 'true';

                const coincideTexto = textContent.includes(searchTerm);
                const coincideCurso = cursoId === "" || rowCursoId === cursoId;
                const coincideFueraPadron = !filtroFueraPadronActivo || esFueraPadron;

                if (coincideTexto && coincideCurso && coincideFueraPadron) {
                  row.style.display = "";
                  visibles++;
                } else {
                  row.style.display = "none";
                }
              });

              totalCount.textContent = visibles;
            }

            btnFueraPadron.addEventListener('click', () => {
              filtroFueraPadronActivo = !filtroFueraPadronActivo;
              if(filtroFueraPadronActivo) {
                btnFueraPadron.classList.replace('btn-warning', 'btn-danger');
                btnFueraPadron.innerHTML = "❌ Quitar Filtro Padrón";
              } else {
                btnFueraPadron.classList.replace('btn-danger', 'btn-warning');
                btnFueraPadron.innerHTML = "⚠️ Ver Fuera de Padrón";
              }
              filtrarTabla();
            });

            searchInput.addEventListener('keyup', filtrarTabla);
            cursoFilter.addEventListener('change', filtrarTabla);

            async function eliminarAlumno(dni) {
              const confirmacion = await Swal.fire({
                title: '¿Eliminar registro?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                confirmButtonText: 'Eliminar'
              });

              if (confirmacion.isConfirmed) {
                try {
                  const response = await fetch('/api/alumnos/dni/' + dni, { method: 'DELETE' });
                  if ((await response.json()).success) location.reload();
                } catch (error) {}
              }
            }
          </script>
        </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

module.exports = router;