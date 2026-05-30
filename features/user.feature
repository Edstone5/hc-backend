# language: es
Característica: Gestión de Usuarios del Sistema
  Como administrador
  Quiero registrar y gestionar usuarios
  Para controlar el acceso al sistema clínico

  Escenario: Registrar usuario con todos los campos (Camino Feliz)
    Dado los datos del usuario a registrar:
      | userCode | firstName | lastName | dni      | email               | role       |
      | USR001   | Juan      | Pérez    | 12345678 | juan@example.com    | estudiante |
    Cuando se registra el usuario
    Entonces la operación de usuario debe ser exitosa con el mensaje "Usuario registrado correctamente"

  Escenario: Registrar usuario con campos opcionales ausentes
    Dado los datos del usuario a registrar:
      | userCode | firstName | lastName | email            |
      | USR002   | Ana       | López    | ana@example.com  |
    Cuando se registra el usuario
    Entonces la operación de usuario debe ser exitosa con el mensaje "Usuario registrado correctamente"
    Y el dni del usuario registrado debe ser nulo

  Escenario: Error al registrar con código de usuario vacío
    Dado los datos del usuario a registrar:
      | userCode | firstName | email               |
      |          | Pedro     | pedro@example.com   |
    Cuando se intenta registrar el usuario
    Entonces se debe lanzar un error de usuario con el mensaje "userCode es requerido"

  Escenario: Error al registrar con email inválido
    Dado los datos del usuario a registrar:
      | userCode | firstName | email         |
      | USR003   | Carlos    | no-es-un-email |
    Cuando se intenta registrar el usuario
    Entonces se debe lanzar un error de usuario con el mensaje "email inválido"
