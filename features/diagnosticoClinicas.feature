# language: es
Característica: Diagnóstico de Clínicas Especializadas
  Como personal de salud
  Quiero registrar los diagnósticos emitidos por las clínicas de referencia
  Para documentar los resultados de derivaciones e interconsultas

  Escenario: Registrar diagnóstico clínico completo (Camino Feliz)
    Dado los datos del diagnóstico de clínicas:
      | idHistory                            | clinicaRespuesta | diagnosticoDefinitivo  | idUsuario                            |
      | 550e8400-e29b-41d4-a716-446655440000 | Ortodoncia       | Maloclusión clase II   | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se registra el diagnóstico de clínicas
    Entonces la operación de diagnóstico clínico debe ser exitosa con el mensaje "Diagnóstico clínico guardado correctamente"

  Escenario: Registrar diagnóstico con campos vacíos (normalización → null)
    Dado los datos del diagnóstico de clínicas:
      | idHistory                            | clinicaRespuesta | idUsuario                            |
      | 550e8400-e29b-41d4-a716-446655440001 |                  | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se registra el diagnóstico de clínicas
    Entonces la operación de diagnóstico clínico debe ser exitosa con el mensaje "Diagnóstico clínico guardado correctamente"
    Y los campos opcionales del diagnóstico clínico deben ser nulos

  Escenario: Prefijo HC- en idHistory se normaliza correctamente
    Dado los datos del diagnóstico de clínicas:
      | idHistory                                | clinicaRespuesta | idUsuario                            |
      | HC-550e8400-e29b-41d4-a716-446655440002  | Periodoncia      | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se registra el diagnóstico de clínicas
    Entonces la operación de diagnóstico clínico debe ser exitosa con el mensaje "Diagnóstico clínico guardado correctamente"

  Escenario: Error al registrar con idHistory inválido
    Dado los datos del diagnóstico de clínicas:
      | idHistory     | idUsuario                            |
      | no-es-un-uuid | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se intenta registrar el diagnóstico de clínicas
    Entonces se debe lanzar un error de diagnóstico clínico con el mensaje "id_historia inválido"

  Escenario: Error al registrar con fecha de respuesta inválida
    Dado los datos del diagnóstico de clínicas:
      | idHistory                            | fechaRespuesta | idUsuario                            |
      | 550e8400-e29b-41d4-a716-446655440003 | no-es-fecha    | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se intenta registrar el diagnóstico de clínicas
    Entonces se debe lanzar un error de diagnóstico clínico con el mensaje "fecha inválida"
