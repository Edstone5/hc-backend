-- ═══════════════════════════════════════════════════════════════════════════
--  Seed de DEMO — credenciales conocidas para la demostración de hexagonalidad
--
--  Se monta en AMBOS motores (PostgreSQL y MySQL) para que la MISMA credencial
--  funcione idéntica al intercambiar el adaptador de persistencia:
--
--       codigo_usuario : 2023-000001
--       contraseña     : esis123           (hash argon2id abajo)
--       rol            : estudiante
--
--  Portable a propósito: sin ON CONFLICT/INSERT IGNORE (corre una sola vez sobre
--  una BD recién inicializada), TRUE para los booleanos (válido en PG y MySQL),
--  literales de UUID como texto (uuid en PG, CHAR(36) en MySQL) y sin columnas
--  con DEFAULT (created_at / fecha_registro) para no chocar entre esquemas.
-- ═══════════════════════════════════════════════════════════════════════════

-- Estudiante de demostración (contraseña: esis123)
INSERT INTO usuario
  (id_usuario, codigo_usuario, nombre, apellido, dni, email, rol, contrasena_hash, activo)
VALUES
  ('11111111-1111-4111-8111-111111111111', '2023-000001', 'Demo', 'Hexagonal',
   '70000001', 'demo.hexagonal@unjbg.edu.pe', 'estudiante',
   '$argon2id$v=19$m=65536,t=3,p=4$r48QbhruzL+i03hSNObznA$FMdJziib0k++6Yc0tLKiUahzEAYnY7+JC5geUWbOzi0',
   TRUE);

-- Un par de pacientes para que la base MySQL no arranque vacía en la demo.
INSERT INTO paciente
  (id_paciente, nombre, apellido, dni, fecha_nacimiento, sexo, telefono, email, activo)
VALUES
  ('22222222-2222-4222-8222-222222222221', 'Ana',  'Quispe Mamani', '71111111',
   '1990-05-12', 'F', '952111222', 'ana.quispe@example.com',  TRUE),
  ('22222222-2222-4222-8222-222222222222', 'Luis', 'Flores Choque', '71222222',
   '1985-11-03', 'M', '952333444', 'luis.flores@example.com', TRUE);
