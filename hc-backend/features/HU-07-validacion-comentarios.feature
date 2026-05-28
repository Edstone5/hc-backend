# language: es
Característica: Validación y Comentarios de Historias Clínicas
  Como docente
  Quiero validar (✔/✖) y comentar entradas de historias
  Para supervisar y retroalimentar al estudiante

  Antecedentes:
    Dado que el docente está autenticado en el sistema
    Y existe una historia clínica para validar

  Escenario: Docente valida una entrada con comentario
    Cuando el docente registra una revisión en la historia clínica
      | campo        | valor                  |
      | estado       | validado               |
      | observaciones| Excelente trabajo      |
    Entonces el sistema marca la historia como validada
    Y registra la observación del docente
    Y retorna un código de estado 201

  Escenario: Docente rechaza entrada y deja comentario
    Cuando el docente registra una revisión rechazando la historia
      | campo        | valor                              |
      | estado       | requiere_correccion                |
      | observaciones| Falta revisar sección de exámenes |
    Entonces el sistema marca la historia como requiere corrección
    Y registra el comentario con recomendaciones
    Y notifica al estudiante responsable

  Escenario: Notificación enviada al estudiante
    Dado que el docente ha validado una historia clínica
    Cuando registra la validación con comentario
    Entonces se envía una notificación al estudiante
    Y la notificación contiene el comentario del docente
    Y registra la acción en auditoría

  Escenario: Registro de validación en auditoría
    Cuando el docente valida una historia clínica
    Entonces la acción se registra en auditoría con:
      | información      |
      | usuario_docente  |
      | timestamp        |
      | historia_id      |
      | estado_validacion|
      | observaciones    |

  Escenario: Validación solo por docentes autorizados
    Cuando un estudiante intenta registrar una revisión
    Entonces el sistema rechaza la acción
    Y retorna un error indicando permisos insuficientes
    Y la revisión no se registra

  Escenario: Múltiples validaciones de la misma historia
    Dado que un docente ha validado una historia
    Cuando otro docente revisa la misma historia
    Entonces el sistema permite registrar otra validación
    Y mantiene el historial de todas las validaciones
    Y cada una muestra quién y cuándo la realizó

  Escenario: Campo de observaciones es opcional
    Cuando el docente valida una historia sin dejar comentarios
    Entonces el sistema registra la validación
    Y retorna un código de estado 201
    Y el campo observaciones queda vacío o null
