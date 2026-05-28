# language: es
Característica: Gestión de Higiene Bucal
  Como personal de salud
  Quiero actualizar y consultar el examen de higiene bucal de una historia clínica
  Para registrar el estado de higiene oral del paciente con validación del profesional responsable

  Escenario: Actualizar higiene bucal con estado válido y usuario válido (Camino Feliz)
    Dados los datos de higiene bucal:
      | id_historia                          | estado_higiene | id_usuario                           |
      | 550e8400-e29b-41d4-a716-446655445000 | Bueno          | 660e8400-e29b-41d4-a716-446655445000 |
    Cuando se actualiza la higiene bucal
    Entonces la operación de higiene bucal debe ser exitosa con el mensaje "Higiene bucal guardada correctamente"
    Y la higiene bucal debe existir en el repositorio para la historia clínica "550e8400-e29b-41d4-a716-446655445000"

  Escenario: Consultar higiene bucal existente (Camino Feliz)
    Dado existe higiene bucal para la historia clínica "550e8400-e29b-41d4-a716-446655445001" con estado "Regular" y usuario "660e8400-e29b-41d4-a716-446655445001"
    Cuando se consulta la higiene bucal de la historia clínica "550e8400-e29b-41d4-a716-446655445001"
    Entonces la consulta de higiene bucal debe retornar el registro correctamente

  Escenario: Prefijo HC- en id_historia es normalizado automáticamente (comportamiento especial de IdHistoriaValueObject)
    Dados los datos de higiene bucal:
      | id_historia                                   | estado_higiene | id_usuario                           |
      | HC-550e8400-e29b-41d4-a716-446655445002       | Aceptable      | 660e8400-e29b-41d4-a716-446655445002 |
    Cuando se actualiza la higiene bucal
    Entonces la operación de higiene bucal debe ser exitosa con el mensaje "Higiene bucal guardada correctamente"
    Y la higiene bucal debe existir en el repositorio para la historia clínica "550e8400-e29b-41d4-a716-446655445002"

  Escenario: Error por estado de higiene vacío (Ruta de Error — EstadoHigieneValueObject)
    Dados los datos de higiene bucal:
      | id_historia                          | estado_higiene | id_usuario                           |
      | 550e8400-e29b-41d4-a716-446655445003 |                | 660e8400-e29b-41d4-a716-446655445003 |
    Cuando se intenta actualizar la higiene bucal
    Entonces se debe lanzar un error de higiene bucal con el mensaje "estadoHigiene inválido: no puede estar vacío"
    Y no debe existir higiene bucal para la historia clínica "550e8400-e29b-41d4-a716-446655445003"

  Escenario: Error por UUID de usuario inválido (Ruta de Error — validación de idUsuario)
    Dados los datos de higiene bucal:
      | id_historia                          | estado_higiene | id_usuario    |
      | 550e8400-e29b-41d4-a716-446655445004 | Bueno          | no-es-un-uuid |
    Cuando se intenta actualizar la higiene bucal
    Entonces se debe lanzar un error de higiene bucal con el mensaje "idUsuario inválido: formato UUIDv4 esperado"
    Y no debe existir higiene bucal para la historia clínica "550e8400-e29b-41d4-a716-446655445004"
