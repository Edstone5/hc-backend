# language: es
Característica: Registro de Evolución Clínica
  Como personal de salud
  Quiero registrar las evoluciones clínicas de un paciente
  Para llevar seguimiento de las actividades realizadas en cada visita

  Escenario: Registrar una evolución con todos los campos (Camino Feliz)
    Dados los datos de evolución:
      | idHistory                            | fecha      | actividad          | alumno        | idUsuario                            |
      | 550e8400-e29b-41d4-a716-446655440000 | 2024-06-15 | Extracción dental  | María García  | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se registra la evolución clínica
    Entonces la operación de evolución debe ser exitosa con el mensaje "Evolución registrada correctamente"

  Escenario: Registrar una evolución sin fecha (campo opcional → null)
    Dados los datos de evolución:
      | idHistory                            | actividad   | idUsuario                            |
      | 550e8400-e29b-41d4-a716-446655440001 | Obturación  | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se registra la evolución clínica
    Entonces la operación de evolución debe ser exitosa con el mensaje "Evolución registrada correctamente"
    Y el parámetro de fecha de la evolución debe ser nulo

  Escenario: Registrar evolución con prefijo HC- en idHistory (normalización)
    Dados los datos de evolución:
      | idHistory                                | actividad     | idUsuario                            |
      | HC-550e8400-e29b-41d4-a716-446655440002  | Extracción    | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se registra la evolución clínica
    Entonces la operación de evolución debe ser exitosa con el mensaje "Evolución registrada correctamente"

  Escenario: Error al registrar evolución con idHistory inválido
    Dados los datos de evolución:
      | idHistory     | actividad  | idUsuario                            |
      | no-es-un-uuid | Limpieza   | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se intenta registrar la evolución clínica
    Entonces se debe lanzar un error de evolución con el mensaje "id_historia inválido"

  Escenario: Error al registrar evolución con idUsuario inválido
    Dados los datos de evolución:
      | idHistory                            | actividad | idUsuario |
      | 550e8400-e29b-41d4-a716-446655440003 | Limpieza  | bad-uuid  |
    Cuando se intenta registrar la evolución clínica
    Entonces se debe lanzar un error de evolución con el mensaje "idUsuario inválido"
