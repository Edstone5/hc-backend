# language: es
Característica: Gestión del Examen Clínico de Boca
  Como personal de salud
  Quiero actualizar y consultar el examen clínico de boca de una historia clínica
  Para registrar los hallazgos de tejidos blandos y oclusión dental del paciente

  Escenario: Actualizar examen de boca con hallazgos clínicos válidos (Camino Feliz)
    Dados los datos del examen de boca:
      | id_historia                          | labios_sin_lesiones | paladar_sin_lesiones | oclusion_molar_der |
      | 550e8400-e29b-41d4-a716-446655444000 | Normal              | Sin alteraciones     | clase I            |
    Cuando se actualiza el examen de boca
    Entonces la operación de examen de boca debe ser exitosa con el mensaje "Examen de boca guardado correctamente"
    Y el examen de boca debe existir en el repositorio para la historia clínica "550e8400-e29b-41d4-a716-446655444000"

  Escenario: Consultar examen de boca existente (Camino Feliz)
    Dado existe un examen de boca para la historia clínica "550e8400-e29b-41d4-a716-446655444001"
    Cuando se consulta el examen de boca de la historia clínica "550e8400-e29b-41d4-a716-446655444001"
    Entonces la consulta del examen de boca debe retornar el registro correctamente

  Escenario: Campo de texto vacío se normaliza a nulo al actualizar (normalización silenciosa de TextoClinicoOpcionalVO)
    Dados los datos del examen de boca:
      | id_historia                          | labios_sin_lesiones | labios_con_lesiones |
      | 550e8400-e29b-41d4-a716-446655444002 | Normal              |                     |
    Cuando se actualiza el examen de boca
    Entonces la operación de examen de boca debe ser exitosa con el mensaje "Examen de boca guardado correctamente"
    Y el campo labios con lesiones debe ser nulo para la historia clínica "550e8400-e29b-41d4-a716-446655444002"

  Escenario: Error al actualizar por UUID de historia clínica inválido (Ruta de Error — invariante IdHistoriaClinicaVO)
    Dados los datos del examen de boca:
      | id_historia   | labios_sin_lesiones |
      | no-es-un-uuid | Normal              |
    Cuando se intenta actualizar el examen de boca
    Entonces se debe lanzar un error de examen de boca con el mensaje "id_historia invalido: formato UUIDv4 esperado"
    Y no debe existir el examen de boca para la historia clínica "no-es-un-uuid"
