# language: es
Característica: Consulta de Catálogos del Sistema
  Como usuario del sistema
  Quiero consultar los catálogos de valores predefinidos
  Para obtener las opciones disponibles en los formularios clínicos

  Escenario: Consultar un catálogo permitido (Camino Feliz)
    Dado el nombre del catálogo a consultar:
      | catalogName      |
      | catalogo_sexo    |
    Cuando se consulta el catálogo
    Entonces la operación de catálogo debe ser exitosa con el mensaje "Catálogo consultado correctamente"

  Escenario: Consultar otro catálogo permitido
    Dado el nombre del catálogo a consultar:
      | catalogName             |
      | catalogo_estado_civil   |
    Cuando se consulta el catálogo
    Entonces la operación de catálogo debe ser exitosa con el mensaje "Catálogo consultado correctamente"

  Escenario: Error al consultar catálogo no permitido
    Dado el nombre del catálogo a consultar:
      | catalogName       |
      | catalogo_no_existe |
    Cuando se intenta consultar el catálogo
    Entonces se debe lanzar un error de catálogo con el mensaje "catalog name not allowed"

  Escenario: Error al consultar con nombre vacío
    Dado el nombre del catálogo a consultar:
      | catalogName |
      |             |
    Cuando se intenta consultar el catálogo
    Entonces se debe lanzar un error de catálogo con el mensaje "catalog name not allowed"
