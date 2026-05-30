# language: es
Característica: Consulta de Usuarios Estudiantes
  Como administrador del sistema
  Quiero consultar la lista de usuarios con rol de estudiante
  Para gestionar el acceso de los alumnos al sistema

  Escenario: Consultar usuarios con rol estudiante (Camino Feliz)
    Dado el rol de usuario a consultar:
      | role       |
      | estudiante |
    Cuando se consultan los usuarios por rol
    Entonces la operación de student users debe ser exitosa con el mensaje "Usuarios estudiantes consultados correctamente"

  Escenario: El rol se normaliza a minúsculas (ESTUDIANTE → estudiante)
    Dado el rol de usuario a consultar:
      | role       |
      | ESTUDIANTE |
    Cuando se consultan los usuarios por rol
    Entonces la operación de student users debe ser exitosa con el mensaje "Usuarios estudiantes consultados correctamente"

  Escenario: Error al consultar con rol vacío
    Dado el rol de usuario a consultar:
      | role |
      |      |
    Cuando se intenta consultar los usuarios por rol
    Entonces se debe lanzar un error de student users con el mensaje "role es requerido"

  Escenario: Error al consultar con rol diferente a estudiante
    Dado el rol de usuario a consultar:
      | role    |
      | docente |
    Cuando se intenta consultar los usuarios por rol
    Entonces se debe lanzar un error de student users con el mensaje "role inválido — se espera \"estudiante\""
