# language: es
Característica: Derivación a Clínicas Especializadas
  Como personal de salud
  Quiero registrar derivaciones a otras clínicas
  Para coordinar la atención especializada del paciente

  Escenario: Registrar derivación con todos los campos (Camino Feliz)
    Dados los datos de derivación a clínicas:
      | idHistory                            | destinos              | observaciones          | alumno        | docente        | idUsuario                            |
      | 550e8400-e29b-41d4-a716-446655440000 | {"cirugia":true}      | Derivar con urgencia   | Pedro López   | Dr. Martínez   | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se registra la derivación a clínicas
    Entonces la operación de derivación debe ser exitosa con el mensaje "Derivación guardada correctamente"

  Escenario: Registrar derivación con destinos vacíos (normalización → {})
    Dados los datos de derivación a clínicas:
      | idHistory                            | destinos | idUsuario                            |
      | 550e8400-e29b-41d4-a716-446655440001 |          | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se registra la derivación a clínicas
    Entonces la operación de derivación debe ser exitosa con el mensaje "Derivación guardada correctamente"

  Escenario: Campos opcionales vacíos se normalizan a null
    Dados los datos de derivación a clínicas:
      | idHistory                            | observaciones | idUsuario                            |
      | 550e8400-e29b-41d4-a716-446655440002 |               | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se registra la derivación a clínicas
    Entonces la operación de derivación debe ser exitosa con el mensaje "Derivación guardada correctamente"
    Y las observaciones de la derivación deben ser nulas

  Escenario: Error al registrar con idHistory inválido
    Dados los datos de derivación a clínicas:
      | idHistory     | idUsuario                            |
      | no-es-un-uuid | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se intenta registrar la derivación a clínicas
    Entonces se debe lanzar un error de derivación con el mensaje "id_historia inválido"

  Escenario: Error al registrar con destinos JSON inválido
    Dados los datos de derivación a clínicas:
      | idHistory                            | destinos          | idUsuario                            |
      | 550e8400-e29b-41d4-a716-446655440003 | {esto no es json} | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se intenta registrar la derivación a clínicas
    Entonces se debe lanzar un error de derivación con el mensaje "destinos inválidos"
