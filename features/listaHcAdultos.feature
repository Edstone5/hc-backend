# language: es
Característica: Lista de Historias Clínicas de Adultos
  Como personal del sistema
  Quiero consultar las historias clínicas adultas de un estudiante
  Para ver el trabajo clínico asignado a cada alumno

  Escenario: Consultar HCs adultos con ID de estudiante válido (Camino Feliz)
    Dado el ID del estudiante para consultar sus HCs:
      | idEstudiante                         |
      | 550e8400-e29b-41d4-a716-446655440000 |
    Cuando se consultan las HCs adultas del estudiante
    Entonces la operación de lista HC adultos debe ser exitosa con el mensaje "Historias clínicas adultas consultadas correctamente"

  Escenario: Error al consultar con ID de estudiante inválido
    Dado el ID del estudiante para consultar sus HCs:
      | idEstudiante  |
      | no-es-un-uuid |
    Cuando se intenta consultar las HCs adultas del estudiante
    Entonces se debe lanzar un error de lista HC adultos con el mensaje "ID de estudiante inválido. Debe ser un UUID v4."

  Escenario: Error al consultar con ID vacío
    Dado el ID del estudiante para consultar sus HCs:
      | idEstudiante |
      |              |
    Cuando se intenta consultar las HCs adultas del estudiante
    Entonces se debe lanzar un error de lista HC adultos con el mensaje "ID de estudiante inválido. Debe ser un UUID v4."

  Escenario: UUID con carácter extra rechazado (anclas de regex)
    Dado el ID del estudiante para consultar sus HCs:
      | idEstudiante                           |
      | x550e8400-e29b-41d4-a716-446655440000  |
    Cuando se intenta consultar las HCs adultas del estudiante
    Entonces se debe lanzar un error de lista HC adultos con el mensaje "ID de estudiante inválido. Debe ser un UUID v4."
