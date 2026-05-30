# language: es
Característica: Gestión de Pacientes
  Como personal de salud
  Quiero registrar y actualizar datos de pacientes
  Para mantener un registro actualizado de los pacientes atendidos

  Escenario: Registrar paciente con todos los campos (Camino Feliz)
    Dado los datos del paciente a registrar:
      | nombre | apellido | dni      | fechaNacimiento | sexo | telefono  | email               |
      | Juan   | Pérez    | 12345678 | 1990-05-15      | M    | 987654321 | juan@example.com    |
    Cuando se registra el paciente
    Entonces la operación de paciente debe ser exitosa con el mensaje "Paciente registrado correctamente"

  Escenario: Registrar paciente solo con nombre y apellido (campos obligatorios)
    Dado los datos del paciente a registrar:
      | nombre | apellido |
      | Ana    | García   |
    Cuando se registra el paciente
    Entonces la operación de paciente debe ser exitosa con el mensaje "Paciente registrado correctamente"
    Y los campos opcionales del paciente deben ser nulos

  Escenario: Registrar paciente con fecha de nacimiento nula (normalización silenciosa)
    Dado los datos del paciente a registrar:
      | nombre  | apellido | fechaNacimiento |
      | Carlos  | López    |                 |
    Cuando se registra el paciente
    Entonces la operación de paciente debe ser exitosa con el mensaje "Paciente registrado correctamente"

  Escenario: Error al registrar con nombre vacío
    Dado los datos del paciente a registrar:
      | nombre | apellido |
      |        | García   |
    Cuando se intenta registrar el paciente
    Entonces se debe lanzar un error de paciente con el mensaje "nombre es requerido"

  Escenario: Error al registrar con apellido vacío
    Dado los datos del paciente a registrar:
      | nombre | apellido |
      | María  |          |
    Cuando se intenta registrar el paciente
    Entonces se debe lanzar un error de paciente con el mensaje "apellido es requerido"
