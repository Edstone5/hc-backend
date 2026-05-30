# Glosario de Lenguaje Ubicuo

## controllers/catologo/catalogoControllers.js

| Vocabulario Técnico Anterior       | Vocabulario de Negocio Actual         | Impacto en el Diseño                                                                                         |
| ---------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `getCatalogo`                      | `consultarCatalogoMaestro`            | El nuevo nombre expresa que la operación consulta un catálogo maestro de dominio, no una obtención genérica. |
| `getCatalogoNombrePorId`           | `consultarNombreCatalogoPorIdMaestro` | Describe con precisión que se recupera un nombre de catálogo por su identificador.                           |
| `getCatalogoController`            | `consultarCatalogo`                   | El verbo "consultar" refleja mejor la acción funcional en un sistema clínico que "get".                      |
| `getCatalogoNombrePorIdController` | `consultarNombreDeCatalogoPorId`      | El nombre nuevo comunica la intención de negocio sin ambigüedad técnica.                                     |
| `nombre`                           | `nombreCatalogo`                      | El parámetro deja de ser genérico y pasa a referirse explícitamente al catálogo consultado.                  |
| `id`                               | `identificadorCatalogo`               | El nombre aclara que el valor corresponde al identificador del elemento de catálogo.                         |
| `result`                           | `catalogoConsultado`                  | La variable representa de forma directa el catálogo recuperado, mejorando legibilidad del flujo de negocio.  |
| `nombreCatalogo`                   | `nombreEncontrado`                    | Diferencia el nombre buscado dentro del catálogo del nombre del catálogo mismo.                              |

## controllers/hc/anamnesis/antecedenteController.js

| Vocabulario Técnico Anterior    | Vocabulario de Negocio Actual                   | Impacto en el Diseño                                                                                    |
| ------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `AntecedenteCumplimiento`       | `SeguimientoTratamiento`                        | El término nuevo describe mejor la intención clínica de evaluar adherencia y evolución del tratamiento. |
| `AntecedenteFamiliar`           | `AntecedentesHeredoFamiliares`                  | Refleja el concepto clínico estándar para antecedentes familiares con peso hereditario.                 |
| `AntecedentePersonal`           | `AntecedentesPersonalesNoPatologicos`           | Precisa que se trata de hábitos y condiciones no patológicas del paciente.                              |
| `AntecedenteMedico`             | `AntecedentesPersonalesPatologicos`             | Alinea el nombre con el registro de enfermedades y condiciones previas relevantes.                      |
| `createAntecedenteCumplimiento` | `registrarSeguimientoTratamiento`               | El verbo "registrar" y el sustantivo "seguimiento" comunican una acción clínica formal.                 |
| `getAntecedenteCumplimiento`    | `consultarSeguimientoTratamiento`               | El nuevo nombre expresa revisión de información clínica, no acceso técnico a datos.                     |
| `updateAntecedenteCumplimiento` | `actualizarSeguimientoTratamiento`              | Conserva la intención de mantenimiento del dato, pero sobre un concepto clínico real.                   |
| `createAntecedenteFamiliar`     | `registrarAntecedentesHeredoFamiliares`         | Cambia una etiqueta genérica por el concepto clínico que usan los profesionales.                        |
| `getAntecedenteFamiliar`        | `consultarAntecedentesHeredoFamiliares`         | El nombre nuevo reduce ambigüedad y mejora la trazabilidad semántica.                                   |
| `updateAntecedenteFamiliar`     | `actualizarAntecedentesHeredoFamiliares`        | Describe con precisión el mantenimiento de un bloque específico de anamnesis.                           |
| `createAntecedentePersonal`     | `registrarAntecedentesPersonalesNoPatologicos`  | Explicita que el registro corresponde a antecedentes personales no patológicos.                         |
| `getAntecedentePersonal`        | `consultarAntecedentesPersonalesNoPatologicos`  | El verbo y el sustantivo acercan el código al lenguaje del acto clínico.                                |
| `updateAntecedentePersonal`     | `actualizarAntecedentesPersonalesNoPatologicos` | Facilita entender que se modifica un conjunto clínico concreto y no un objeto genérico.                 |
| `createAntecedenteMedico`       | `registrarAntecedentesPersonalesPatologicos`    | El nuevo nombre se ajusta a la clasificación clínica habitual de antecedentes patológicos.              |
| `getAntecedenteMedico`          | `consultarAntecedentesPersonalesPatologicos`    | La lectura del código ahora expresa claramente la consulta de antecedentes patológicos.                 |
| `updateAntecedenteMedico`       | `actualizarAntecedentesPersonalesPatologicos`   | Mantiene coherencia semántica con el resto del módulo de anamnesis.                                     |
| `id_historia`                   | `historiaClinicaId`                             | El identificador deja de ser una abreviatura de tabla y pasa a nombrar el concepto de dominio.          |
| `ok`                            | `seguimientoRegistrado`                         | La variable refleja el resultado real de negocio en lugar de una bandera técnica opaca.                 |
| `result`                        | `seguimientoTratamiento`                        | El nombre comunica exactamente qué bloque de la anamnesis fue recuperado.                               |
| `result`                        | `antecedentesHeredoFamiliares`                  | La variable ya no es genérica y se asocia al bloque clínico correspondiente.                            |
| `result`                        | `antecedentesPersonalesNoPatologicos`           | Mejora la claridad al expresar el contenido clínico de la consulta.                                     |
| `result`                        | `antecedentesPersonalesPatologicos`             | Hace explícito el tipo de antecedentes que se están manipulando.                                        |

## controllers/hc/anamnesis/enfermedadActualController.js

| Vocabulario Técnico Anterior | Vocabulario de Negocio Actual  | Impacto en el Diseño                                                                                   |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `enfermedadActualService`    | `padecimientoActualService`    | El nuevo nombre se ajusta al lenguaje clínico usado para describir el problema actual del paciente.    |
| `createEnfermedadActual`     | `registrarPadecimientoActual`  | "Registrar" y "padecimiento" reflejan mejor la intención clínica que "create" y "enfermedad" genérica. |
| `getEnfermedadActual`        | `consultarPadecimientoActual`  | La consulta se expresa con un verbo propio del dominio y no con jerga técnica.                         |
| `updateEnfermedadActual`     | `actualizarPadecimientoActual` | Mantiene la intención de edición, pero nombrando el concepto clínico real.                             |
| `id_historia`                | `historiaClinicaId`            | El parámetro deja de parecer una columna técnica y se vuelve un identificador de negocio.              |
| `result`                     | `padecimientoRegistrado`       | La variable describe exactamente qué se obtuvo tras el alta del registro.                              |
| `result`                     | `padecimientoActual`           | El nombre deja claro que se está leyendo el problema actual del paciente.                              |
| `enfermedad`                 | `padecimientoActual`           | La variable usa un término más cercano a la narrativa clínica cotidiana.                               |

## controllers/hc/anamnesis/filiacionController.js

| Vocabulario Técnico Anterior | Vocabulario de Negocio Actual       | Impacto en el Diseño                                                                               |
| ---------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `filiacionService`           | `datosPersonalesPacienteService`    | El nuevo nombre comunica que se trabajan datos filiatorios del paciente, no una abstracción de BD. |
| `createFiliacion`            | `registrarDatosPersonalesPaciente`  | Expresa el acto clínico de registrar la ficha del paciente.                                        |
| `getFiliacion`               | `consultarDatosPersonalesPaciente`  | La consulta se nombra según el contenido clínico que devuelve.                                     |
| `updateFiliacion`            | `actualizarDatosPersonalesPaciente` | El mantenimiento del registro queda ligado al concepto de filiación.                               |
| `id_historia`                | `historiaClinicaId`                 | El identificador pasa a representar la historia clínica del paciente.                              |
| `ok`                         | `datosRegistrados`                  | La bandera técnica se reemplaza por un nombre que explica el resultado de negocio.                 |
| `result`                     | `datosPersonalesPaciente`           | La variable indica con claridad qué información se está leyendo.                                   |

## controllers/hc/anamnesis/motivoConsultaController.js

| Vocabulario Técnico Anterior | Vocabulario de Negocio Actual | Impacto en el Diseño                                                          |
| ---------------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `motivoConsultaService`      | `motivoAtencionService`       | El servicio deja de sonar técnico y se acerca al lenguaje del acto clínico.   |
| `createMotivoConsulta`       | `registrarMotivoConsulta`     | El verbo "registrar" encaja con el flujo asistencial de apertura de consulta. |
| `getMotivoConsulta`          | `consultarMotivoConsulta`     | El nombre describe con precisión la lectura del motivo clínico.               |
| `updateMotivoConsulta`       | `actualizarMotivoConsulta`    | Mantiene coherencia con el lenguaje ubicuo del módulo.                        |
| `id_historia`                | `historiaClinicaId`           | El identificador se alinea con el concepto de historia clínica.               |
| `result`                     | `motivoConsulta`              | La variable deja de ser genérica y refleja el contenido clínico.              |
| `motivo`                     | `motivoConsulta`              | El nombre aclara que la variable representa el motivo de consulta completo.   |

## controllers/hc/examenFisico/examenGeneralController.js

| Vocabulario Técnico Anterior | Vocabulario de Negocio Actual   | Impacto en el Diseño                                                             |
| ---------------------------- | ------------------------------- | -------------------------------------------------------------------------------- |
| `examenGeneralService`       | `examenFisicoGeneralService`    | El nombre nuevo diferencia el examen físico general dentro del contexto clínico. |
| `createExamenGeneral`        | `registrarExamenFisicoGeneral`  | El verbo y el sustantivo expresan la acción clínica real con mayor claridad.     |
| `getExamenGeneral`           | `consultarExamenFisicoGeneral`  | La consulta se nombra según la sección clínica que representa.                   |
| `updateExamenGeneral`        | `actualizarExamenFisicoGeneral` | Aporta precisión semántica sobre el bloque del examen que se mantiene.           |
| `id_historia`                | `historiaClinicaId`             | El identificador deja de ser un sufijo técnico.                                  |
| `result`                     | `examenGeneralRegistrado`       | Indica explícitamente el resultado del alta del examen.                          |
| `examen`                     | `examenFisicoGeneral`           | La variable deja de ser ambigua y apunta al bloque clínico exacto.               |

## controllers/hc/examenFisico/examenRegionalController.js

| Vocabulario Técnico Anterior | Vocabulario de Negocio Actual    | Impacto en el Diseño                                              |
| ---------------------------- | -------------------------------- | ----------------------------------------------------------------- |
| `examenRegionalService`      | `examenFisicoRegionalService`    | El nombre nuevo sitúa el examen en el contexto físico regional.   |
| `createExamenRegional`       | `registrarExamenFisicoRegional`  | Refuerza el vocabulario clínico y la intención de registro.       |
| `getExamenRegional`          | `consultarExamenFisicoRegional`  | Hace explícita la revisión de una sección del examen físico.      |
| `updateExamenRegional`       | `actualizarExamenFisicoRegional` | Mantiene el concepto clínico correcto al modificar el dato.       |
| `id_historia`                | `historiaClinicaId`              | El nombre deja de parecer un detalle de esquema y pasa a dominio. |
| `result`                     | `examenRegionalRegistrado`       | La variable refleja exactamente qué se creó.                      |
| `examen`                     | `examenFisicoRegional`           | La variable se vuelve autoexplicativa para el equipo clínico.     |

## controllers/hc/hcController/listaHcAdultos.js

| Vocabulario Técnico Anterior | Vocabulario de Negocio Actual                 | Impacto en el Diseño                                                                |
| ---------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------- |
| `getAdultHistoriasByStudent` | `obtenerHistoriasClinicasAdultoPorEstudiante` | El nombre nuevo describe la relación clínica y académica sin abreviaturas técnicas. |
| `listaHcAdultos`             | `listarHistoriasClinicasAdultoPorEstudiante`  | El verbo "listar" comunica que se devuelve un conjunto de historias clínicas.       |
| `id`                         | `estudianteId`                                | El parámetro identifica explícitamente al estudiante.                               |
| `historias`                  | `historiasClinicasAdulto`                     | La variable deja claro que son historias clínicas de pacientes adultos.             |

## controllers/users/studentUsersController.js

| Vocabulario Técnico Anterior | Vocabulario de Negocio Actual | Impacto en el Diseño                                                        |
| ---------------------------- | ----------------------------- | --------------------------------------------------------------------------- |
| `getAllStudentUsers`         | `listarUsuariosEstudiantes`   | El verbo "listar" expresa la intención de negocio mejor que "getAll".       |
| `result`                     | `usuariosEstudiantes`         | La variable comunica con claridad el conjunto obtenido de la base de datos. |

## controllers/patients/patientController.js

| Vocabulario Técnico Anterior | Vocabulario de Negocio Actual | Impacto en el Diseño                                                                                          |
| ---------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `PatientController`          | `ControladorPaciente`         | El nombre de la clase se alinea con el lenguaje del equipo clínico y elimina la convención técnica en inglés. |
| `createPatient`              | `registrarPaciente`           | "Registrar" expresa el alta formal del paciente en la clínica.                                                |
| `updatePatient`              | `actualizarPaciente`          | El nuevo verbo mantiene la intención de mantenimiento, pero sobre un concepto clínico claro.                  |
| `nombre`                     | `nombrePaciente`              | El parámetro deja explícito que corresponde al paciente.                                                      |
| `apellido`                   | `apellidoPaciente`            | El nombre evita ambigüedad al referirse al paciente.                                                          |
| `dni`                        | `documentoIdentidad`          | El término nuevo es más legible para el dominio humano que la sigla técnica.                                  |
| `email`                      | `correoElectronico`           | La variable adopta una nomenclatura más descriptiva y cercana al negocio.                                     |
| `id`                         | `pacienteId`                  | El identificador se liga directamente al sujeto clínico.                                                      |
| `result`                     | `pacienteRegistrado`          | La variable comunica exactamente el resultado del alta.                                                       |

## controllers/students/studentController.js

| Vocabulario Técnico Anterior  | Vocabulario de Negocio Actual            | Impacto en el Diseño                                                       |
| ----------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- |
| `StudentController`           | `ControladorEstudiante`                  | La clase deja de depender de inglés técnico y usa el rol académico real.   |
| `getAdultPatientsByStudentId` | `consultarPacientesAdultosPorEstudiante` | El nuevo nombre expresa la relación clínica y académica de forma completa. |
| `registerPatient`             | `registrarPacienteEnEstudiante`          | El nombre muestra que el registro queda asociado al estudiante.            |
| `id`                          | `estudianteId`                           | El parámetro identifica explícitamente al estudiante.                      |
| `studentId`                   | `estudianteId`                           | Se unifica el vocabulario para evitar dobles nombres técnicos.             |
| `patients`                    | `pacientesAdultos`                       | La variable describe el conjunto clínico recuperado.                       |
| `newPatient`                  | `pacienteRegistrado`                     | El nombre explica el resultado de la operación de alta.                    |

## controllers/users/authController.js

| Vocabulario Técnico Anterior | Vocabulario de Negocio Actual | Impacto en el Diseño                                                             |
| ---------------------------- | ----------------------------- | -------------------------------------------------------------------------------- |
| `AuthController`             | `ControladorAutenticacion`    | La clase comunica su propósito de negocio en vez de usar una etiqueta abstracta. |
| `login`                      | `iniciarSesion`               | El verbo se alinea con el lenguaje común de acceso al sistema.                   |
| `getCurrentUser`             | `obtenerUsuarioActual`        | El nuevo nombre expresa de forma explícita la intención funcional.               |
| `logout`                     | `cerrarSesion`                | El verbo es más natural y consistente con el lenguaje del usuario final.         |
| `userCode`                   | `codigoUsuario`               | El nombre aclara que se trata del código del usuario clínico.                    |
| `password`                   | `contrasena`                  | La variable usa la forma española habitual en el dominio.                        |
| `user`                       | `usuario`                     | El término en español mejora la lectura de negocio.                              |
| `token`                      | `tokenAutenticacion`          | La variable indica el propósito del valor generado.                              |

## controllers/users/userController.js

| Vocabulario Técnico Anterior | Vocabulario de Negocio Actual | Impacto en el Diseño                                                   |
| ---------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `UserController`             | `ControladorUsuarios`         | La clase usa un nombre explícito y consistente con el lenguaje ubicuo. |
| `getAll`                     | `listarUsuarios`              | El verbo describe mejor la acción real sobre la colección de usuarios. |
| `register`                   | `registrarUsuario`            | El nuevo nombre expresa el alta de un usuario en el sistema.           |
| `login`                      | `iniciarSesion`               | El cambio acerca el método al vocabulario del usuario final.           |
| `getUserById`                | `obtenerUsuarioPorId`         | El método deja clara la consulta puntual de un usuario.                |
| `validatePasswd`             | `validarContrasena`           | El nombre en español hace legible la intención de validación.          |
| `userCode`                   | `codigoUsuario`               | El identificador se expresa con claridad de negocio.                   |
| `firstName`                  | `nombre`                      | Se elimina la convención en inglés y se usa vocabulario del dominio.   |
| `lastName`                   | `apellido`                    | El nombre queda alineado con la nomenclatura clínica habitual.         |
| `dni`                        | `documentoIdentidad`          | La variable abandona la abreviatura y se vuelve autoexplicativa.       |
| `email`                      | `correoElectronico`           | El cambio mejora la semántica del dato de contacto.                    |
| `role`                       | `rol`                         | El nombre usa español y coincide con el lenguaje organizacional.       |
| `password`                   | `contrasena`                  | La contraseña se nombra con la grafía usada por el equipo de negocio.  |
| `result`                     | `resultadoValidacion`         | El nombre comunica el resultado de negocio de la validación.           |
| `newUser`                    | `usuarioRegistrado`           | La variable indica con precisión el usuario creado.                    |
| `user`                       | `usuario`                     | El nombre se adapta al lenguaje del dominio.                           |
| `token`                      | `tokenAutenticacion`          | La variable explica su propósito dentro del flujo de inicio de sesión. |
| `id`                         | `usuarioId`                   | El identificador queda asociado claramente al usuario.                 |

## controllers/hc/hcController.js

| Vocabulario Técnico Anterior  | Vocabulario de Negocio Actual             | Impacto en el Diseño                                                                         |
| ----------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `HcController`                | `ControladorHistoriaClinica`              | La clase deja de usar una sigla técnica y adopta el nombre del concepto central del dominio. |
| `createReview`                | `registrarRevisionHistoriaClinica`        | El nuevo nombre comunica que se registra una revisión formal de la historia clínica.         |
| `getAllByStudentId`           | `consultarHistoriasClinicasPorEstudiante` | Expresa con claridad la relación entre historias clínicas y estudiante asignado.             |
| `getFiliationByIdHistory`     | `consultarFiliacionPorHistoriaClinica`    | El nombre describe el contenido clínico recuperado y no solo la operación técnica.           |
| `registerHc`                  | `registrarHistoriaClinica`                | El registro se nombra como el alta real de una historia clínica.                             |
| `createDraft`                 | `crearBorradorHistoriaClinica`            | El término "borrador" queda ligado explícitamente a la historia clínica.                     |
| `assignPatient`               | `asignarPacienteAHistoriaClinica`         | El nombre comunica la asignación asistencial de un paciente a su historia.                   |
| `getPatientByHistory`         | `consultarPacientePorHistoriaClinica`     | La consulta se expresa en términos clínicos y no de base de datos.                           |
| `updateFiliation`             | `actualizarFiliacionHistoriaClinica`      | El nombre deja claro qué bloque de la historia se mantiene.                                  |
| `getGeneralExam`              | `consultarExamenFisicoGeneral`            | El bloque del examen físico general queda explícito en el código.                            |
| `updateGeneralExam`           | `actualizarExamenFisicoGeneral`           | La intención de edición se asocia al examen físico general.                                  |
| `getRegionalExam`             | `consultarExamenFisicoRegional`           | El nuevo nombre diferencia la sección regional del examen físico.                            |
| `updateRegionalExam`          | `actualizarExamenFisicoRegional`          | Refuerza el alcance clínico del cambio de datos.                                             |
| `getExamBoca`                 | `consultarExamenBucal`                    | El término "bucal" es más natural para el entorno odontológico.                              |
| `updateExamBoca`              | `actualizarExamenBucal`                   | La actualización queda alineada con el vocabulario odontológico.                             |
| `getHigieneOral`              | `consultarHigieneOral`                    | Se expresa la revisión del estado de higiene oral en términos clínicos.                      |
| `updateHigieneOral`           | `actualizarHigieneOral`                   | Mantiene el concepto de seguimiento de higiene oral.                                         |
| `getDiagnosticoPresuntivo`    | `consultarDiagnosticoPresuntivo`          | La consulta se nombra con el lenguaje médico habitual.                                       |
| `updateDiagnosticoPresuntivo` | `actualizarDiagnosticoPresuntivo`         | Conserva la intención clínica del diagnóstico presuntivo.                                    |
| `getDerivacion`               | `consultarDerivacion`                     | El nombre aclara que se revisa la sección de derivación.                                     |
| `updateDerivacion`            | `actualizarDerivacion`                    | La acción se alinea con el flujo clínico de referencia o interconsulta.                      |
| `getDiagnosticoClinicas`      | `consultarDiagnosticoClinico`             | El nuevo nombre corrige la forma plural y deja un concepto clínico claro.                    |
| `updateDiagnosticoClinicas`   | `actualizarDiagnosticoClinico`            | La actualización se asocia a una sola sección clínica bien definida.                         |
| `getEvolucion`                | `consultarEvolucion`                      | El término expresa seguimiento evolutivo del caso clínico.                                   |
| `addEvolucion`                | `registrarEvolucion`                      | El verbo "registrar" refleja el acto clínico de documentar la evolución.                     |
| `idHistory`                   | `historiaClinicaId`                       | El parámetro queda ligado al concepto de historia clínica.                                   |
| `idStudent`                   | `estudianteId`                            | El nombre se expresa en español y elimina ambigüedad.                                        |
| `idTeacher`                   | `docenteId`                               | El rol queda claramente identificado dentro del flujo académico-clínico.                     |
| `idPatient`                   | `pacienteId`                              | El identificador pasa a representar al paciente en la historia.                              |
| `estadoHigiene`               | `estadoHigiene`                           | Se conserva porque ya es un término clínico claro y entendible.                              |
| `idUsuario`                   | `usuarioId`                               | El identificador del usuario autenticado se nombra con más claridad.                         |
| `historias`                   | `historiasClinicas`                       | La variable comunica directamente el tipo de registros devueltos.                            |
| `patient`                     | `paciente`                                | El nombre se traduce al dominio en español.                                                  |
| `list`                        | `evoluciones`                             | La variable deja de ser genérica y expresa el contenido clínico devuelto.                    |
| `data`                        | `datosExamen`                             | El nombre aclara que se está trabajando con datos del examen físico.                         |
