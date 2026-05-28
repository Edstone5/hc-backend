# language: es
Característica: Registro de Filiación
  Como estudiante
  Quiero ingresar y actualizar datos de filiación en la historia clínica
  Para completar la información del paciente

  Antecedentes:
    Dado que el estudiante está autenticado en el sistema
    Y existe una historia clínica activa

  Escenario: Registrar datos de filiación correctamente
    Cuando el estudiante registra datos válidos en filiación
      | campo            | valor                    |
      | nombre           | Juan                     |
      | apellido         | Pérez López              |
      | edad             | 35                       |
      | sexo             | Masculino                |
      | fechaNacimiento  | 1988-05-15               |
    Entonces el sistema guarda la información correctamente
    Y retorna un código de estado 201
    Y se crea una entrada en el historial de versiones

  Escenario: Actualizar datos de filiación existentes
    Dado que ya existe filiación registrada para la historia clínica
    Cuando el estudiante actualiza los datos de filiación
    Entonces el sistema actualiza la información correctamente
    Y retorna un código de estado 200
    Y registra el cambio en el historial de versiones con usuario y timestamp

  Escenario: Intentar registrar filiación con datos inválidos
    Cuando el estudiante ingresa datos inválidos en filiación
      | campo   | valor |
      | edad    | abc   |
      | sexo    | Otro  |
    Entonces el sistema rechaza la operación
    Y retorna un código de estado 400 o 500
    Y informa que los datos no son válidos

  Escenario: Registrar filiación para historia inexistente
    Cuando el estudiante intenta registrar filiación para una historia que no existe
    Entonces el sistema retorna un error
    Y informa que la historia clínica no fue encontrada

  Escenario: Historial de versiones registra cambios
    Dado que el estudiante ha realizado cambios en la filiación
    Cuando se consulta el historial de versiones
    Entonces el sistema muestra cada cambio con:
      | campo           |
      | usuario         |
      | timestamp       |
      | valor_anterior  |
      | valor_nuevo     |
