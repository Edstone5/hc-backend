# language: es
Característica: Autenticación de Usuarios
  Como usuario del sistema
  Quiero iniciar sesión con mi código y contraseña
  Para acceder a las funcionalidades según mi rol

  Escenario: Iniciar sesión con credenciales válidas (Camino Feliz)
    Dado las credenciales de autenticación:
      | userCode | password  |
      | USR001   | secret123 |
    Cuando se intenta autenticar al usuario
    Entonces la operación de autenticación debe ser exitosa con el mensaje "Credenciales validadas correctamente"

  Escenario: Error al autenticar con código de usuario vacío
    Dado las credenciales de autenticación:
      | userCode | password  |
      |          | secret123 |
    Cuando se intenta autenticar al usuario
    Entonces se debe lanzar un error de autenticación con el mensaje "userCode es requerido"

  Escenario: Error al autenticar con contraseña vacía
    Dado las credenciales de autenticación:
      | userCode | password |
      | USR001   |          |
    Cuando se intenta autenticar al usuario
    Entonces se debe lanzar un error de autenticación con el mensaje "password es requerido"

  Escenario: Código de usuario con espacios se normaliza (trim)
    Dado las credenciales de autenticación:
      | userCode       | password  |
      |   ADM-2024     | pass2024  |
    Cuando se intenta autenticar al usuario
    Entonces la operación de autenticación debe ser exitosa con el mensaje "Credenciales validadas correctamente"
    Y el código de usuario autenticado debe ser "ADM-2024"
