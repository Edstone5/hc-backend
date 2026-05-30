# language: es
Característica: Gestión de Historias Clínicas (HC)
  Como personal del sistema
  Quiero registrar, revisar y consultar historias clínicas
  Para gestionar el ciclo de vida de cada historia clínica del paciente

  Escenario: Registrar una nueva historia clínica (Camino Feliz — RegistroHC)
    Dado los datos de registro de historia clínica:
      | idStudent                            |
      | 550e8400-e29b-41d4-a716-446655440000 |
    Cuando se registra la historia clínica
    Entonces la operación de hc debe ser exitosa con el mensaje "Historia clínica registrada correctamente"

  Escenario: Revisar una historia clínica con estado válido (Camino Feliz — RevisiónHC)
    Dado los datos de revisión de historia clínica:
      | idHistory                            | idTeacher                            | state    | observations     |
      | 550e8400-e29b-41d4-a716-446655440001 | 660f9500-f39c-41d4-b827-557766551111 | aprobado | Sin observaciones |
    Cuando se revisa la historia clínica
    Entonces la operación de hc debe ser exitosa con el mensaje "Revisión guardada correctamente"

  Escenario: Asignar paciente a historia clínica (Camino Feliz — AsignaciónPaciente)
    Dado los datos de asignación de paciente:
      | idHistory                            | idPatient                            |
      | 550e8400-e29b-41d4-a716-446655440002 | 660f9500-f39c-41d4-b827-557766551112 |
    Cuando se asigna el paciente a la historia clínica
    Entonces la operación de hc debe ser exitosa con el mensaje "Paciente asignado correctamente"

  Escenario: Error al registrar HC con idStudent inválido (Ruta de Error)
    Dado los datos de registro de historia clínica:
      | idStudent     |
      | no-es-un-uuid |
    Cuando se intenta registrar la historia clínica
    Entonces se debe lanzar un error de hc con el mensaje "id_estudiante debe ser un UUIDv4 válido"

  Escenario: Revisión con estado demasiado largo es rechazada (invariante longitud)
    Dado los datos de revisión de historia clínica:
      | idHistory                            | idTeacher                            | state                                                                             |
      | 550e8400-e29b-41d4-a716-446655440003 | 660f9500-f39c-41d4-b827-557766551111 | aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa |
    Cuando se intenta revisar la historia clínica
    Entonces se debe lanzar un error de hc con el mensaje "El estado de la revisión es demasiado largo"
