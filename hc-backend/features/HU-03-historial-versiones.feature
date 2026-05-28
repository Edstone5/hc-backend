# language: es
Característica: Historial de Versiones de Historia Clínica
  Como docente
  Quiero ver el historial de versiones de una historia clínica
  Para revisar cambios previos y su autoría

  Antecedentes:
    Dado que el docente está autenticado en el sistema
    Y existe una historia clínica con cambios registrados

  Escenario: Ver historial de versiones accesible
    Cuando el docente consulta el historial de versiones de una historia clínica
    Entonces el sistema retorna una lista de versiones
    Y cada versión contiene información de cambios
    Y retorna un código de estado 200

  Escenario: Historial muestra campo cambiado, valores anterior y nuevo
    Dado que existe un cambio registrado en la filiación
    Cuando el docente revisa el historial de versiones
    Entonces cada entrada muestra:
      | información         |
      | campo_modificado    |
      | valor_anterior      |
      | valor_nuevo         |
      | usuario_responsable |
      | fecha_cambio        |

  Escenario: Historial ordenado cronológicamente
    Dado que existen múltiples cambios en la historia clínica
    Cuando el docente consulta el historial
    Entonces los cambios se muestran en orden cronológico
    Y el cambio más reciente aparece primero o último según el ordenamiento

  Escenario: Identificar quién realizó cada cambio
    Dado que varios estudiantes han modificado la historia clínica
    Cuando el docente revisa el historial
    Entonces cada cambio indica qué usuario lo realizó
    Y muestra la fecha y hora exacta del cambio

  Escenario: Historial vacío para historia sin cambios
    Dado que existe una historia clínica sin cambios registrados
    Cuando el docente consulta el historial de versiones
    Entonces el sistema retorna una lista vacía o con mínimas entradas
    Y retorna un código de estado 200

  Escenario: Acceso denegado a historial de otro usuario
    Cuando un estudiante intenta ver el historial de versiones
    Entonces el sistema respeta los permisos según rol
    Y solo permite acceso si el usuario tiene permisos suficientes
