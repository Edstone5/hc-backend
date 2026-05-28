# language: es
Característica: Gestión del Examen Físico General
  Como personal de salud
  Quiero registrar y actualizar el examen físico general de una historia clínica
  Para conservar los signos vitales y hallazgos generales del paciente con validación de rangos clínicos

  Escenario: Registrar examen físico general con signos vitales válidos (Camino Feliz)
    Dados los datos del examen físico general:
      | id_historia                          | temperatura | presion_arterial | peso | posicion | conciencia |
      | 550e8400-e29b-41d4-a716-446655443000 | 36.8        | 120/80           | 70.5 | decúbito | lúcido     |
    Cuando se registra el examen físico general
    Entonces el examen físico general debe existir en el repositorio para la historia clínica "550e8400-e29b-41d4-a716-446655443000"

  Escenario: Actualizar examen físico general existente (Camino Feliz)
    Dado existe un examen físico general con id_historia "550e8400-e29b-41d4-a716-446655443001" y temperatura "36.5"
    Cuando se actualiza el examen físico general con:
      | id_historia                          | temperatura | presion_arterial | peso |
      | 550e8400-e29b-41d4-a716-446655443001 | 37.2        | 130/85           | 72   |
    Entonces la operación de actualización de examen general debe ser exitosa con el mensaje "Actualizado"

  Escenario: Temperatura fuera de rango clínico se normaliza a nulo sin error (normalización silenciosa de TemperaturaVO)
    Dados los datos del examen físico general:
      | id_historia                          | temperatura | peso |
      | 550e8400-e29b-41d4-a716-446655443002 | 50          | 70   |
    Cuando se registra el examen físico general
    Entonces el examen físico general debe existir en el repositorio para la historia clínica "550e8400-e29b-41d4-a716-446655443002"
    Y la temperatura normalizada debe ser nula para la historia clínica "550e8400-e29b-41d4-a716-446655443002"

  Escenario: Presión arterial con formato incorrecto se normaliza a nulo sin error (normalización silenciosa de PresionArterialVO)
    Dados los datos del examen físico general:
      | id_historia                          | temperatura | presion_arterial | peso |
      | 550e8400-e29b-41d4-a716-446655443003 | 37.0        | 120-80           | 70   |
    Cuando se registra el examen físico general
    Entonces el examen físico general debe existir en el repositorio para la historia clínica "550e8400-e29b-41d4-a716-446655443003"
    Y la presión arterial normalizada debe ser nula para la historia clínica "550e8400-e29b-41d4-a716-446655443003"

  Escenario: Error al registrar por UUID de historia clínica inválido (Ruta de Error — invariante IdHistoriaClinicaVO)
    Dados los datos del examen físico general:
      | id_historia   | temperatura | peso |
      | no-es-un-uuid | 37.0        | 70   |
    Cuando se intenta registrar el examen físico general
    Entonces se debe lanzar un error de examen general con el mensaje "id_historia invalido: formato UUIDv4 esperado"
    Y no debe existir el examen físico general para la historia clínica "no-es-un-uuid"
