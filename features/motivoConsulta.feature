# language: es
Característica: Gestión de Motivo de Consulta
  Como personal de salud
  Quiero registrar, consultar y actualizar el motivo de consulta de una historia clínica
  Para documentar la razón principal que motiva la atención del paciente

  Escenario: Registrar motivo de consulta válido (Camino Feliz)
    Dados los datos del motivo de consulta:
      | id_historia                          | motivo                              |
      | 550e8400-e29b-41d4-a716-446655442000 | Dolor e inflamación en molar izquierdo |
    Cuando se registra el motivo de consulta
    Entonces la operación de motivo de consulta debe ser exitosa con el mensaje "Motivo de consulta registrado con exito"
    Y debe existir el motivo de consulta para la historia clínica "550e8400-e29b-41d4-a716-446655442000"

  Escenario: Actualizar motivo de consulta existente (Camino Feliz)
    Dado existe un motivo de consulta con id_historia "550e8400-e29b-41d4-a716-446655442001" y motivo "Revisión de rutina"
    Cuando se actualiza el motivo de consulta con:
      | id_historia                          | motivo                           |
      | 550e8400-e29b-41d4-a716-446655442001 | Dolor agudo en encía superior    |
    Entonces la operación de motivo de consulta debe ser exitosa con el mensaje "Motivo de consulta actualizado correctamente"
    Y el motivo almacenado para la historia clínica "550e8400-e29b-41d4-a716-446655442001" debe ser "Dolor agudo en encía superior"

  Escenario: Consultar motivo de consulta existente (Camino Feliz)
    Dado existe un motivo de consulta con id_historia "550e8400-e29b-41d4-a716-446655442002" y motivo "Sangrado de encías al cepillar"
    Cuando se consulta el motivo de consulta de la historia clínica "550e8400-e29b-41d4-a716-446655442002"
    Entonces la consulta de motivo debe retornar el registro correctamente
    Y el motivo consultado debe ser "Sangrado de encías al cepillar"

  Escenario: Error al registrar por motivo vacío (Ruta de Error — invariante MotivoConsultaVO)
    Dados los datos del motivo de consulta:
      | id_historia                          | motivo |
      | 550e8400-e29b-41d4-a716-446655442003 |        |
    Cuando se intenta registrar el motivo de consulta
    Entonces se debe lanzar un error de motivo de consulta con el mensaje "motivo no puede estar vacio"
    Y no debe existir el motivo de consulta para la historia clínica "550e8400-e29b-41d4-a716-446655442003"

  Escenario: Error al registrar por UUID de historia clínica inválido (Ruta de Error — invariante IdHistoriaClinicaVO)
    Dados los datos del motivo de consulta:
      | id_historia   | motivo                |
      | no-es-un-uuid | Dolor en molar        |
    Cuando se intenta registrar el motivo de consulta
    Entonces se debe lanzar un error de motivo de consulta con el mensaje "id_historia debe ser un UUID valido"
    Y no debe existir el motivo de consulta para la historia clínica "no-es-un-uuid"
