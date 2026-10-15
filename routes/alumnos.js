const express = require('express');
const router = express.Router();
const Alumno = require('../models/Alumno');
const Padron = require('../models/Padron');
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

    const alumnoEnPadron = await Padron.findOne({ dni: String(dni) });
    const esFueraDePadron = !alumnoEnPadron;

    if (!alumno) {
      alumno = new Alumno({
        dni, nombre, apellido, curso, email,
        fueraDePadron: esFueraDePadron
      });
    } else {
      alumno.nombre = nombre;
      alumno.apellido = apellido;
      alumno.curso = curso;
      alumno.email = email;
      alumno.fueraDePadron = esFueraDePadron;
    }

    alumno.confirmado = true;
    alumno.fechaConfirmacion = new Date().toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour12: false
    });
    await alumno.save();

    const emailEnviado = await enviarConfirmacionEmail(email, alumno);

    if (!emailEnviado) {
      console.warn("⚠ El correo no pudo enviarse.");
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

// Nombres de los cursos
const nombresCursos = {
  1: "Sala de 3", 2: "Sala de 4", 3: "Sala de 5",
  4: "Primer grado", 5: "Segundo grado", 6: "Tercer grado",
  7: "Cuarto grado", 8: "Quinto grado", 9: "Sexto grado",
  10: "Primer año", 11: "Segundo año", 12: "Tercer año",
  13: "Cuarto año", 14: "Quinto año", 15: "Sexto año",
};

// Panel Principal (Confirmados)
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
          <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" />
          <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
          
          <style>
            body { font-family: 'Nunito', sans-serif; background-color: #f8fafc; color: #1e293b; }
            .title-panel { font-weight: 800; color: #0f172a; }
            .form-control { border-radius: 50px; border: 1.5px solid #e2e8f0; padding: 0.6rem 1.2rem; transition: all 0.3s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
            .form-control:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
            
            /* Botones principales agrupados */
            .btn-custom { border-radius: 50px; font-weight: 700; padding: 0.65rem 1.8rem; border: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08); }
            .btn-custom:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            .btn-red { background-color: #e11d48; color: white !important; }
            .btn-red:hover { background-color: #be123c; }
            .btn-yellow { background-color: #eab308; color: #1e293b !important; }
            .btn-yellow:hover { background-color: #ca8a04; }
            .btn-danger-filtro { background-color: #ef4444; color: white !important; }
            
            .badge-total { border-radius: 50px; background-color: #3b82f6; color: white; padding: 0.65rem 1.5rem; font-weight: 800; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1); display: inline-block; }
            .table-container { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            .table thead th { background-color: #1e293b; color: #f8fafc; font-weight: 700; text-transform: uppercase; font-size: 0.8rem; padding: 1.1rem 1rem; border: none; }
            .table tbody td { padding: 1rem 1rem; vertical-align: middle; border-color: #f1f5f9; font-size: 0.95rem; }
            .fuera-padron { background-color: #fef08a; }
            .badge-success-modern { background-color: #dcfce7; color: #15803d; font-weight: 700; padding: 0.35rem 0.8rem; border-radius: 50px; display: inline-block; }
            .badge-danger-modern { background-color: #fee2e2; color: #b91c1c; font-weight: 700; padding: 0.35rem 0.8rem; border-radius: 50px; display: inline-block; }
            .btn-delete { border-radius: 50%; width: 36px; height: 36px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid #f1f5f9; background-color: white; color: #94a3b8; transition: all 0.2s ease; }
            .btn-delete:hover { background-color: #fee2e2; border-color: #fecaca; color: #ef4444; transform: scale(1.05); }
          </style>
        </head>
        <body>
          <div class="container-fluid mt-4 px-lg-5">
            <!-- Título y Botones agrupados arriba a la derecha -->
            <div class="row align-items-center mb-4">
                <div class="col-md-5 mb-3 mb-md-0">
                    <h1 class="title-panel mb-0">Listado de Confirmados 2027</h1>
                </div>
                <div class="col-md-7 text-md-right">
                    <button id="btnFueraPadron" class="btn btn-custom btn-yellow mr-2" style="min-width: 190px;">Ver Fuera de Padrón</button>
                    <a href="/api/faltantes/html" class="btn btn-custom btn-red" style="min-width: 190px;">Ver Faltantes</a>
                </div>
            </div>

            <!-- Barra de Filtros -->
            <div class="row align-items-center mb-4">
              <div class="col-md-4 mb-3 mb-md-0">
                <input type="text" id="searchInput" class="form-control" placeholder="🔍 Buscar por DNI o Nombre...">
              </div>
              <div class="col-md-4 mb-3 mb-md-0">
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
              <div class="col-md-4 text-md-right">
                <span class="badge-total">Total Filtrados: <span id="totalCount">${alumnos.length}</span></span>
              </div>
            </div>

            <div class="table-responsive table-container">
              <table class="table table-hover mb-0" id="alumnosTable">
                <thead>
                  <tr>
                    <th>DNI</th>
                    <th>Nombre y Apellido</th>
                    <th>Curso</th>
                    <th>Email Responsable</th>
                    <th class="text-center">Estado</th>
                    <th>Fecha Confirmación</th>
                    <th class="text-center" style="width: 80px;">Acciones</th>
                  </tr>
                </thead>
                <tbody>
    `;

    alumnos.forEach(a => {
      const nombreCurso = nombresCursos[a.curso] || a.curso;
      const nombreCompleto = a.apellido + ", " + a.nombre;
      
      let etiquetas = '';
      if (a.confirmado) etiquetas += '<span class="badge-success-modern mb-1 d-block text-center">Confirmado</span>';
      if (a.fueraDePadron) etiquetas += '<span class="badge-danger-modern d-block text-center">Fuera de Padrón</span>';

      const rowClass = a.fueraDePadron ? 'alumno-row fuera-padron' : 'alumno-row';
      const isFueraPadronAttr = a.fueraDePadron ? 'true' : 'false';

      html += `
        <tr class="${rowClass}" data-fuerapadron="${isFueraPadronAttr}">
          <td class="dni-cell font-weight-bold" style="color: #475569;">${a.dni}</td>
          <td class="nombre-cell font-weight-600">${nombreCompleto}</td>
          <td data-curso="${a.curso}" style="color: #64748b;">${nombreCurso}</td>
          <td>${a.email}</td>
          <td>${etiquetas}</td>
          <td style="color: #64748b; font-size: 0.9rem;">${a.fechaConfirmacion || '-'}</td>
          <td class="text-center">
            <button class="btn btn-delete" onclick="eliminarAlumno('${a.dni}')" title="Eliminar Alumno">🗑️</button>
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
                btnFueraPadron.classList.replace('btn-yellow', 'btn-danger-filtro');
                btnFueraPadron.innerHTML = "Quitar Filtro Padrón";
              } else {
                btnFueraPadron.classList.replace('btn-danger-filtro', 'btn-yellow');
                btnFueraPadron.innerHTML = "Ver Fuera de Padrón";
              }
              filtrarTabla();
            });

            searchInput.addEventListener('keyup', filtrarTabla);
            cursoFilter.addEventListener('change', filtrarTabla);

            async function eliminarAlumno(dni) {
              const confirmacion = await Swal.fire({ title: '¿Eliminar registro?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar' });
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


// --- NUEVO PANEL: FALTANTES CON ESTILO MODERNO ---
router.get('/faltantes/html', async (req, res) => {
    try {
      const padronCompleto = await Padron.find({});
      const confirmados = await Alumno.find({ confirmado: true });
      const dnisConfirmados = confirmados.map(a => a.dni);
      const faltantes = padronCompleto.filter(p => !dnisConfirmados.includes(p.dni));
  
      let html = `
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Panel de Faltantes</title>
            <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" />
            
            <style>
              body { font-family: 'Nunito', sans-serif; background-color: #f8fafc; color: #1e293b; }
              .title-panel { font-weight: 800; color: #e11d48; }
              .form-control { border-radius: 50px; border: 1.5px solid #e2e8f0; padding: 0.6rem 1.2rem; transition: all 0.3s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.02); }
              .form-control:focus { border-color: #e11d48; box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.15); }
              
              .btn-custom { border-radius: 50px; font-weight: 700; padding: 0.65rem 1.8rem; border: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08); }
              .btn-custom:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
              .btn-secondary-custom { background-color: #64748b; color: white !important; }
              .btn-secondary-custom:hover { background-color: #475569; }
              
              .badge-total { border-radius: 50px; background-color: #e11d48; color: white; padding: 0.65rem 1.5rem; font-weight: 800; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(225, 29, 72, 0.15); display: inline-block; }
              .table-container { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
              .table thead th { background-color: #1e293b; color: #f8fafc; font-weight: 700; text-transform: uppercase; font-size: 0.8rem; padding: 1.1rem 1rem; border: none; }
              .table tbody td { padding: 1rem 1rem; vertical-align: middle; border-color: #f1f5f9; font-size: 0.95rem; }
            </style>
          </head>
          <body>
            <div class="container-fluid mt-4 px-lg-5">
              
              <div class="row align-items-center mb-4">
                  <div class="col-md-6 mb-3 mb-md-0">
                      <h1 class="title-panel mb-0">Listado de Faltantes</h1>
                  </div>
                  <div class="col-md-6 text-md-right">
                      <a href="/api/confirmaciones/html" class="btn btn-custom btn-secondary-custom" style="min-width: 190px;">Volver a Confirmados</a>
                  </div>
              </div>
  
              <div class="row align-items-center mb-4">
                <div class="col-md-4 mb-3 mb-md-0">
                  <input type="text" id="searchInput" class="form-control" placeholder="🔍 Buscar por DNI o Nombre...">
                </div>
                <div class="col-md-8 text-md-right">
                   <span class="badge-total">Total Faltantes: <span id="totalCount">${faltantes.length}</span></span>
                </div>
              </div>
  
              <div class="table-responsive table-container">
                <table class="table table-hover mb-0" id="faltantesTable">
                  <thead>
                    <tr>
                      <th>DNI</th>
                      <th>Nombre y Apellido</th>
                      <th>Nivel</th>
                      <th>Curso</th>
                      <th>Email Padre</th>
                      <th>Email Madre</th>
                    </tr>
                  </thead>
                  <tbody>
      `;
  
      faltantes.forEach(f => {
        html += `
          <tr class="faltante-row">
            <td class="font-weight-bold" style="color: #475569;">${f.dni}</td>
            <td class="nombre-cell font-weight-600">${f.nombre}</td>
            <td style="color: #64748b;">${f.nivel}</td>
            <td style="color: #64748b;">${f.curso}</td>
            <td><a href="mailto:${f.emailPadre}" style="color: #3b82f6;">${f.emailPadre}</a></td>
            <td><a href="mailto:${f.emailMadre}" style="color: #3b82f6;">${f.emailMadre}</a></td>
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
              const rows = document.querySelectorAll('.faltante-row');
              const totalCount = document.getElementById('totalCount');
  
              searchInput.addEventListener('keyup', () => {
                const searchTerm = searchInput.value.toLowerCase();
                let visibles = 0;
                rows.forEach(row => {
                  const textContent = row.textContent.toLowerCase();
                  if (textContent.includes(searchTerm)) {
                    row.style.display = "";
                    visibles++;
                  } else {
                    row.style.display = "none";
                  }
                });
                totalCount.textContent = visibles;
              });
            </script>
          </body>
        </html>
      `;
      res.send(html);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al cargar panel de faltantes');
    }
});

module.exports = router;
