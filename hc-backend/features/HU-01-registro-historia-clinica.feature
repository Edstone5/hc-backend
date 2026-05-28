# language: es
Característica: Registro de Historia Clínica
  Como administrador
  Quiero crear una nueva historia clínica
  Para registrar digitalmente el caso del paciente

  Antecedentes:
    Dado que el administrador está autenticado en el sistema

  Escenario: Registrar una historia clínica correctamente
    Cuando registra una nueva historia clínica con datos válidos
    Entonces el sistema genera un identificador único
    Y la historia clínica queda registrada en el sistema
    Y retorna un código de estado 201
    Y el registro aparece en el listado del estudiante

  Escenario: Registrar historia clínica sin datos obligatorios
    Cuando intenta registrar una historia clínica sin idStudent
    Entonces el sistema rechaza el registro
    Y retorna un código de estado 500
    Y informa que existen datos obligatorios faltantes

  Escenario: Verificar que el ID generado es único
    Dado que ya existe una historia clínica registrada
    Cuando registra una nueva historia clínica
    Entonces el sistema genera un identificador único diferente
    Y ambos IDs son válidos (formato UUID)

  Escenario: Validar que el registro aparece en listado del estudiante
    Cuando registra una nueva historia clínica para un estudiante específico
    Entonces el registro aparece al listar todas las historias del estudiante
    Y el listado contiene la historia clínica recién creada
