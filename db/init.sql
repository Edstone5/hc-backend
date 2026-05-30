-- ============================================================
--  hc-backend — Script de inicialización compatible con MySQL 8.0+
--
--  ESQUEMA CANÓNICO: alineado con NeonDB (PostgreSQL serverless).
--  Todos los repositorios usan SQL directo con placeholders $N
--  (el adaptador db/db.js convierte $N → ? para MySQL automáticamente).
--
--  Sin stored procedures — la lógica vive en los repositorios JS.
--
--  Ejecutar:
--    mysql -u root -p hc_db < db/init.sql
--  O vía Docker (ver docker-compose.yml):
--    mysql_init_db service usa este archivo como entrypoint.
--
--  Fecha última actualización: 2026-05-29
-- ============================================================

CREATE DATABASE IF NOT EXISTS hc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hc_db;

SET FOREIGN_KEY_CHECKS = 0;
SET sql_mode = '';

-- ============================================================
-- SECCIÓN 1: USUARIOS Y SEGURIDAD
-- ============================================================

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario      CHAR(36)     NOT NULL PRIMARY KEY,
  codigo_usuario  VARCHAR(50)  NOT NULL UNIQUE,
  nombre          VARCHAR(200) NOT NULL,
  apellido        VARCHAR(200) NULL,
  dni             VARCHAR(20)  NULL UNIQUE,
  email           VARCHAR(200) NOT NULL UNIQUE,
  rol             VARCHAR(50)  NOT NULL DEFAULT 'estudiante',
  contrasena_hash VARCHAR(255) NOT NULL,
  activo          TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SECCIÓN 2: PACIENTES
-- ============================================================

CREATE TABLE IF NOT EXISTS paciente (
  id_paciente      CHAR(36)     NOT NULL PRIMARY KEY,
  nombre           VARCHAR(200) NOT NULL,
  apellido         VARCHAR(200) NOT NULL,
  dni              VARCHAR(20)  NULL UNIQUE,
  fecha_nacimiento DATE         NULL,
  sexo             VARCHAR(20)  NULL,
  telefono         VARCHAR(30)  NULL,
  email            VARCHAR(200) NULL,
  fecha_registro   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  activo           TINYINT(1)   NOT NULL DEFAULT 1
);

-- ============================================================
-- SECCIÓN 3: HISTORIA CLÍNICA CORE
-- ============================================================

CREATE TABLE IF NOT EXISTS historia_clinica (
  id_historia        CHAR(36)     NOT NULL PRIMARY KEY,
  id_paciente        CHAR(36)     NULL,
  id_estudiante      CHAR(36)     NOT NULL,
  fecha_elaboracion  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ultima_modificacion DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  estado             VARCHAR(50)  NOT NULL DEFAULT 'borrador',
  FOREIGN KEY (id_estudiante) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
  FOREIGN KEY (id_paciente)   REFERENCES paciente(id_paciente) ON DELETE SET NULL
);

-- Catálogo de estados de revisión
CREATE TABLE IF NOT EXISTS catalogo_estado_revision (
  id_estado_revision CHAR(36)     NOT NULL PRIMARY KEY,
  nombre             VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS revision_historia (
  id_revision        CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia        CHAR(36)     NOT NULL,
  id_docente         CHAR(36)     NOT NULL,
  fecha              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_estado_revision CHAR(36)     NULL,
  observaciones      TEXT         NULL,
  FOREIGN KEY (id_historia)        REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_docente)         REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
  FOREIGN KEY (id_estado_revision) REFERENCES catalogo_estado_revision(id_estado_revision) ON DELETE SET NULL
);

-- Pago por creación de HC (RF-ADM-01: S/ 2.00)
CREATE TABLE IF NOT EXISTS pago_hc (
  id_pago     CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia CHAR(36)     NOT NULL,
  monto       DECIMAL(6,2) NOT NULL DEFAULT 2.00,
  fecha_pago  DATE         NOT NULL DEFAULT (CURRENT_DATE),
  id_admin    CHAR(36)     NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_admin)    REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- ============================================================
-- SECCIÓN 4: ANAMNESIS
-- ============================================================

CREATE TABLE IF NOT EXISTS filiacion (
  id_filiacion               CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia                CHAR(36)     NOT NULL UNIQUE,
  raza                       VARCHAR(100) NULL,
  fecha_nacimiento           DATE         NULL,
  lugar                      VARCHAR(200) NULL,
  estado_civil               VARCHAR(50)  NULL,
  nombre_conyuge             VARCHAR(200) NULL,
  ocupacion                  VARCHAR(200) NULL,
  lugar_procedencia          VARCHAR(200) NULL,
  tiempo_residencia_tacna    VARCHAR(100) NULL,
  direccion                  VARCHAR(300) NULL,
  ultima_visita_dentista     VARCHAR(100) NULL,
  motivo_visita_dentista     TEXT         NULL,
  ultima_visita_medico       VARCHAR(100) NULL,
  motivo_visita_medico       TEXT         NULL,
  contacto_emergencia        VARCHAR(200) NULL,
  telefono_emergencia        VARCHAR(30)  NULL,
  acompaniante               VARCHAR(200) NULL,
  edad                       INT          NULL,
  sexo                       VARCHAR(20)  NULL,
  fecha_elaboracion          DATE         NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS motivo_consulta (
  id_motivo   CHAR(36)  NOT NULL PRIMARY KEY,
  id_historia CHAR(36)  NOT NULL UNIQUE,
  motivo      TEXT      NULL,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enfermedad_actual (
  id_enfermedad_actual CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia          CHAR(36)     NOT NULL UNIQUE,
  sintoma_principal    VARCHAR(500) NULL,
  tiempo_enfermedad    VARCHAR(100) NULL,
  forma_inicio         VARCHAR(100) NULL,
  curso                VARCHAR(100) NULL,
  relato               TEXT         NULL,
  tratamiento_prev     TEXT         NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

-- Catálogos para antecedentes
CREATE TABLE IF NOT EXISTS catalogo_grupo_sanguineo (
  id_grupo_sanguineo CHAR(36)    NOT NULL PRIMARY KEY,
  descripcion        VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS antecedente_personal (
  id_antecedente            CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia               CHAR(36)     NOT NULL UNIQUE,
  esta_embarazada           TINYINT(1)   NULL,
  mac                       VARCHAR(200) NULL,
  otros                     TEXT         NULL,
  psicosocial               TEXT         NULL,
  vacunas                   TINYINT(1)   NULL,
  hepatitis_b               TINYINT(1)   NULL,
  id_grupo_sanguineo        CHAR(36)     NULL,
  fuma                      TINYINT(1)   NULL,
  cigarrillos_dia           INT          NULL,
  toma_te                   TINYINT(1)   NULL,
  tazas_te_dia              INT          NULL,
  toma_alcohol              TINYINT(1)   NULL,
  frecuencia_alcohol        VARCHAR(100) NULL,
  aprieta_dientes           TINYINT(1)   NULL,
  momento_aprieta           VARCHAR(100) NULL,
  rechina                   TINYINT(1)   NULL,
  dolor_muscular            TINYINT(1)   NULL,
  chupa_dedo                TINYINT(1)   NULL,
  muerde_objetos            TINYINT(1)   NULL,
  muerde_labios             TINYINT(1)   NULL,
  otros_habitos             TEXT         NULL,
  frecuencia_cepillado      VARCHAR(100) NULL,
  cepillo_duro              TINYINT(1)   NULL,
  cepillo_mediano           TINYINT(1)   NULL,
  cepillo_blando            TINYINT(1)   NULL,
  cepillo_electrico         TINYINT(1)   NULL,
  cepillo_interproximal     TINYINT(1)   NULL,
  tipo_interproximal        VARCHAR(100) NULL,
  seda_dental               TINYINT(1)   NULL,
  enjuague_bucal            TINYINT(1)   NULL,
  otros_elementos_higiene   TEXT         NULL,
  FOREIGN KEY (id_historia)        REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_grupo_sanguineo) REFERENCES catalogo_grupo_sanguineo(id_grupo_sanguineo) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS antecedente_medico (
  id_ant_patologico          CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia                CHAR(36)     NOT NULL UNIQUE,
  salud_general              VARCHAR(200) NULL,
  bajo_tratamiento           TINYINT(1)   NULL,
  tipo_tratamiento           TEXT         NULL,
  hospitalizaciones          TEXT         NULL,
  tuvo_traumatismos          TINYINT(1)   NULL,
  tipo_traumatismos          TEXT         NULL,
  alergias                   TINYINT(1)   NULL,
  medicamentos_contraindicados TEXT       NULL,
  enf_hepatitis              TINYINT(1)   NULL,
  enf_alergia_cronica        TINYINT(1)   NULL,
  enf_corazon                TINYINT(1)   NULL,
  enf_fiebre_reumatica       TINYINT(1)   NULL,
  enf_anemia                 TINYINT(1)   NULL,
  enf_asma                   TINYINT(1)   NULL,
  enf_diabetes               TINYINT(1)   NULL,
  enf_epilepsia              TINYINT(1)   NULL,
  enf_coagulacion            TINYINT(1)   NULL,
  enf_tbc                    TINYINT(1)   NULL,
  enf_hipertension           TINYINT(1)   NULL,
  enf_ulcera                 TINYINT(1)   NULL,
  enf_neurologica            TINYINT(1)   NULL,
  otras_enf_patologicas      TEXT         NULL,
  odontologicos              TEXT         NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS antecedente_familiar (
  id_ant_fam  CHAR(36) NOT NULL PRIMARY KEY,
  id_historia CHAR(36) NOT NULL UNIQUE,
  descripcion TEXT     NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS antecedente_cumplimiento (
  id_ant_cumplimiento       CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia               CHAR(36)     NOT NULL UNIQUE,
  motivo_dolor              TINYINT(1)   NULL,
  motivo_control            TINYINT(1)   NULL,
  frecuencia_control_meses  INT          NULL,
  motivo_limpieza           TINYINT(1)   NULL,
  frecuencia_limpieza_meses INT          NULL,
  actitud_tranquilo         TINYINT(1)   NULL,
  actitud_aprensivo         TINYINT(1)   NULL,
  actitud_panico            TINYINT(1)   NULL,
  desagrado_atencion        TINYINT(1)   NULL,
  fecha_consentimiento      DATE         NULL,
  firma_nombre              VARCHAR(200) NULL,
  historia_elaborada_por    VARCHAR(200) NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

-- ============================================================
-- SECCIÓN 5: EXAMEN FÍSICO
-- ============================================================

-- Catálogos
CREATE TABLE IF NOT EXISTS catalogo_posicion      (id_posicion  CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(200) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS catalogo_atm_trayectoria (id_trayectoria CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(200) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS catalogo_dolor_grado   (id_grado     CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(50) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS catalogo_medida_regional (id_medida  CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(200) NOT NULL UNIQUE);

CREATE TABLE IF NOT EXISTS examen_general (
  id_examen               CHAR(36)      NOT NULL PRIMARY KEY,
  id_historia             CHAR(36)      NOT NULL UNIQUE,
  posicion                VARCHAR(100)  NULL,
  actitud                 VARCHAR(100)  NULL,
  deambulacion            VARCHAR(100)  NULL,
  facies                  VARCHAR(100)  NULL,
  facies_obs              TEXT          NULL,
  conciencia              VARCHAR(100)  NULL,
  constitucion            VARCHAR(100)  NULL,
  estado_nutritivo        VARCHAR(100)  NULL,
  temperatura             DECIMAL(4,1)  NULL,
  presion_arterial        VARCHAR(20)   NULL,
  frecuencia_respiratoria INT           NULL,
  pulso                   INT           NULL,
  peso                    DECIMAL(5,2)  NULL,
  talla                   DECIMAL(5,2)  NULL,
  piel_color              VARCHAR(100)  NULL,
  piel_humedad            VARCHAR(100)  NULL,
  piel_lesiones           TINYINT(1)    NULL,
  piel_lesiones_obs       TEXT          NULL,
  piel_anexos             TINYINT(1)    NULL,
  piel_anexos_obs         TEXT          NULL,
  tcs_distribucion        VARCHAR(100)  NULL,
  tcs_distribucion_obs    TEXT          NULL,
  tcs_cantidad            VARCHAR(100)  NULL,
  ganglios                TINYINT(1)    NULL,
  ganglios_obs            TEXT          NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS examen_regional (
  id_regional                   CHAR(36)      NOT NULL PRIMARY KEY,
  id_historia                   CHAR(36)      NOT NULL UNIQUE,
  cabeza_posicion               VARCHAR(100)  NULL,
  cabeza_movimientos            VARCHAR(100)  NULL,
  cabeza_movimientos_obs        TEXT          NULL,
  craneo_tamano                 VARCHAR(100)  NULL,
  craneo_forma                  VARCHAR(100)  NULL,
  cara_forma_frente             VARCHAR(100)  NULL,
  cara_forma_perfil             VARCHAR(100)  NULL,
  ojos_cejas_adecuada           TINYINT(1)    NULL,
  ojos_implantacion_obs         TEXT          NULL,
  ojos_escleroticas             VARCHAR(100)  NULL,
  ojos_agudeza_visual           VARCHAR(100)  NULL,
  ojos_iris_color               VARCHAR(100)  NULL,
  ojos_arco_senil               TINYINT(1)    NULL,
  nariz_forma                   VARCHAR(100)  NULL,
  nariz_permeables              TINYINT(1)    NULL,
  nariz_secreciones             TINYINT(1)    NULL,
  nariz_senos_dolorosos         TINYINT(1)    NULL,
  oidos_anomalias_morfologicas  TINYINT(1)    NULL,
  oidos_anomalias_obs           TEXT          NULL,
  oidos_secreciones             TINYINT(1)    NULL,
  oidos_audicion_conservada     TINYINT(1)    NULL,
  atm_trayectoria               VARCHAR(100)  NULL,
  atm_lat_izq_dolor             TINYINT(1)    NULL,
  atm_lat_izq_ruido             TINYINT(1)    NULL,
  atm_lat_izq_salto             TINYINT(1)    NULL,
  atm_lat_der_dolor             TINYINT(1)    NULL,
  atm_lat_der_ruido             TINYINT(1)    NULL,
  atm_lat_der_salto             TINYINT(1)    NULL,
  atm_prot_dolor                TINYINT(1)    NULL,
  atm_prot_ruido                TINYINT(1)    NULL,
  atm_prot_salto                TINYINT(1)    NULL,
  atm_aper_dolor                TINYINT(1)    NULL,
  atm_aper_ruido                TINYINT(1)    NULL,
  atm_aper_salto                TINYINT(1)    NULL,
  atm_cierre_dolor              TINYINT(1)    NULL,
  atm_cierre_ruido              TINYINT(1)    NULL,
  atm_cierre_salto              TINYINT(1)    NULL,
  atm_coordinacion_condilar     VARCHAR(100)  NULL,
  atm_apertura_maxima_mm        DECIMAL(5,2)  NULL,
  atm_observaciones             TEXT          NULL,
  atm_musculos_dolor            TINYINT(1)    NULL,
  atm_musculos_dolor_grado      VARCHAR(50)   NULL,
  atm_musculos_dolor_zona       VARCHAR(200)  NULL,
  cuello_simetrico              TINYINT(1)    NULL,
  cuello_simetrico_obs          TEXT          NULL,
  cuello_movilidad_conservada   TINYINT(1)    NULL,
  cuello_movilidad_obs          TEXT          NULL,
  laringe_alineada              TINYINT(1)    NULL,
  laringe_alineada_obs          TEXT          NULL,
  cuello_otros                  TEXT          NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS examen_clinico_boca (
  id_boca                              CHAR(36)      NOT NULL PRIMARY KEY,
  id_historia                          CHAR(36)      NOT NULL UNIQUE,
  labios_sin_lesiones                  TINYINT(1)    NULL,
  labios_con_lesiones                  TEXT          NULL,
  vestibulo_sin_lesiones               TINYINT(1)    NULL,
  vestibulo_con_lesiones               TEXT          NULL,
  carrillos_retromolar_sin_lesiones    TINYINT(1)    NULL,
  carrillos_retromolar_con_lesiones    TEXT          NULL,
  paladar_sin_lesiones                 TINYINT(1)    NULL,
  paladar_con_lesiones                 TEXT          NULL,
  orofaringe_sin_lesiones              TINYINT(1)    NULL,
  orofaringe_con_lesiones              TEXT          NULL,
  piso_boca_sin_lesiones               TINYINT(1)    NULL,
  piso_boca_con_lesiones               TEXT          NULL,
  lengua_sin_lesiones                  TINYINT(1)    NULL,
  lengua_con_lesiones                  TEXT          NULL,
  encia_sin_lesiones                   TINYINT(1)    NULL,
  encia_con_lesiones                   TEXT          NULL,
  oclusion_molar_der                   VARCHAR(50)   NULL,
  oclusion_molar_izq                   VARCHAR(50)   NULL,
  oclusion_canina_der                  VARCHAR(50)   NULL,
  oclusion_canina_izq                  VARCHAR(50)   NULL,
  oclusion_mordida_cruzada             TINYINT(1)    NULL,
  oclusion_vestibuloclusion            TINYINT(1)    NULL,
  oclusion_overbite                    DECIMAL(4,1)  NULL,
  oclusion_mordida_abierta             TINYINT(1)    NULL,
  oclusion_sobremordida                TINYINT(1)    NULL,
  oclusion_relacion_vertical_otros     TEXT          NULL,
  oclusion_overjet                     DECIMAL(4,1)  NULL,
  oclusion_protrusion                  TINYINT(1)    NULL,
  oclusion_guia_incisiva               VARCHAR(100)  NULL,
  oclusion_contacto_posterior          TINYINT(1)    NULL,
  lat_der_guia_canina                  TINYINT(1)    NULL,
  lat_der_funcion_grupo                TINYINT(1)    NULL,
  lat_der_contacto_balance             TINYINT(1)    NULL,
  lat_der_describa                     TEXT          NULL,
  lat_izq_guia_canina                  TINYINT(1)    NULL,
  lat_izq_funcion_grupo                TINYINT(1)    NULL,
  lat_izq_contacto_balance             TINYINT(1)    NULL,
  lat_izq_describa                     TEXT          NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS examen_higiene_oral (
  id_higiene      CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia     CHAR(36)     NOT NULL,
  estado_higiene  VARCHAR(100) NULL,
  fecha_registro  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

-- ============================================================
-- SECCIÓN 6: DIAGNÓSTICO, DERIVACIÓN, EVOLUCIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS diagnostico (
  id_diagnostico          CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia             CHAR(36)     NOT NULL,
  tipo                    VARCHAR(50)  NOT NULL COMMENT 'presuntivo | definitivo_clinicas',
  descripcion             TEXT         NULL,
  fecha                   DATE         NULL,
  clinica_respuesta       VARCHAR(200) NULL,
  examenes_auxiliares     JSON         NULL,
  interconsulta_detalle   VARCHAR(200) NULL,
  fecha_interconsulta     DATE         NULL,
  clinica_interconsulta   VARCHAR(200) NULL,
  diagnostico_definitivo  TEXT         NULL,
  tratamiento_realizar    TEXT         NULL,
  pronostico              VARCHAR(200) NULL,
  alumno_tratante         VARCHAR(200) NULL,
  created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evolucion (
  id_evolucion  INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_historia   CHAR(36)     NOT NULL,
  fecha         DATE         NULL,
  actividad     TEXT         NULL,
  alumno        VARCHAR(200) NULL,
  observaciones TEXT         NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS derivacion_clinicas (
  id_derivacion      INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_historia        CHAR(36)     NOT NULL,
  destinos           JSON         NULL,
  observaciones      TEXT         NULL,
  fecha_derivacion   DATE         NULL,
  alumno_diagnostico VARCHAR(200) NULL,
  docente            VARCHAR(200) NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE
);

-- ============================================================
-- SECCIÓN 7: ODONTOGRAMA Y MEDICAMENTOS
-- ============================================================

CREATE TABLE IF NOT EXISTS odontograma_entrada (
  id_entrada    CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia   CHAR(36)     NOT NULL,
  numero_diente SMALLINT     NOT NULL COMMENT 'Notación FDI: 11-48 permanentes, 51-85 temporales',
  superficie    VARCHAR(20)  NULL COMMENT 'vestibular|lingual|mesial|distal|oclusal',
  diagnostico   TEXT         NULL,
  tratamiento   TEXT         NULL,
  fecha         DATE         NOT NULL DEFAULT (CURRENT_DATE),
  alumno        VARCHAR(200) NULL,
  id_usuario    CHAR(36)     NULL,
  FOREIGN KEY (id_historia)  REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario)   REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS prescripcion (
  id_prescripcion CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia     CHAR(36)     NOT NULL,
  medicamento     VARCHAR(300) NOT NULL,
  dosis           VARCHAR(200) NULL,
  duracion        VARCHAR(100) NULL,
  fecha           DATE         NOT NULL DEFAULT (CURRENT_DATE),
  prescriptor     VARCHAR(200) NULL,
  id_usuario      CHAR(36)     NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- ============================================================
-- SECCIÓN 8: ADJUNTOS (metadatos — archivos en Supabase Storage)
-- ============================================================

CREATE TABLE IF NOT EXISTS adjunto (
  id_adjunto      CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia     CHAR(36)     NOT NULL,
  nombre_original VARCHAR(500) NOT NULL,
  nombre_storage  VARCHAR(500) NOT NULL COMMENT 'Ruta en Supabase bucket (swappable a S3)',
  tipo_mime       VARCHAR(100) NOT NULL,
  tamano_bytes    INT          NOT NULL,
  descripcion     TEXT         NULL,
  fecha_subida    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_usuario      CHAR(36)     NULL,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- ============================================================
-- SECCIÓN 9: FICHAS DE OPERACIÓN Y EVALUACIÓN
-- ============================================================

CREATE TABLE IF NOT EXISTS ficha_operacion (
  id_ficha      CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia   CHAR(36)     NOT NULL,
  diagnostico   TEXT         NULL,
  procedimiento TEXT         NOT NULL,
  materiales    TEXT         NULL,
  observaciones TEXT         NULL,
  estado        VARCHAR(50)  NOT NULL DEFAULT 'borrador' COMMENT 'borrador|finalizado',
  fecha         DATE         NOT NULL DEFAULT (CURRENT_DATE),
  alumno        VARCHAR(200) NULL,
  id_usuario    CHAR(36)     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- Historial de cambios por campo (HU-22)
CREATE TABLE IF NOT EXISTS ficha_operacion_auditoria (
  id              CHAR(36)     NOT NULL PRIMARY KEY,
  id_ficha        CHAR(36)     NOT NULL,
  campo           VARCHAR(100) NOT NULL,
  valor_anterior  TEXT         NULL,
  valor_nuevo     TEXT         NULL,
  id_usuario      CHAR(36)     NULL,
  fecha           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ficha)    REFERENCES ficha_operacion(id_ficha) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ficha_evaluacion (
  id_evaluacion    CHAR(36)      NOT NULL PRIMARY KEY,
  id_ficha         CHAR(36)      NOT NULL,
  id_historia      CHAR(36)      NOT NULL,
  puntaje_total    DECIMAL(5,2)  NULL COMMENT '0.00 - 100.00',
  comentarios      TEXT          NULL,
  estado           VARCHAR(50)   NOT NULL DEFAULT 'pendiente' COMMENT 'pendiente|validado|requiere_correccion',
  id_docente       CHAR(36)      NULL,
  fecha_evaluacion DATETIME      NULL,
  FOREIGN KEY (id_ficha)   REFERENCES ficha_operacion(id_ficha) ON DELETE CASCADE,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_docente) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- ============================================================
-- SECCIÓN 9b: CONSENTIMIENTO INFORMADO (RF-09)
-- Añadido en migración 001_consentimiento_informado.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS consentimiento_informado (
  id_consentimiento    CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia          CHAR(36)     NOT NULL,
  tipo_template        VARCHAR(50)  NOT NULL
    COMMENT 'adulto_general|cirugia_oral|menor_de_edad|anestesia_local',
  nombre_paciente      VARCHAR(300) NOT NULL,
  nombre_responsable   VARCHAR(300) NULL
    COMMENT 'Para tipo menor_de_edad: nombre del padre/madre/tutor',
  fecha_consentimiento DATE         NOT NULL DEFAULT (CURRENT_DATE),
  firmado              TINYINT(1)   NOT NULL DEFAULT 0
    COMMENT 'Reservado para firma digital futura',
  id_usuario           CHAR(36)     NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_historia) REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_usuario)  REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_consentimiento_historia
  ON consentimiento_informado (id_historia, created_at);

-- ============================================================
-- SECCIÓN 10: NOTIFICACIONES
-- ============================================================

CREATE TABLE IF NOT EXISTS notificacion (
  id_notificacion  CHAR(36)     NOT NULL PRIMARY KEY,
  id_destinatario  CHAR(36)     NOT NULL,
  titulo           VARCHAR(300) NOT NULL,
  mensaje          TEXT         NOT NULL,
  tipo             VARCHAR(50)  NOT NULL COMMENT 'transfer|validacion|cita|evaluacion|sistema',
  leida            TINYINT(1)   NOT NULL DEFAULT 0,
  id_referencia    CHAR(36)     NULL COMMENT 'ID de la entidad relacionada (HC, cita, etc.)',
  fecha            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_destinatario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- ============================================================
-- SECCIÓN 11: CITAS
-- ============================================================

CREATE TABLE IF NOT EXISTS cita (
  id_cita       CHAR(36)     NOT NULL PRIMARY KEY,
  id_historia   CHAR(36)     NOT NULL,
  id_estudiante CHAR(36)     NOT NULL,
  fecha_hora    DATETIME     NOT NULL,
  duracion_min  INT          NOT NULL DEFAULT 60,
  motivo        TEXT         NULL,
  estado        VARCHAR(50)  NOT NULL DEFAULT 'programada' COMMENT 'programada|confirmada|cancelada|completada',
  id_usuario    CHAR(36)     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_historia)   REFERENCES historia_clinica(id_historia) ON DELETE CASCADE,
  FOREIGN KEY (id_estudiante) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
  FOREIGN KEY (id_usuario)    REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- ============================================================
-- SECCIÓN 12: EQUIPOS Y PRÉSTAMOS
-- ============================================================

CREATE TABLE IF NOT EXISTS equipo (
  id_equipo   CHAR(36)     NOT NULL PRIMARY KEY,
  nombre      VARCHAR(300) NOT NULL,
  descripcion TEXT         NULL,
  codigo      VARCHAR(100) NULL UNIQUE,
  estado      VARCHAR(50)  NOT NULL DEFAULT 'disponible' COMMENT 'disponible|prestado|mantenimiento'
);

CREATE TABLE IF NOT EXISTS prestamo_equipo (
  id_prestamo               CHAR(36)  NOT NULL PRIMARY KEY,
  id_equipo                 CHAR(36)  NOT NULL,
  id_estudiante             CHAR(36)  NOT NULL,
  fecha_prestamo            DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_devolucion_prevista DATETIME  NULL,
  fecha_devolucion_real     DATETIME  NULL,
  estado                    VARCHAR(50) NOT NULL DEFAULT 'activo' COMMENT 'activo|devuelto|vencido',
  id_admin                  CHAR(36)  NULL,
  FOREIGN KEY (id_equipo)     REFERENCES equipo(id_equipo) ON DELETE RESTRICT,
  FOREIGN KEY (id_estudiante) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
  FOREIGN KEY (id_admin)      REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- ============================================================
-- SECCIÓN 13: AUDITORÍA
-- ============================================================

CREATE TABLE IF NOT EXISTS auditoria (
  id_auditoria          CHAR(36)     NOT NULL PRIMARY KEY,
  id_usuario            CHAR(36)     NULL,
  fecha_cambio          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  nombre_tabla          VARCHAR(100) NULL,
  id_registro_afectado  CHAR(36)     NULL,
  accion                VARCHAR(20)  NULL COMMENT 'POST|PUT|PATCH|DELETE',
  datos_anteriores      JSON         NULL,
  datos_nuevos          JSON         NULL,
  ip_address            VARCHAR(45)  NULL,
  user_agent            TEXT         NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- ============================================================
-- SECCIÓN 14: CATÁLOGOS CLÍNICOS
-- ============================================================

CREATE TABLE IF NOT EXISTS catalogo_sexo              (id_sexo        CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(50) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS catalogo_estado_civil      (id_estado_civil CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(100) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS catalogo_ocupacion         (id_ocupacion   CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(200) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS catalogo_grado_instruccion (id_grado_instruccion CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(200) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS catalogo_clinica           (id_clinica     CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(200) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS catalogo_examen_auxiliar   (id_examen      CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(200) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS catalogo_enfermedad        (id_enfermedad  CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(200) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS catalogo_habito            (id_habito      CHAR(36) NOT NULL PRIMARY KEY, descripcion VARCHAR(200) NOT NULL UNIQUE);

-- ============================================================
-- SECCIÓN 15: ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================

-- Historia clínica: búsqueda por estudiante y estado
CREATE INDEX IF NOT EXISTS idx_hc_estudiante ON historia_clinica (id_estudiante);
CREATE INDEX IF NOT EXISTS idx_hc_estado     ON historia_clinica (estado);
CREATE INDEX IF NOT EXISTS idx_hc_fecha      ON historia_clinica (fecha_elaboracion);

-- Diagnóstico: búsqueda por historia y tipo
CREATE INDEX IF NOT EXISTS idx_diagnostico_historia ON diagnostico (id_historia, tipo);

-- Notificaciones: consultas frecuentes de bandeja
CREATE INDEX IF NOT EXISTS idx_notif_destinatario ON notificacion (id_destinatario, leida, fecha);

-- Citas: verificación de solapamiento
CREATE INDEX IF NOT EXISTS idx_cita_estudiante_fecha ON cita (id_estudiante, fecha_hora, estado);

-- Auditoría: búsqueda por registro
CREATE INDEX IF NOT EXISTS idx_audit_registro ON auditoria (id_registro_afectado, fecha_cambio);

-- Odontograma: por historia y diente
CREATE INDEX IF NOT EXISTS idx_odonto_historia ON odontograma_entrada (id_historia, numero_diente);

-- ============================================================
-- SECCIÓN 16: DATOS SEMILLA
-- ============================================================

-- Estados de revisión
INSERT IGNORE INTO catalogo_estado_revision (id_estado_revision, nombre) VALUES
  (UUID(), 'Pendiente'),
  (UUID(), 'En revisión'),
  (UUID(), 'Aprobada'),
  (UUID(), 'Rechazada'),
  (UUID(), 'Requiere corrección');

-- Grupos sanguíneos (FDI)
INSERT IGNORE INTO catalogo_grupo_sanguineo (id_grupo_sanguineo, descripcion) VALUES
  (UUID(), 'O+'), (UUID(), 'O-'),
  (UUID(), 'A+'), (UUID(), 'A-'),
  (UUID(), 'B+'), (UUID(), 'B-'),
  (UUID(), 'AB+'), (UUID(), 'AB-');

-- Sexo
INSERT IGNORE INTO catalogo_sexo (id_sexo, descripcion) VALUES
  (UUID(), 'Masculino'), (UUID(), 'Femenino'), (UUID(), 'Otro');

-- Estado civil
INSERT IGNORE INTO catalogo_estado_civil (id_estado_civil, descripcion) VALUES
  (UUID(), 'Soltero/a'), (UUID(), 'Casado/a'), (UUID(), 'Conviviente'),
  (UUID(), 'Divorciado/a'), (UUID(), 'Viudo/a');

-- Clínicas de derivación
INSERT IGNORE INTO catalogo_clinica (id_clinica, descripcion) VALUES
  (UUID(), 'Cirugía Oral y Maxilofacial'),
  (UUID(), 'Ortodoncia'),
  (UUID(), 'Endodoncia'),
  (UUID(), 'Periodoncia'),
  (UUID(), 'Rehabilitación Oral'),
  (UUID(), 'Odontopediatría'),
  (UUID(), 'Radiología Oral');

-- Usuario administrador por defecto (contraseña: Admin2024! — cambiar en producción)
-- Hash generado con argon2: argon2id
INSERT IGNORE INTO usuario (id_usuario, codigo_usuario, nombre, apellido, email, rol, contrasena_hash) VALUES
  (UUID(), 'admin001', 'Administrador', 'Sistema',
   'admin@unjbg.edu.pe', 'administrador',
   '$argon2id$v=19$m=65536,t=3,p=4$placeholder-hash-cambiar-en-produccion');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
-- NOTAS DE MIGRACIÓN:
-- 1. Este schema es el canónico. NeonDB (PostgreSQL) tiene el mismo diseño.
-- 2. Los repositorios usan $N placeholders; db/db.js convierte a ? para MySQL.
-- 3. No hay stored procedures. Toda la lógica está en los repositorios JS.
-- 4. Para migrar de NeonDB a MySQL: exportar datos con pg_dump --data-only
--    y reimportar después de ejecutar este script.
-- 5. La columna contrasena_hash del usuario semilla debe reemplazarse con
--    un hash real antes de ir a producción.
-- ============================================================
