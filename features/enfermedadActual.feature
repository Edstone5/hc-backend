# language: es
Característica: Gestión de Enfermedad Actual
  Como personal de salud
  Quiero registrar, consultar y actualizar la enfermedad actual de una historia clínica
  Para conservar el relato clínico central del episodio de morbilidad del paciente

  Escenario: Registrar enfermedad actual con todos los campos válidos (Camino Feliz)
    Dados los datos de enfermedad actual:
      | id_historia                          | sintoma_principal                   | tiempo_enfermedad | forma_inicio | curso      | relato                          | tratamiento_prev |
      | 550e8400-e29b-41d4-a716-446655440000 | Dolor intenso en molares inferiores | 3 días            | Brusco       | Progresivo | Paciente refiere dolor pulsátil | Ibuprofeno 400mg |
    Cuando se registra la enfermedad actual
    Entonces la operación de registro debe ser exitosa con el mensaje "Enfermedad actual registrada con exito"
    Y debe existir la enfermedad actual para la historia clínica "550e8400-e29b-41d4-a716-446655440000"

  Escenario: Registrar enfermedad actual solo con el campo obligatorio (Camino Feliz)
    Dados los datos de enfermedad actual:
      | id_historia                          | sintoma_principal  |
      | 550e8400-e29b-41d4-a716-446655440001 | Cefalea unilateral |
    Cuando se registra la enfermedad actual
    Entonces la operación de registro debe ser exitosa con el mensaje "Enfermedad actual registrada con exito"
    Y debe existir la enfermedad actual para la historia clínica "550e8400-e29b-41d4-a716-446655440001"

  Escenario: Actualizar enfermedad actual existente (Camino Feliz)
    Dado existe una enfermedad actual con id_historia "550e8400-e29b-41d4-a716-446655440002" y síntoma principal "Dolor leve en encías"
    Cuando se actualiza la enfermedad actual con:
      | id_historia                          | sintoma_principal             | tiempo_enfermedad | forma_inicio |
      | 550e8400-e29b-41d4-a716-446655440002 | Sangrado espontáneo de encías | 5 días            | Gradual      |
    Entonces la operación de actualización debe ser exitosa con el mensaje "Enfermedad actual actualizada correctamente"
    Y el síntoma principal para la historia clínica "550e8400-e29b-41d4-a716-446655440002" debe ser "Sangrado espontáneo de encías"

  Escenario: Consultar enfermedad actual existente (Camino Feliz)
    Dado existe una enfermedad actual con id_historia "550e8400-e29b-41d4-a716-446655440003" y síntoma principal "Cefalea intensa"
    Cuando se consulta la enfermedad actual de la historia clínica "550e8400-e29b-41d4-a716-446655440003"
    Entonces la consulta debe retornar la enfermedad actual correctamente
    Y el síntoma principal consultado debe ser "Cefalea intensa"

  Escenario: Error al registrar por síntoma principal vacío (Ruta de Error — invariante TextoClinicoObligatorioVO)
    Dados los datos de enfermedad actual:
      | id_historia                          | sintoma_principal | tiempo_enfermedad |
      | 550e8400-e29b-41d4-a716-446655440004 |                   | 2 días            |
    Cuando se intenta registrar la enfermedad actual
    Entonces se debe lanzar un error de enfermedad actual con el mensaje "El sintoma principal es obligatorio"
    Y no debe existir enfermedad actual para la historia clínica "550e8400-e29b-41d4-a716-446655440004"

  Escenario: Error al registrar por UUID de historia clínica inválido (Ruta de Error — invariante IdHistoriaClinicaVO)
    Dados los datos de enfermedad actual:
      | id_historia      | sintoma_principal     |
      | formato-invalido | Dolor leve en cabeza  |
    Cuando se intenta registrar la enfermedad actual
    Entonces se debe lanzar un error de enfermedad actual con el mensaje "La historia clinica debe ser un UUID v4 valido"
    Y no debe existir enfermedad actual para la historia clínica "formato-invalido"
