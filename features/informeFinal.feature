Feature: Informe Final de Intervención del estudiante
  Como estudiante de odontología
  Quiero generar el informe final del caso y enviarlo a validación docente
  Para cerrar académicamente la intervención con trazabilidad completa

  Scenario: Generación feliz del informe con secciones mínimas
    Given un caso clínico con historia "550e8400-e29b-41d4-a716-446655440000" del estudiante "123e4567-e89b-42d3-a456-426614174000"
    And el caso compila encabezado, procedimientos y odontograma final
    When genero el informe final
    Then el informe queda en estado "generado"
    And el historial de la historia "550e8400-e29b-41d4-a716-446655440000" tiene 1 informe

  Scenario: El historial acumula cada generación del informe
    Given un caso clínico con historia "550e8400-e29b-41d4-a716-446655440000" del estudiante "123e4567-e89b-42d3-a456-426614174000"
    And el caso compila encabezado, procedimientos y odontograma final
    When genero el informe final
    And genero el informe final
    Then el historial de la historia "550e8400-e29b-41d4-a716-446655440000" tiene 2 informes

  Scenario: Envío feliz a validación con notificación al docente
    Given un caso clínico con historia "550e8400-e29b-41d4-a716-446655440000" del estudiante "123e4567-e89b-42d3-a456-426614174000"
    And el caso compila encabezado, procedimientos y odontograma final
    And genero el informe final
    When envío el informe para validación del docente "9b2fae51-7c11-4e39-8a2d-3f5b6c7d8e9f"
    Then el informe queda en estado "enviado_validacion"
    And el docente "9b2fae51-7c11-4e39-8a2d-3f5b6c7d8e9f" recibe una notificación de tipo "validacion"

  Scenario: Error por informe sin odontograma final (invariante de compilación)
    Given un caso clínico con historia "550e8400-e29b-41d4-a716-446655440000" del estudiante "123e4567-e89b-42d3-a456-426614174000"
    And el caso compila solo encabezado y procedimientos
    When genero el informe final
    Then se debe lanzar un error de dominio del informe con el mensaje "el informe debe compilar: encabezado, procedimientos, odontograma"

  Scenario: Error por reenvío de un informe ya enviado a validación
    Given un caso clínico con historia "550e8400-e29b-41d4-a716-446655440000" del estudiante "123e4567-e89b-42d3-a456-426614174000"
    And el caso compila encabezado, procedimientos y odontograma final
    And genero el informe final
    And envío el informe para validación del docente "9b2fae51-7c11-4e39-8a2d-3f5b6c7d8e9f"
    When envío el informe para validación del docente "9b2fae51-7c11-4e39-8a2d-3f5b6c7d8e9f"
    Then se debe lanzar un error de dominio del informe con el mensaje "el informe ya fue enviado para validación"
