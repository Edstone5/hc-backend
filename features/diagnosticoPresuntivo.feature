# language: es
Característica: Diagnóstico Presuntivo
  Como personal de salud
  Quiero registrar el diagnóstico presuntivo de una historia clínica
  Para documentar la impresión clínica inicial del paciente

  Escenario: Actualizar diagnóstico presuntivo con descripción (Camino Feliz)
    Dados los datos del diagnóstico presuntivo:
      | idHistory                            | descripcion               | idUsuario                            |
      | 550e8400-e29b-41d4-a716-446655440000 | Caries dental profunda    | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se actualiza el diagnóstico presuntivo
    Entonces la operación de diagnóstico presuntivo debe ser exitosa con el mensaje "Diagnóstico presuntivo guardado correctamente"

  Escenario: Actualizar diagnóstico presuntivo con descripción vacía (normalización → null)
    Dados los datos del diagnóstico presuntivo:
      | idHistory                            | descripcion | idUsuario                            |
      | 550e8400-e29b-41d4-a716-446655440001 |             | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se actualiza el diagnóstico presuntivo
    Entonces la operación de diagnóstico presuntivo debe ser exitosa con el mensaje "Diagnóstico presuntivo guardado correctamente"
    Y la descripción del diagnóstico presuntivo debe ser nula

  Escenario: Actualizar diagnóstico con prefijo HC- en idHistory (normalización)
    Dados los datos del diagnóstico presuntivo:
      | idHistory                                | descripcion  | idUsuario                            |
      | HC-550e8400-e29b-41d4-a716-446655440002  | Gingivitis   | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se actualiza el diagnóstico presuntivo
    Entonces la operación de diagnóstico presuntivo debe ser exitosa con el mensaje "Diagnóstico presuntivo guardado correctamente"

  Escenario: Error al actualizar con idHistory inválido
    Dados los datos del diagnóstico presuntivo:
      | idHistory     | descripcion | idUsuario                            |
      | no-es-un-uuid | Caries      | 660f9500-f39c-41d4-b827-557766551111 |
    Cuando se intenta actualizar el diagnóstico presuntivo
    Entonces se debe lanzar un error de diagnóstico presuntivo con el mensaje "id_historia inválido"

  Escenario: Error al actualizar con idUsuario inválido
    Dados los datos del diagnóstico presuntivo:
      | idHistory                            | descripcion | idUsuario |
      | 550e8400-e29b-41d4-a716-446655440003 | Caries      | bad-uuid  |
    Cuando se intenta actualizar el diagnóstico presuntivo
    Entonces se debe lanzar un error de diagnóstico presuntivo con el mensaje "idUsuario inválido"
