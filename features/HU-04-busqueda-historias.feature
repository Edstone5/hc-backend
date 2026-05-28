# language: es
Característica: Búsqueda de Historias Clínicas
  Como estudiante, administrativo o docente
  Quiero buscar historias clínicas por ID o nombre del paciente
  Para acceder rápidamente al expediente

  Antecedentes:
    Dado que el usuario está autenticado en el sistema
    Y existen historias clínicas registradas en el sistema

  Escenario: Buscar historia clínica existente por estudiante
    Cuando el usuario busca historias clínicas de un estudiante específico
    Entonces el sistema retorna la lista de historias asociadas al estudiante
    Y retorna un código de estado 200
    Y la lista contiene historias a las que el usuario tiene permiso

  Escenario: Buscar historia clínica inexistente
    Cuando el usuario realiza una búsqueda que no produce resultados
    Entonces el sistema informa que no existen resultados
    Y retorna una lista vacía
    Y retorna un código de estado 200

  Escenario: Búsqueda respeta permisos del usuario
    Dado que el usuario tiene permisos limitados
    Cuando realiza una búsqueda de historias
    Entonces el sistema devuelve solo historias a las que el usuario tiene acceso
    Y no muestra historias de otros estudiantes sin permiso

  Escenario: Listar historias de adultos
    Cuando el usuario busca historias clínicas de adultos de un estudiante
    Entonces el sistema retorna solo historias de pacientes adultos
    Y filtra correctamente por tipo de paciente
    Y retorna un código de estado 200

  Escenario: Búsqueda con múltiples historias
    Dado que un estudiante tiene múltiples historias clínicas registradas
    Cuando el usuario busca las historias del estudiante
    Entonces el sistema retorna todas las historias
    Y cada historia contiene: id_historia, idPaciente, estado, fecha_creación

  Escenario: Búsqueda por nombre del paciente (Futuro)
    Cuando el usuario busca una historia por nombre del paciente
    Entonces el sistema busca en todas las historias
    Y retorna solo aquellas que coinciden con el nombre
    Y aplica los filtros de permisos

  Escenario: Ordenamiento de resultados
    Dado que existen múltiples historias disponibles
    Cuando el usuario realiza una búsqueda
    Entonces los resultados están ordenados por fecha de creación
    O por relevancia según criterios de búsqueda
