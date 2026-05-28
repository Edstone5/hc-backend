# language: es
Característica: Gestión de Antecedentes Clínicos
  Como personal de salud
  Quiero registrar los antecedentes clínicos de una historia clínica
  Para conservar el historial de salud personal, familiar y de seguimiento del paciente

  Escenario: Registrar antecedentes personales no patológicos (Camino Feliz)
    Dados los datos del antecedente personal:
      | id_historia                          | fuma | grupo_sanguineo_desc | frecuencia_cepillado | seda_dental |
      | 550e8400-e29b-41d4-a716-446655441000 | si   | O+                   | 2 veces al día       | si          |
    Cuando se registran los antecedentes personales no patológicos
    Entonces la operación de antecedente debe ser exitosa con el mensaje "Antecedentes personales no patologicos registrados correctamente"
    Y debe existir el antecedente personal para la historia clínica "550e8400-e29b-41d4-a716-446655441000"

  Escenario: Registrar antecedentes personales patológicos (Camino Feliz)
    Dados los datos del antecedente médico:
      | id_historia                          | salud_general | alergias   | enf_diabetes | enf_hipertension |
      | 550e8400-e29b-41d4-a716-446655441001 | regular       | penicilina | si           | no               |
    Cuando se registran los antecedentes personales patológicos
    Entonces la operación de antecedente debe ser exitosa con el mensaje "Antecedentes personales patologicos registrados correctamente"
    Y debe existir el antecedente médico para la historia clínica "550e8400-e29b-41d4-a716-446655441001"

  Escenario: Registrar antecedentes heredo familiares con descripción (Camino Feliz)
    Dados los datos del antecedente familiar:
      | id_historia                          | descripcion                               |
      | 550e8400-e29b-41d4-a716-446655441002 | Padre con hipertensión, madre con diabetes |
    Cuando se registran los antecedentes heredo familiares
    Entonces la operación de antecedente debe ser exitosa con el mensaje "Antecedentes heredo familiares registrados correctamente"
    Y debe existir el antecedente familiar para la historia clínica "550e8400-e29b-41d4-a716-446655441002"

  Escenario: Registrar seguimiento del tratamiento con datos válidos (Camino Feliz)
    Dados los datos del seguimiento del tratamiento:
      | id_historia                          | frecuencia_control_meses | frecuencia_limpieza_meses | fecha_consentimiento | firma_nombre |
      | 550e8400-e29b-41d4-a716-446655441003 | 6                        | 12                        | 2025-03-15           | Juan Pérez   |
    Cuando se registra el seguimiento del tratamiento
    Entonces la operación de antecedente debe ser exitosa con el mensaje "Seguimiento del tratamiento registrado correctamente"
    Y debe existir el seguimiento del tratamiento para la historia clínica "550e8400-e29b-41d4-a716-446655441003"

  Escenario: Error al registrar por UUID de historia clínica inválido (Ruta de Error — invariante IdHistoriaClinicaVO)
    Dados los datos del antecedente personal:
      | id_historia   | fuma |
      | uuid-invalido | no   |
    Cuando se intenta registrar los antecedentes personales no patológicos
    Entonces se debe lanzar un error de antecedente con el mensaje "El identificador clinico debe ser un UUID valido"
    Y no debe existir el antecedente personal para la historia clínica "uuid-invalido"

  Escenario: Error al registrar seguimiento con frecuencia de control negativa (Ruta de Error — invariante EnteroNoNegativoVO)
    Dados los datos del seguimiento del tratamiento:
      | id_historia                          | frecuencia_control_meses | frecuencia_limpieza_meses |
      | 550e8400-e29b-41d4-a716-446655441004 | -3                       | 12                        |
    Cuando se intenta registrar el seguimiento del tratamiento
    Entonces se debe lanzar un error de antecedente con el mensaje "La frecuencia de control debe ser un entero no negativo"
    Y no debe existir el seguimiento del tratamiento para la historia clínica "550e8400-e29b-41d4-a716-446655441004"

  Escenario: Error al registrar seguimiento con fecha de consentimiento inválida (Ruta de Error — invariante FechaClinicaVO)
    Dados los datos del seguimiento del tratamiento:
      | id_historia                          | fecha_consentimiento | firma_nombre |
      | 550e8400-e29b-41d4-a716-446655441005 | no-es-una-fecha      | María López  |
    Cuando se intenta registrar el seguimiento del tratamiento
    Entonces se debe lanzar un error de antecedente con el mensaje "La fecha de consentimiento no tiene un formato valido"
    Y no debe existir el seguimiento del tratamiento para la historia clínica "550e8400-e29b-41d4-a716-446655441005"
