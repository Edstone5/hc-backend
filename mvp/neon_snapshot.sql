--
-- PostgreSQL database dump
--

\restrict 056XbcYKUG9dgF7uLjuUsfVeaol1759B8Vgff3N2Jwibdbv7tL6mcDqnRBRBfmU

-- Dumped from database version 14.23 (b9ad182)
-- Dumped by pg_dump version 16.14 (Debian 16.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: d_paciente(uuid); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.d_paciente(IN p_id_paciente uuid)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar que el paciente existe
    IF NOT EXISTS (SELECT 1 FROM paciente WHERE id_paciente = p_id_paciente) THEN
        RAISE EXCEPTION 'No existe un paciente con el ID proporcionado';
    END IF;

    -- Verificar si el paciente tiene historias clínicas asociadas
    IF EXISTS (SELECT 1 FROM historia_clinica WHERE id_paciente = p_id_paciente) THEN
        RAISE NOTICE 'El paciente tiene historias clínicas asociadas. Se realizará borrado lógico.';
    END IF;

    -- Realizar borrado lógico (desactivar)
    UPDATE paciente
    SET activo = FALSE
    WHERE id_paciente = p_id_paciente;

    RAISE NOTICE 'Paciente desactivado exitosamente: %', p_id_paciente;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al desactivar paciente: %', SQLERRM;
END;
$$;


--
-- Name: fn_asignar_paciente_a_historia(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_asignar_paciente_a_historia(p_id_historia uuid, p_id_paciente uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_estado_actual VARCHAR(50);
    v_paciente_existe BOOLEAN;
    v_paciente_tiene_historia BOOLEAN;
BEGIN
    -- Verificar que la historia clínica existe y obtener su estado
    SELECT estado INTO v_estado_actual
    FROM historia_clinica
    WHERE id_historia = p_id_historia;
    
    IF v_estado_actual IS NULL THEN
        RAISE EXCEPTION 'Historia clínica no encontrada con ID: %', p_id_historia;
    END IF;
    
    -- Verificar que la historia está en estado borrador
    IF v_estado_actual != 'borrador' THEN
        RAISE EXCEPTION 'La historia clínica no está en estado borrador. Estado actual: %', v_estado_actual;
    END IF;
    
    -- Verificar que el paciente existe
    SELECT EXISTS(
        SELECT 1 FROM paciente WHERE id_paciente = p_id_paciente
    ) INTO v_paciente_existe;
    
    IF NOT v_paciente_existe THEN
        RAISE EXCEPTION 'Paciente no encontrado con ID: %', p_id_paciente;
    END IF;
    
    -- Verificar que el paciente no tiene otra historia asignada
    SELECT EXISTS(
        SELECT 1 
        FROM historia_clinica 
        WHERE id_paciente = p_id_paciente 
          AND id_historia != p_id_historia
    ) INTO v_paciente_tiene_historia;
    
    IF v_paciente_tiene_historia THEN
        RAISE EXCEPTION 'El paciente ya tiene una historia clínica asignada';
    END IF;
    
    -- Asignar el paciente y cambiar el estado
    UPDATE historia_clinica
    SET 
        id_paciente = p_id_paciente,
        estado = 'en_proceso',
        ultima_modificacion = CURRENT_TIMESTAMP
    WHERE id_historia = p_id_historia;
    
    RAISE NOTICE 'Paciente % asignado a historia % exitosamente', p_id_paciente, p_id_historia;
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al asignar paciente: %', SQLERRM;
END;
$$;


--
-- Name: FUNCTION fn_asignar_paciente_a_historia(p_id_historia uuid, p_id_paciente uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_asignar_paciente_a_historia(p_id_historia uuid, p_id_paciente uuid) IS 'Asigna un paciente a una historia clínica en estado borrador y la cambia a estado en_proceso. Valida que la historia esté en borrador y que el paciente no tenga otra historia asignada.';


--
-- Name: fn_auditoria_automatica(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_auditoria_automatica() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_usuario UUID;
    v_datos_anteriores JSONB;
    v_datos_nuevos JSONB;
    v_id_registro UUID;
    v_json_data JSONB;
    v_key TEXT;
BEGIN
    -- Intentar obtener usuario de la sesión (si tu backend lo envía así)
    -- Si no, usaremos un valor por defecto o NULL
    BEGIN
        v_id_usuario := current_setting('app.current_user_id', true)::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_id_usuario := NULL; -- Se guardará como NULL si no hay usuario en sesión
    END;

    IF (TG_OP = 'DELETE') THEN
        v_datos_anteriores := row_to_json(OLD)::JSONB;
        v_datos_nuevos := NULL;
        v_json_data := v_datos_anteriores;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_datos_anteriores := row_to_json(OLD)::JSONB;
        v_datos_nuevos := row_to_json(NEW)::JSONB;
        v_json_data := v_datos_nuevos;
    ELSIF (TG_OP = 'INSERT') THEN
        v_datos_anteriores := NULL;
        v_datos_nuevos := row_to_json(NEW)::JSONB;
        v_json_data := v_datos_nuevos;
    END IF;
    
    -- Intentar adivinar el ID del registro (id_higiene, id_paciente, etc.)
    -- Buscamos primero por convención 'id_' + nombre_tabla
    v_key := 'id_' || TG_TABLE_NAME;
    v_id_registro := (v_json_data->>v_key)::UUID;
    
    -- Si no encuentra, busca 'id' genérico
    IF v_id_registro IS NULL THEN
        v_id_registro := (v_json_data->>'id')::UUID;
    END IF;

    -- Insertar en la tabla central de auditoría
    INSERT INTO auditoria (
        id_usuario, -- Puede ser NULL si no se setea la variable de sesión
        fecha_cambio,
        nombre_tabla,
        id_registro_afectado,
        accion,
        datos_anteriores,
        datos_nuevos
    ) VALUES (
        COALESCE(v_id_usuario, '00000000-0000-0000-0000-000000000000'), -- ID System por defecto
        NOW(),
        TG_TABLE_NAME,
        COALESCE(v_id_registro, '00000000-0000-0000-0000-000000000000'), -- Fallback si no halla ID
        TG_OP,
        v_datos_anteriores,
        v_datos_nuevos
    );
    
    IF (TG_OP = 'DELETE') THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;


--
-- Name: fn_buscar_paciente_por_dni(character); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_buscar_paciente_por_dni(p_dni character) RETURNS TABLE(id_paciente uuid, nombre character varying, apellido character varying, nombre_completo character varying, dni character, fecha_nacimiento date, edad integer, id_sexo uuid, sexo_descripcion character varying, telefono character varying, email character varying, fecha_registro timestamp without time zone, activo boolean, tiene_historia_clinica boolean)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    -- Validar formato de DNI
    IF NOT (p_dni ~ '^\d{8}$') THEN
        RAISE EXCEPTION 'El DNI debe tener exactamente 8 dígitos numéricos';
    END IF;

    RETURN QUERY
    SELECT 
        p.id_paciente,
        p.nombre,
        p.apellido,
        (p.nombre || ' ' || p.apellido)::VARCHAR(400) AS nombre_completo,
        p.dni,
        p.fecha_nacimiento,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.fecha_nacimiento))::INT AS edad,
        p.id_sexo,
        cs.descripcion AS sexo_descripcion,
        p.telefono,
        p.email,
        p.fecha_registro,
        p.activo,
        EXISTS(SELECT 1 FROM historia_clinica hc WHERE hc.id_paciente = p.id_paciente) AS tiene_historia_clinica
    FROM paciente p
    INNER JOIN catalogo_sexo cs ON p.id_sexo = cs.id_sexo
    WHERE p.dni = p_dni;
END;
$_$;


--
-- Name: FUNCTION fn_buscar_paciente_por_dni(p_dni character); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_buscar_paciente_por_dni(p_dni character) IS 'Busca un paciente por su DNI con validación de formato';


--
-- Name: fn_crear_historia_clinica(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_crear_historia_clinica(p_id_estudiante uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_paciente uuid;
    v_id_historia_clinica uuid;
BEGIN
    -- Crear historia clínica con el paciente generado
    INSERT INTO historia_clinica (id_estudiante)
    VALUES (p_id_estudiante)
    RETURNING id_historia INTO v_id_historia_clinica;

    RETURN v_id_historia_clinica;
END;
$$;


--
-- Name: fn_crear_paciente(character varying, character varying, character, date, character varying, character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_crear_paciente(p_nombre character varying, p_apellido character varying, p_dni character DEFAULT NULL::bpchar, p_fecha_nacimiento date DEFAULT NULL::date, p_sexo character varying DEFAULT NULL::character varying, p_telefono character varying DEFAULT NULL::character varying, p_email character varying DEFAULT NULL::character varying) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_paciente UUID;
BEGIN
    -- Insertar el paciente (sexo como varchar, no catálogo)
    INSERT INTO paciente (
        nombre,
        apellido,
        dni,
        fecha_nacimiento,
        sexo,
        telefono,
        email,
        fecha_registro,
        activo
    ) VALUES (
        p_nombre,
        p_apellido,
        p_dni,
        p_fecha_nacimiento,
        p_sexo,
        p_telefono,
        p_email,
        CURRENT_TIMESTAMP,
        TRUE
    )
    RETURNING id_paciente INTO v_id_paciente;

    RETURN v_id_paciente;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Ya existe un paciente registrado con el DNI: %', p_dni;
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Error de integridad referencial: %', SQLERRM;
    WHEN check_violation THEN
        RAISE EXCEPTION 'Error de validación de datos: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al crear paciente: %', SQLERRM;
END;
$$;


--
-- Name: FUNCTION fn_crear_paciente(p_nombre character varying, p_apellido character varying, p_dni character, p_fecha_nacimiento date, p_sexo character varying, p_telefono character varying, p_email character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_crear_paciente(p_nombre character varying, p_apellido character varying, p_dni character, p_fecha_nacimiento date, p_sexo character varying, p_telefono character varying, p_email character varying) IS 'Crea un nuevo paciente y retorna su UUID';


--
-- Name: fn_listar_historias_clinicas_adultos_por_estudiante(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_listar_historias_clinicas_adultos_por_estudiante(p_id_estudiante uuid) RETURNS TABLE(id_historia uuid, id_estudiante uuid, id_paciente uuid, dni character, nombre character varying, apellido character varying, fecha_nacimiento date, edad integer, sexo character varying, telefono character varying, email character varying, fecha_registro timestamp without time zone, activo boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hc.id_historia,
        hc.id_estudiante,
        p.id_paciente,
        p.dni,
        p.nombre,
        p.apellido,
        p.fecha_nacimiento,
        CASE 
            WHEN p.fecha_nacimiento IS NOT NULL THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.fecha_nacimiento))::INTEGER
            ELSE NULL
        END AS edad,
        p.sexo, -- ahora selecciona el varchar directamente
        p.telefono,
        p.email,
        p.fecha_registro,
        p.activo
    FROM historia_clinica hc
    LEFT JOIN paciente p ON hc.id_paciente = p.id_paciente
    WHERE hc.id_estudiante = p_id_estudiante
      AND (p.fecha_nacimiento IS NULL OR EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.fecha_nacimiento)) >= 18);
END;
$$;


--
-- Name: FUNCTION fn_listar_historias_clinicas_adultos_por_estudiante(p_id_estudiante uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_listar_historias_clinicas_adultos_por_estudiante(p_id_estudiante uuid) IS 'Devuelve todas las historias clínicas de un estudiante específico con los datos del paciente mayor de 18 años. Si la historia no tiene paciente asociado, los datos del paciente serán NULL.';


--
-- Name: fn_listar_pacientes(boolean, character varying, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_listar_pacientes(p_activo boolean DEFAULT NULL::boolean, p_busqueda character varying DEFAULT NULL::character varying, p_limite integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(id_paciente uuid, nombre character varying, apellido character varying, nombre_completo character varying, dni character, fecha_nacimiento date, edad integer, sexo_descripcion character varying, telefono character varying, email character varying, fecha_registro timestamp without time zone, activo boolean, tiene_historia_clinica boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id_paciente,
        p.nombre,
        p.apellido,
        (p.nombre || ' ' || p.apellido)::VARCHAR(400) AS nombre_completo,
        p.dni,
        p.fecha_nacimiento,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.fecha_nacimiento))::INT AS edad,
        cs.descripcion AS sexo_descripcion,
        p.telefono,
        p.email,
        p.fecha_registro,
        p.activo,
        EXISTS(SELECT 1 FROM historia_clinica hc WHERE hc.id_paciente = p.id_paciente) AS tiene_historia_clinica
    FROM paciente p
    INNER JOIN catalogo_sexo cs ON p.id_sexo = cs.id_sexo
    WHERE 
        -- Filtro por estado activo
        (p_activo IS NULL OR p.activo = p_activo)
        AND
        -- Filtro por búsqueda en nombre, apellido o DNI
        (
            p_busqueda IS NULL 
            OR p.nombre ILIKE '%' || p_busqueda || '%'
            OR p.apellido ILIKE '%' || p_busqueda || '%'
            OR (p.nombre || ' ' || p.apellido) ILIKE '%' || p_busqueda || '%'
            OR p.dni LIKE '%' || p_busqueda || '%'
        )
    ORDER BY p.fecha_registro DESC
    LIMIT p_limite
    OFFSET p_offset;
END;
$$;


--
-- Name: FUNCTION fn_listar_pacientes(p_activo boolean, p_busqueda character varying, p_limite integer, p_offset integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_listar_pacientes(p_activo boolean, p_busqueda character varying, p_limite integer, p_offset integer) IS 'Lista todos los pacientes con filtros opcionales por estado activo y búsqueda por nombre, apellido o DNI. Incluye paginación.';


--
-- Name: fn_obtener_estudiantes(boolean, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_obtener_estudiantes(p_activo boolean DEFAULT NULL::boolean, p_busqueda character varying DEFAULT NULL::character varying) RETURNS TABLE(id_usuario uuid, codigo_usuario character varying, nombre character varying, apellido character varying, nombre_completo character varying, dni character, email character varying, activo boolean, total_historias_asignadas bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id_usuario,
        u.codigo_usuario,
        u.nombre,
        u.apellido,
        (u.nombre || ' ' || u.apellido)::VARCHAR(400) AS nombre_completo,
        u.dni,
        u.email,
        u.activo,
        COUNT(hc.id_historia) AS total_historias_asignadas
    FROM usuario u
    LEFT JOIN historia_clinica hc ON u.id_usuario = hc.id_estudiante
    WHERE 
        u.rol = 'estudiante'
        AND (p_activo IS NULL OR u.activo = p_activo)
        AND (
            p_busqueda IS NULL 
            OR u.nombre ILIKE '%' || p_busqueda || '%'
            OR u.apellido ILIKE '%' || p_busqueda || '%'
            OR (u.nombre || ' ' || u.apellido) ILIKE '%' || p_busqueda || '%'
            OR u.codigo_usuario ILIKE '%' || p_busqueda || '%'
            OR u.dni LIKE '%' || p_busqueda || '%'
        )
    GROUP BY 
        u.id_usuario,
        u.codigo_usuario,
        u.nombre,
        u.apellido,
        u.dni,
        u.email,
        u.activo
    ORDER BY u.apellido, u.nombre;
END;
$$;


--
-- Name: FUNCTION fn_obtener_estudiantes(p_activo boolean, p_busqueda character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_obtener_estudiantes(p_activo boolean, p_busqueda character varying) IS 'Obtiene todos los estudiantes con filtros opcionales por estado activo y búsqueda por nombre, apellido, código o DNI. Incluye conteo de historias clínicas asignadas.';


--
-- Name: fn_obtener_filiacion(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_obtener_filiacion(p_id_historia uuid) RETURNS TABLE(id_filiacion uuid, id_historia uuid, raza character varying, fecha_nacimiento date, lugar character varying, estado_civil character varying, nombre_conyuge character varying, ocupacion character varying, lugar_procedencia character varying, tiempo_residencia_tacna character varying, direccion character varying, grado_instruccion character varying, ultima_visita_dentista date, motivo_visita_dentista character varying, ultima_visita_medico date, motivo_visita_medico character varying, contacto_emergencia character varying, telefono_emergencia character varying, acompaniante character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id_filiacion,
        f.id_historia,
        f.raza,
        f.fecha_nacimiento,
        f.lugar,
        ec.descripcion AS estado_civil,
        f.nombre_conyuge,
        oc.descripcion AS ocupacion,
        f.lugar_procedencia,
        f.tiempo_residencia_tacna,
        f.direccion,
        gi.descripcion AS grado_instruccion,
        f.ultima_visita_dentista,
        f.motivo_visita_dentista,
        f.ultima_visita_medico,
        f.motivo_visita_medico,
        f.contacto_emergencia,
        f.telefono_emergencia,
        f.acompaniante
    FROM
        filiacion f
        INNER JOIN catalogo_estado_civil ec ON f.id_estado_civil = ec.id_estado_civil
        INNER JOIN catalogo_ocupacion oc ON f.id_ocupacion = oc.id_ocupacion
        INNER JOIN catalogo_grado_instruccion gi ON f.id_grado_instruccion = gi.id_grado_instruccion
    WHERE
        f.id_historia = p_id_historia;
END;
$$;


--
-- Name: fn_obtener_o_crear_borrador(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_obtener_o_crear_borrador(p_id_estudiante uuid) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_historia UUID;
BEGIN
    -- Buscar si ya existe un borrador para este estudiante
    SELECT id_historia INTO v_id_historia
    FROM historia_clinica
    WHERE id_estudiante = p_id_estudiante
      AND estado = 'borrador'
    LIMIT 1;
    
    -- Si existe, devolverlo
    IF v_id_historia IS NOT NULL THEN
        RAISE NOTICE 'Borrador existente encontrado para estudiante %: %', p_id_estudiante, v_id_historia;
        RETURN v_id_historia;
    END IF;
    
    -- Si no existe, crear uno nuevo
    INSERT INTO historia_clinica (
        id_estudiante,
        fecha_elaboracion,
        ultima_modificacion,
        estado
    ) VALUES (
        p_id_estudiante,
        CURRENT_DATE,
        CURRENT_TIMESTAMP,
        'borrador'
    )
    RETURNING id_historia INTO v_id_historia;
    
    RAISE NOTICE 'Nuevo borrador creado para estudiante %: %', p_id_estudiante, v_id_historia;
    RETURN v_id_historia;
END;
$$;


--
-- Name: FUNCTION fn_obtener_o_crear_borrador(p_id_estudiante uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_obtener_o_crear_borrador(p_id_estudiante uuid) IS 'Retorna el ID del borrador existente del estudiante o crea uno nuevo si no existe. Garantiza que cada estudiante tenga máximo un borrador a la vez.';


--
-- Name: fn_obtener_paciente_por_historia(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_obtener_paciente_por_historia(p_id_historia uuid) RETURNS TABLE(id_paciente uuid, dni character, nombre character varying, apellido character varying, fecha_nacimiento date, edad integer, sexo character varying, telefono character varying, email character varying, fecha_registro timestamp without time zone, activo boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id_paciente,
        p.dni,
        p.nombre,
        p.apellido,
        p.fecha_nacimiento,
        CASE 
            WHEN p.fecha_nacimiento IS NOT NULL THEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.fecha_nacimiento))::INTEGER
            ELSE NULL
        END AS edad,
        p.sexo,
        p.telefono,
        p.email,
        p.fecha_registro,
        p.activo
    FROM historia_clinica hc
    INNER JOIN paciente p ON hc.id_paciente = p.id_paciente
    WHERE hc.id_historia = p_id_historia;
END;
$$;


--
-- Name: FUNCTION fn_obtener_paciente_por_historia(p_id_historia uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_obtener_paciente_por_historia(p_id_historia uuid) IS 'Obtiene los datos del paciente asociado a una historia clínica específica';


--
-- Name: fn_obtener_paciente_por_id(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_obtener_paciente_por_id(p_id_paciente uuid) RETURNS TABLE(id_paciente uuid, nombre character varying, apellido character varying, nombre_completo character varying, dni character, fecha_nacimiento date, edad integer, id_sexo uuid, sexo_descripcion character varying, telefono character varying, email character varying, fecha_registro timestamp without time zone, activo boolean, tiene_historia_clinica boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id_paciente,
        p.nombre,
        p.apellido,
        (p.nombre || ' ' || p.apellido)::VARCHAR(400) AS nombre_completo,
        p.dni,
        p.fecha_nacimiento,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.fecha_nacimiento))::INT AS edad,
        p.id_sexo,
        cs.descripcion AS sexo_descripcion,
        p.telefono,
        p.email,
        p.fecha_registro,
        p.activo,
        EXISTS(SELECT 1 FROM historia_clinica hc WHERE hc.id_paciente = p.id_paciente) AS tiene_historia_clinica
    FROM paciente p
    INNER JOIN catalogo_sexo cs ON p.id_sexo = cs.id_sexo
    WHERE p.id_paciente = p_id_paciente;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró un paciente con el ID proporcionado';
    END IF;
END;
$$;


--
-- Name: FUNCTION fn_obtener_paciente_por_id(p_id_paciente uuid); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_obtener_paciente_por_id(p_id_paciente uuid) IS 'Obtiene los datos completos de un paciente por su ID, incluyendo edad calculada y descripción del sexo';


--
-- Name: fn_obtener_pacientes_adultos(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_obtener_pacientes_adultos(p_id_estudiante uuid) RETURNS TABLE(id_paciente uuid, id_historia uuid, nombre character varying, apellido character varying, nombre_completo character varying, edad integer, telefono character varying, email character varying, sexo character varying, ultima_modificacion timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id_paciente,
        h.id_historia,
        p.nombre,
        p.apellido,
        (p.nombre || ' ' || p.apellido)::VARCHAR AS nombre_completo,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.fecha_nacimiento))::INT AS edad,
        p.telefono,
        p.email,
        s.descripcion AS sexo,
        h.ultima_modificacion
    FROM
        historia_clinica h
        INNER JOIN paciente p ON h.id_paciente = p.id_paciente
        LEFT JOIN catalogo_sexo s ON p.id_sexo = s.id_sexo
    WHERE
        h.id_estudiante = p_id_estudiante
        AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.fecha_nacimiento))::INT >= 18;
END;
$$;


--
-- Name: fn_obtener_usuario(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_obtener_usuario(p_id_usuario uuid) RETURNS TABLE(id_usuario uuid, codigo_usuario character varying, nombre character varying, apellido character varying, dni character, email character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT u.id_usuario,
           u.codigo_usuario,
           u.nombre,
           u.apellido,
           u.dni,
           u.email
    FROM usuario u
    WHERE u.id_usuario = p_id_usuario;
END;
$$;


--
-- Name: fn_obtener_usuario_login(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_obtener_usuario_login(p_codigo_usuario character varying) RETURNS TABLE(id_usuario uuid, codigo_usuario character varying, nombre character varying, apellido character varying, dni character, email character varying, rol character varying, contrasena_hash character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT u.id_usuario, u.codigo_usuario, u.nombre, u.apellido, 
           u.dni, u.email, u.rol, u.contrasena_hash
    FROM usuario u
    WHERE u.codigo_usuario = p_codigo_usuario 
      AND u.activo = TRUE;
END;
$$;


--
-- Name: fn_verificar_paciente_existe(character); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_verificar_paciente_existe(p_dni character) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
DECLARE
    v_existe BOOLEAN;
BEGIN
    -- Validar formato de DNI
    IF NOT (p_dni ~ '^\d{8}$') THEN
        RAISE EXCEPTION 'El DNI debe tener exactamente 8 dígitos numéricos';
    END IF;

    SELECT EXISTS(
        SELECT 1 
        FROM paciente 
        WHERE dni = p_dni
    ) INTO v_existe;
    
    RETURN v_existe;
END;
$_$;


--
-- Name: FUNCTION fn_verificar_paciente_existe(p_dni character); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_verificar_paciente_existe(p_dni character) IS 'Verifica si existe un paciente con el DNI proporcionado. Útil para validaciones previas al registro.';


--
-- Name: i_antecedente_cumplimiento(uuid, boolean, character varying, character varying, boolean, boolean, boolean, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_antecedente_cumplimiento(IN p_id_historia uuid, IN p_dentista_dolor boolean, IN p_frecuenca_dentista character varying, IN p_higiene_oral character varying, IN p_tranquilo boolean, IN p_nervioso boolean, IN p_panico boolean, IN p_desagrado_atencion text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    INSERT INTO antecedente_cumplimiento (
        id_historia,
        dentista_dolor,
        frecuenca_dentista,
        higiene_oral,
        tranquilo,
        nervioso,
        panico,
        desagrado_atencion
    )
    VALUES (
        p_id_historia,
        p_dentista_dolor,
        p_frecuenca_dentista,
        p_higiene_oral,
        p_tranquilo,
        p_nervioso,
        p_panico,
        p_desagrado_atencion
    );

    RAISE NOTICE 'Antecedentes de cumplimiento registrados para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene antecedentes de cumplimiento registrados.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar los antecedentes de cumplimiento: %', SQLERRM;
END;
$$;


--
-- Name: i_antecedente_cumplimiento(uuid, boolean, boolean, integer, boolean, integer, boolean, boolean, boolean, text, date, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_antecedente_cumplimiento(IN p_id_historia uuid, IN p_motivo_dolor boolean, IN p_motivo_control boolean, IN p_frecuencia_control_meses integer, IN p_motivo_limpieza boolean, IN p_frecuencia_limpieza_meses integer, IN p_actitud_tranquilo boolean, IN p_actitud_aprensivo boolean, IN p_actitud_panico boolean, IN p_desagrado_atencion text, IN p_fecha_consentimiento date, IN p_firma_nombre character varying, IN p_historia_elaborada_por character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    INSERT INTO antecedente_cumplimiento (
        id_historia,
        motivo_dolor,
        motivo_control,
        frecuencia_control_meses,
        motivo_limpieza,
        frecuencia_limpieza_meses,
        actitud_tranquilo,
        actitud_aprensivo,
        actitud_panico,
        desagrado_atencion,
        fecha_consentimiento,
        firma_nombre,
        historia_elaborada_por
    )
    VALUES (
        p_id_historia,
        p_motivo_dolor,
        p_motivo_control,
        p_frecuencia_control_meses,
        p_motivo_limpieza,
        p_frecuencia_limpieza_meses,
        p_actitud_tranquilo,
        p_actitud_aprensivo,
        p_actitud_panico,
        p_desagrado_atencion,
        p_fecha_consentimiento,
        p_firma_nombre,
        p_historia_elaborada_por
    );

    RAISE NOTICE 'Antecedentes de cumplimiento registrados para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene antecedentes de cumplimiento registrados.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar los antecedentes de cumplimiento: %', SQLERRM;
END;
$$;


--
-- Name: i_antecedente_familiar(uuid, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_antecedente_familiar(IN p_id_historia uuid, IN p_descripcion text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    INSERT INTO antecedente_familiar (
        id_historia,
        descripcion
    )
    VALUES (
        p_id_historia,
        p_descripcion
    );

    RAISE NOTICE 'Antecedentes familiares registrados para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene antecedentes familiares registrados.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar los antecedentes familiares: %', SQLERRM;
END;
$$;


--
-- Name: i_antecedente_medico(uuid, character varying, boolean, character varying, text, text, text, text, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_antecedente_medico(IN p_id_historia uuid, IN p_salud_general character varying, IN p_bajo_tratamiento boolean, IN p_tipo_tratamiento character varying, IN p_hospitalizaciones text, IN p_traumatismos text, IN p_alergias text, IN p_medicamentos_contraindicados text, IN p_odontologicos text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    INSERT INTO antecedente_medico (
        id_historia,
        salud_general,
        bajo_tratamiento,
        tipo_tratamiento,
        hospitalizaciones,
        traumatismos,
        alergias,
        medicamentos_contraindicados,
        odontologicos
    )
    VALUES (
        p_id_historia,
        p_salud_general,
        p_bajo_tratamiento,
        p_tipo_tratamiento,
        p_hospitalizaciones,
        p_traumatismos,
        p_alergias,
        p_medicamentos_contraindicados,
        p_odontologicos
    );

    RAISE NOTICE 'Antecedentes médicos registrados para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene antecedentes médicos registrados.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar los antecedentes médicos: %', SQLERRM;
END;
$$;


--
-- Name: i_antecedente_medico(uuid, character varying, boolean, character varying, text, boolean, text, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_antecedente_medico(IN p_id_historia uuid, IN p_salud_general character varying, IN p_bajo_tratamiento boolean, IN p_tipo_tratamiento character varying, IN p_hospitalizaciones text, IN p_tuvo_traumatismos boolean, IN p_tipo_traumatismos text, IN p_alergias text, IN p_medicamentos_contraindicados text, IN p_enf_hepatitis boolean, IN p_enf_alergia_cronica boolean, IN p_enf_corazon boolean, IN p_enf_fiebre_reumatica boolean, IN p_enf_anemia boolean, IN p_enf_asma boolean, IN p_enf_diabetes boolean, IN p_enf_epilepsia boolean, IN p_enf_coagulacion boolean, IN p_enf_tbc boolean, IN p_enf_hipertension boolean, IN p_enf_ulcera boolean, IN p_enf_neurologica boolean, IN p_otras_enf_patologicas text, IN p_odontologicos text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    INSERT INTO antecedente_medico (
        id_historia,
        salud_general,
        bajo_tratamiento,
        tipo_tratamiento,
        hospitalizaciones,
        tuvo_traumatismos,
        tipo_traumatismos,
        alergias,
        medicamentos_contraindicados,
        enf_hepatitis,
        enf_alergia_cronica,
        enf_corazon,
        enf_fiebre_reumatica,
        enf_anemia,
        enf_asma,
        enf_diabetes,
        enf_epilepsia,
        enf_coagulacion,
        enf_tbc,
        enf_hipertension,
        enf_ulcera,
        enf_neurologica,
        otras_enf_patologicas,
        odontologicos
    )
    VALUES (
        p_id_historia,
        p_salud_general,
        p_bajo_tratamiento,
        p_tipo_tratamiento,
        p_hospitalizaciones,
        p_tuvo_traumatismos,
        p_tipo_traumatismos,
        p_alergias,
        p_medicamentos_contraindicados,
        p_enf_hepatitis,
        p_enf_alergia_cronica,
        p_enf_corazon,
        p_enf_fiebre_reumatica,
        p_enf_anemia,
        p_enf_asma,
        p_enf_diabetes,
        p_enf_epilepsia,
        p_enf_coagulacion,
        p_enf_tbc,
        p_enf_hipertension,
        p_enf_ulcera,
        p_enf_neurologica,
        p_otras_enf_patologicas,
        p_odontologicos
    );

    RAISE NOTICE 'Antecedentes médicos registrados para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene antecedentes médicos registrados.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar los antecedentes médicos: %', SQLERRM;
END;
$$;


--
-- Name: i_antecedente_personal(uuid, boolean, character varying, text, text, text, boolean, character varying, boolean, integer, boolean, integer, boolean, character varying, boolean, character varying, boolean, boolean, boolean, boolean, boolean, text, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_antecedente_personal(IN p_id_historia uuid, IN p_esta_embarazada boolean, IN p_mac character varying, IN p_otros text, IN p_psicosocial text, IN p_vacunas text, IN p_hepatitis_b boolean, IN p_grupo_sanguineo_desc character varying, IN p_fuma boolean, IN p_cigarrillos_dia integer, IN p_toma_te boolean, IN p_tazas_te_dia integer, IN p_toma_alcohol boolean, IN p_frecuencia_alcohol character varying, IN p_aprieta_dientes boolean, IN p_momento_aprieta character varying, IN p_rechina boolean, IN p_dolor_muscular boolean, IN p_chupa_dedo boolean, IN p_muerde_objetos boolean, IN p_muerde_labios boolean, IN p_otros_habitos text, IN p_frecuencia_cepillado integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_grupo_sanguineo UUID;
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    -- Buscar UUID del grupo sanguíneo
    IF p_grupo_sanguineo_desc IS NOT NULL THEN
        SELECT id_grupo_sanguineo INTO v_id_grupo_sanguineo 
        FROM catalogo_grupo_sanguineo 
        WHERE descripcion = p_grupo_sanguineo_desc;
        
        IF v_id_grupo_sanguineo IS NULL THEN
            RAISE EXCEPTION 'Grupo sanguíneo "%" no encontrado en catálogo. Valores válidos: %',
                p_grupo_sanguineo_desc,
                (SELECT string_agg(descripcion, ', ') FROM catalogo_grupo_sanguineo);
        END IF;
    END IF;

    INSERT INTO antecedente_personal (
        id_historia,
        esta_embarazada,
        mac,
        otros,
        psicosocial,
        vacunas,
        hepatitis_b,
        id_grupo_sanguineo,
        fuma,
        cigarrillos_dia,
        toma_te,
        tazas_te_dia,
        toma_alcohol,
        frecuencia_alcohol,
        aprieta_dientes,
        momento_aprieta,
        rechina,
        dolor_muscular,
        chupa_dedo,
        muerde_objetos,
        muerde_labios,
        otros_habitos,
        frecuencia_cepillado
    )
    VALUES (
        p_id_historia,
        p_esta_embarazada,
        p_mac,
        p_otros,
        p_psicosocial,
        p_vacunas,
        p_hepatitis_b,
        v_id_grupo_sanguineo,
        p_fuma,
        p_cigarrillos_dia,
        p_toma_te,
        p_tazas_te_dia,
        p_toma_alcohol,
        p_frecuencia_alcohol,
        p_aprieta_dientes,
        p_momento_aprieta,
        p_rechina,
        p_dolor_muscular,
        p_chupa_dedo,
        p_muerde_objetos,
        p_muerde_labios,
        p_otros_habitos,
        p_frecuencia_cepillado
    );

    RAISE NOTICE 'Antecedentes personales registrados para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe o el grupo sanguíneo no es válido.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene antecedentes personales registrados.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar los antecedentes personales: %', SQLERRM;
END;
$$;


--
-- Name: i_antecedente_personal(uuid, boolean, character varying, text, text, text, boolean, character varying, boolean, integer, boolean, integer, boolean, character varying, boolean, character varying, boolean, boolean, boolean, boolean, boolean, text, integer, boolean, boolean, boolean, boolean, boolean, character varying, boolean, boolean, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_antecedente_personal(IN p_id_historia uuid, IN p_esta_embarazada boolean, IN p_mac character varying, IN p_otros text, IN p_psicosocial text, IN p_vacunas text, IN p_hepatitis_b boolean, IN p_grupo_sanguineo_desc character varying, IN p_fuma boolean, IN p_cigarrillos_dia integer, IN p_toma_te boolean, IN p_tazas_te_dia integer, IN p_toma_alcohol boolean, IN p_frecuencia_alcohol character varying, IN p_aprieta_dientes boolean, IN p_momento_aprieta character varying, IN p_rechina boolean, IN p_dolor_muscular boolean, IN p_chupa_dedo boolean, IN p_muerde_objetos boolean, IN p_muerde_labios boolean, IN p_otros_habitos text, IN p_frecuencia_cepillado integer, IN p_cepillo_duro boolean, IN p_cepillo_mediano boolean, IN p_cepillo_blando boolean, IN p_cepillo_electrico boolean, IN p_cepillo_interproximal boolean, IN p_tipo_interproximal character varying, IN p_seda_dental boolean, IN p_enjuague_bucal boolean, IN p_otros_elementos_higiene text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_grupo_sanguineo UUID;
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    -- Buscar UUID del grupo sanguíneo
    IF p_grupo_sanguineo_desc IS NOT NULL THEN
        SELECT id_grupo_sanguineo INTO v_id_grupo_sanguineo 
        FROM catalogo_grupo_sanguineo 
        WHERE descripcion = p_grupo_sanguineo_desc;
        
        IF v_id_grupo_sanguineo IS NULL THEN
            RAISE EXCEPTION 'Grupo sanguíneo "%" no encontrado en catálogo. Valores válidos: %',
                p_grupo_sanguineo_desc,
                (SELECT string_agg(descripcion, ', ') FROM catalogo_grupo_sanguineo);
        END IF;
    END IF;

    INSERT INTO antecedente_personal (
        id_historia,
        esta_embarazada,
        mac,
        otros,
        psicosocial,
        vacunas,
        hepatitis_b,
        id_grupo_sanguineo,
        fuma,
        cigarrillos_dia,
        toma_te,
        tazas_te_dia,
        toma_alcohol,
        frecuencia_alcohol,
        aprieta_dientes,
        momento_aprieta,
        rechina,
        dolor_muscular,
        chupa_dedo,
        muerde_objetos,
        muerde_labios,
        otros_habitos,
        frecuencia_cepillado,
        cepillo_duro,
        cepillo_mediano,
        cepillo_blando,
        cepillo_electrico,
        cepillo_interproximal,
        tipo_interproximal,
        seda_dental,
        enjuague_bucal,
        otros_elementos_higiene
    )
    VALUES (
        p_id_historia,
        p_esta_embarazada,
        p_mac,
        p_otros,
        p_psicosocial,
        p_vacunas,
        p_hepatitis_b,
        v_id_grupo_sanguineo,
        p_fuma,
        p_cigarrillos_dia,
        p_toma_te,
        p_tazas_te_dia,
        p_toma_alcohol,
        p_frecuencia_alcohol,
        p_aprieta_dientes,
        p_momento_aprieta,
        p_rechina,
        p_dolor_muscular,
        p_chupa_dedo,
        p_muerde_objetos,
        p_muerde_labios,
        p_otros_habitos,
        p_frecuencia_cepillado,
        p_cepillo_duro,
        p_cepillo_mediano,
        p_cepillo_blando,
        p_cepillo_electrico,
        p_cepillo_interproximal,
        p_tipo_interproximal,
        p_seda_dental,
        p_enjuague_bucal,
        p_otros_elementos_higiene
    );

    RAISE NOTICE 'Antecedentes personales registrados para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe o el grupo sanguíneo no es válido.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene antecedentes personales registrados.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar los antecedentes personales: %', SQLERRM;
END;
$$;


--
-- Name: i_atm_movimiento(uuid, character varying, boolean, boolean, boolean); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_atm_movimiento(IN p_id_examen_atm uuid, IN p_movimiento_desc character varying, IN p_dolor boolean, IN p_ruido boolean, IN p_salto boolean)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_movimiento UUID;
BEGIN
    -- Buscar UUID del movimiento mandibular
    SELECT id_movimiento INTO v_id_movimiento 
    FROM catalogo_movimiento_mandibular 
    WHERE descripcion = p_movimiento_desc;
    
    IF v_id_movimiento IS NULL THEN
        RAISE EXCEPTION 'Movimiento mandibular "%" no encontrado en catálogo', p_movimiento_desc;
    END IF;

    INSERT INTO atm_movimiento_condicion (
        id_examen_atm,
        id_movimiento,
        dolor,
        ruido,
        salto
    )
    VALUES (
        p_id_examen_atm,
        v_id_movimiento,
        p_dolor,
        p_ruido,
        p_salto
    );

    RAISE NOTICE 'Movimiento ATM registrado para examen %.', p_id_examen_atm;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'El examen ATM % no existe o el movimiento no es válido.', p_id_examen_atm;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'El movimiento "%" ya fue registrado para este examen ATM.', p_movimiento_desc;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar el movimiento ATM: %', SQLERRM;
END;
$$;


--
-- Name: i_auditoria(uuid, character varying, uuid, character varying, jsonb, jsonb); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_auditoria(IN p_id_usuario uuid, IN p_nombre_tabla character varying, IN p_id_registro_afectado uuid, IN p_accion character varying, IN p_datos_anteriores jsonb DEFAULT NULL::jsonb, IN p_datos_nuevos jsonb DEFAULT NULL::jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO auditoria (
        id_usuario,
        fecha_cambio,
        nombre_tabla,
        id_registro_afectado,
        accion,
        datos_anteriores,
        datos_nuevos
    )
    VALUES (
        p_id_usuario,
        CURRENT_TIMESTAMP,
        p_nombre_tabla,
        p_id_registro_afectado,
        p_accion,
        p_datos_anteriores,
        p_datos_nuevos
    );

    RAISE NOTICE 'Registro de auditoria creado para tabla % con accion %.', p_nombre_tabla, p_accion;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'El id_usuario % no existe.', p_id_usuario;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar la auditoria: %', SQLERRM;
END;
$$;


--
-- Name: i_derivacion_clinicas(uuid, jsonb, text, character varying, character varying, uuid); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_derivacion_clinicas(IN p_id_historia uuid, IN p_destinos jsonb, IN p_observaciones text, IN p_alumno character varying, IN p_docente character varying, IN p_usuario_id uuid)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id UUID;
BEGIN
    PERFORM set_config('app.current_user_id', p_usuario_id::TEXT, true);
    SELECT id_derivacion INTO v_id FROM derivacion_clinicas WHERE id_historia = p_id_historia;

    IF v_id IS NOT NULL THEN
        UPDATE derivacion_clinicas SET 
            destinos = p_destinos,
            observaciones = p_observaciones,
            alumno_diagnostico = p_alumno,
            docente = p_docente,
            fecha_derivacion = CURRENT_DATE
        WHERE id_derivacion = v_id;
    ELSE
        INSERT INTO derivacion_clinicas (id_historia, destinos, observaciones, alumno_diagnostico, docente, fecha_derivacion)
        VALUES (p_id_historia, p_destinos, p_observaciones, p_alumno, p_docente, CURRENT_DATE);
    END IF;
END;
$$;


--
-- Name: i_diagnostico(uuid, text, boolean); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_diagnostico(IN p_id_historia uuid, IN p_descripcion text, IN p_definitivo boolean DEFAULT false)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO diagnostico (
        id_historia,
        descripcion,
        definitivo,
        fecha
    )
    VALUES (
        p_id_historia,
        p_descripcion,
        p_definitivo,
        CURRENT_DATE
    );

    RAISE NOTICE 'Diagnóstico registrado para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar el diagnóstico: %', SQLERRM;
END;
$$;


--
-- Name: i_diagnostico_clinicas(uuid, date, character varying, text, jsonb, text, date, character varying, text, text, text, character varying, uuid); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_diagnostico_clinicas(IN p_id_historia uuid, IN p_fecha date, IN p_clinica_respuesta character varying, IN p_descripcion_respuesta text, IN p_examenes jsonb, IN p_interconsulta_tipo text, IN p_interconsulta_fecha date, IN p_interconsulta_clinica character varying, IN p_diag_definitivo text, IN p_tratamiento text, IN p_pronostico text, IN p_alumno_tratante character varying, IN p_usuario_id uuid)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id UUID;
BEGIN
    PERFORM set_config('app.current_user_id', p_usuario_id::TEXT, true);

    SELECT id_diagnostico INTO v_id FROM diagnostico 
    WHERE id_historia = p_id_historia AND tipo = 'definitivo_clinicas';

    IF v_id IS NOT NULL THEN
        UPDATE diagnostico SET 
            fecha = p_fecha,
            clinica_respuesta = p_clinica_respuesta,
            descripcion = p_descripcion_respuesta,
            examenes_auxiliares = p_examenes,
            interconsulta_detalle = p_interconsulta_tipo,
            fecha_interconsulta = p_interconsulta_fecha,      -- NUEVO
            clinica_interconsulta = p_interconsulta_clinica,  -- NUEVO
            diagnostico_definitivo = p_diag_definitivo,
            tratamiento_realizar = p_tratamiento,
            pronostico = p_pronostico,
            alumno_tratante = p_alumno_tratante
        WHERE id_diagnostico = v_id;
    ELSE
        INSERT INTO diagnostico (
            id_historia, tipo, 
            fecha, clinica_respuesta, descripcion,
            examenes_auxiliares, 
            interconsulta_detalle, fecha_interconsulta, clinica_interconsulta,
            diagnostico_definitivo, tratamiento_realizar, pronostico, alumno_tratante
        )
        VALUES (
            p_id_historia, 'definitivo_clinicas', 
            p_fecha, p_clinica_respuesta, p_descripcion_respuesta,
            p_examenes, 
            p_interconsulta_tipo, p_interconsulta_fecha, p_interconsulta_clinica,
            p_diag_definitivo, p_tratamiento, p_pronostico, p_alumno_tratante
        );
    END IF;
END;
$$;


--
-- Name: i_diagnostico_presuntivo(uuid, text, uuid); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_diagnostico_presuntivo(IN p_id_historia uuid, IN p_descripcion text, IN p_usuario_id uuid)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id UUID;
BEGIN
    PERFORM set_config('app.current_user_id', p_usuario_id::TEXT, true);
    SELECT id_diagnostico INTO v_id FROM diagnostico WHERE id_historia = p_id_historia AND tipo = 'presuntivo';

    IF v_id IS NOT NULL THEN
        UPDATE diagnostico SET descripcion = p_descripcion, fecha = CURRENT_DATE WHERE id_diagnostico = v_id;
    ELSE
        INSERT INTO diagnostico (id_historia, tipo, descripcion, fecha)
        VALUES (p_id_historia, 'presuntivo', p_descripcion, CURRENT_DATE);
    END IF;
END;
$$;


--
-- Name: i_enfermedad_actual(uuid, character varying, character varying, character varying, character varying, text, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_enfermedad_actual(IN p_id_historia uuid, IN p_sintoma_principal character varying, IN p_tiempo_enfermedad character varying, IN p_forma_inicio character varying, IN p_curso character varying, IN p_relato text, IN p_tratamiento_prev text)
    LANGUAGE plpgsql
    AS $$
BEGIN

    INSERT INTO enfermedad_actual (
        id_historia,
        sintoma_principal,
        tiempo_enfermedad,
        forma_inicio,
        curso,
        relato,
        tratamiento_prev
    )
    VALUES (
        p_id_historia,
        p_sintoma_principal,
        p_tiempo_enfermedad,
        p_forma_inicio,
        p_curso,
        p_relato,
        p_tratamiento_prev
    );

    RAISE NOTICE 'Enfermedad actual registrada para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene una enfermedad actual registrada.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar la enfermedad actual: %', SQLERRM;
END;
$$;


--
-- Name: i_evolucion(uuid, text, character varying, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_evolucion(IN p_id_historia uuid, IN p_actividad text, IN p_alumno character varying, IN p_observaciones text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO evolucion (
        id_historia,
        fecha,
        actividad,
        alumno,
        observaciones
    )
    VALUES (
        p_id_historia,
        CURRENT_DATE,
        p_actividad,
        p_alumno,
        p_observaciones
    );

    RAISE NOTICE 'Evolución registrada para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar la evolución: %', SQLERRM;
END;
$$;


--
-- Name: i_evolucion(uuid, date, text, character varying, uuid); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_evolucion(IN p_id_historia uuid, IN p_fecha date, IN p_actividad text, IN p_alumno character varying, IN p_usuario_id uuid)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Configurar usuario para auditoría
    PERFORM set_config('app.current_user_id', p_usuario_id::TEXT, true);

    INSERT INTO evolucion (
        id_historia,
        fecha,
        actividad,
        alumno
        -- Nota: 'observaciones' existe en la tabla pero no se pide en el requisito, se dejará NULL
    )
    VALUES (
        p_id_historia,
        p_fecha,
        p_actividad,
        p_alumno
    );
END;
$$;


--
-- Name: i_examen_atm(uuid, character varying, boolean, numeric, text, boolean, character varying, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_examen_atm(IN p_id_historia uuid, IN p_trayectoria_desc character varying, IN p_coordinacion_condilar boolean, IN p_apertura_maxima_mm numeric, IN p_observaciones text, IN p_musculos_dolor_presente boolean, IN p_dolor_grado_desc character varying, IN p_musculos_dolor_zona text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_trayectoria UUID;
    v_id_dolor_grado UUID;
BEGIN
    -- Buscar UUID de trayectoria
    IF p_trayectoria_desc IS NOT NULL THEN
        SELECT id_trayectoria INTO v_id_trayectoria 
        FROM catalogo_atm_trayectoria 
        WHERE descripcion = p_trayectoria_desc;
        
        IF v_id_trayectoria IS NULL THEN
            RAISE EXCEPTION 'Trayectoria ATM "%" no encontrada en catálogo', p_trayectoria_desc;
        END IF;
    END IF;

    -- Buscar UUID de grado de dolor
    IF p_dolor_grado_desc IS NOT NULL THEN
        SELECT id_grado INTO v_id_dolor_grado 
        FROM catalogo_dolor_grado 
        WHERE descripcion = p_dolor_grado_desc;
        
        IF v_id_dolor_grado IS NULL THEN
            RAISE EXCEPTION 'Grado de dolor "%" no encontrado en catálogo', p_dolor_grado_desc;
        END IF;
    END IF;

    INSERT INTO examen_atm (
        id_historia,
        id_trayectoria,
        coordinacion_condilar,
        apertura_maxima_mm,
        observaciones,
        musculos_dolor_presente,
        id_musculos_dolor_grado,
        musculos_dolor_zona
    )
    VALUES (
        p_id_historia,
        v_id_trayectoria,
        p_coordinacion_condilar,
        p_apertura_maxima_mm,
        p_observaciones,
        p_musculos_dolor_presente,
        v_id_dolor_grado,
        p_musculos_dolor_zona
    );

    RAISE NOTICE 'Examen ATM registrado para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe o algún catálogo referenciado no es válido.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene un examen ATM registrado.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar el examen ATM: %', SQLERRM;
END;
$$;


--
-- Name: i_examen_auxiliar(uuid, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_examen_auxiliar(IN p_id_historia uuid, IN p_examen_desc character varying, IN p_detalle character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_examen UUID;
BEGIN
    -- Buscar UUID del examen auxiliar
    SELECT id_examen INTO v_id_examen 
    FROM catalogo_examen_auxiliar 
    WHERE descripcion = p_examen_desc;
    
    IF v_id_examen IS NULL THEN
        RAISE EXCEPTION 'Examen auxiliar "%" no encontrado en catálogo', p_examen_desc;
    END IF;

    INSERT INTO examen_auxiliar (
        id_historia,
        id_examen,
        detalle,
        fecha_solicitud
    )
    VALUES (
        p_id_historia,
        v_id_examen,
        p_detalle,
        CURRENT_TIMESTAMP
    );

    RAISE NOTICE 'Examen auxiliar registrado para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe o el examen no es válido.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar el examen auxiliar: %', SQLERRM;
END;
$$;


--
-- Name: i_examen_general(uuid, character varying, boolean, uuid, character varying, text, character varying, character varying, character varying, character varying, character varying, character varying, numeric, numeric, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_examen_general(IN p_id_historia uuid, IN p_posicion_desc character varying, IN p_actitud boolean, IN p_deambulacion uuid, IN p_facies character varying, IN p_conciencia text, IN p_constitucion character varying, IN p_estado_nutritivo character varying, IN p_temperatura character varying, IN p_presion_arterial character varying, IN p_frecuencia_respiratoria character varying, IN p_pulso character varying, IN p_peso numeric, IN p_talla numeric, IN p_observaciones text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_posicion UUID;
BEGIN
    -- Buscar UUID de posición si se proporciona
    IF p_posicion_desc IS NOT NULL THEN
        SELECT id_posicion INTO v_id_posicion 
        FROM catalogo_posicion 
        WHERE posicion = p_posicion_desc;
        
        IF v_id_posicion IS NULL THEN
            RAISE EXCEPTION 'Posición "%" no encontrada en catálogo', p_posicion_desc;
        END IF;
    END IF;

    INSERT INTO examen_general (
        id_historia,
        id_posicion,
        actitud,
        deambulacion,
        facies,
        conciencia,
        constitucion,
        estado_nutritivo,
        temperatura,
        presion_arterial,
        frecuencia_respiratoria,
        pulso,
        peso,
        talla,
        observaciones
    )
    VALUES (
        p_id_historia,
        v_id_posicion,
        p_actitud,
        p_deambulacion,
        p_facies,
        p_conciencia,
        p_constitucion,
        p_estado_nutritivo,
        p_temperatura,
        p_presion_arterial,
        p_frecuencia_respiratoria,
        p_pulso,
        p_peso,
        p_talla,
        p_observaciones
    );

    RAISE NOTICE 'Examen general registrado para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe o algún catálogo referenciado no es válido.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene un examen general registrado.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar el examen general: %', SQLERRM;
END;
$$;


--
-- Name: i_examen_higiene_oral(uuid, character varying, uuid); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_examen_higiene_oral(IN p_id_historia uuid, IN p_estado_higiene character varying, IN p_usuario_id uuid)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_higiene UUID;
BEGIN
    -- Configurar variable de sesión para que el trigger capture el usuario
    PERFORM set_config('app.current_user_id', p_usuario_id::TEXT, true);

    -- Verificar si existe registro previo
    SELECT id_higiene INTO v_id_higiene
    FROM examen_higiene_oral
    WHERE id_historia = p_id_historia;

    IF v_id_higiene IS NOT NULL THEN
        -- ACTUALIZAR
        UPDATE examen_higiene_oral
        SET 
            estado_higiene = p_estado_higiene,
            fecha_registro = NOW()
        WHERE id_higiene = v_id_higiene;
    ELSE
        -- INSERTAR
        INSERT INTO examen_higiene_oral (
            id_historia, 
            estado_higiene
        ) VALUES (
            p_id_historia, 
            p_estado_higiene
        );
    END IF;
END;
$$;


--
-- Name: i_examen_regional(uuid, character varying, character varying, character varying, boolean, text, character varying, boolean, character varying, character varying, character varying, boolean, boolean, boolean, boolean, text, boolean, boolean, boolean, text, boolean, text, boolean, text, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_examen_regional(IN p_id_historia uuid, IN p_craneo_forma_desc character varying, IN p_cara_forma_desc character varying, IN p_perfil_ap_desc character varying, IN p_ojos_cejas_adecuada boolean, IN p_ojos_implantacion_obs text, IN p_escleroticas character varying, IN p_agudeza_visual_conservada boolean, IN p_iris_color character varying, IN p_arco_senil character varying, IN p_nariz_forma character varying, IN p_nariz_permeables boolean, IN p_nariz_secreciones boolean, IN p_senos_paranasales_dolorosos boolean, IN p_oidos_anomalias_morfologicas boolean, IN p_oidos_anomalias_obs text, IN p_oidos_secreciones boolean, IN p_audicion_conservada boolean, IN p_cuello_simetrico boolean, IN p_cuello_simetrico_obs text, IN p_cuello_movilidad_conservada boolean, IN p_cuello_movilidad_obs text, IN p_laringe_alineada boolean, IN p_laringe_alineada_obs text, IN p_cuello_otros text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_craneo_forma UUID;
    v_id_cara_forma UUID;
    v_id_perfil_ap UUID;
BEGIN
    -- Buscar UUIDs de catálogos de medidas regionales
    IF p_craneo_forma_desc IS NOT NULL THEN
        SELECT id_medida INTO v_id_craneo_forma 
        FROM catalogo_medida_regional 
        WHERE tipo_medida = 'craneo_forma' AND descripcion = p_craneo_forma_desc;
    END IF;

    IF p_cara_forma_desc IS NOT NULL THEN
        SELECT id_medida INTO v_id_cara_forma 
        FROM catalogo_medida_regional 
        WHERE tipo_medida = 'cara_forma' AND descripcion = p_cara_forma_desc;
    END IF;

    IF p_perfil_ap_desc IS NOT NULL THEN
        SELECT id_medida INTO v_id_perfil_ap 
        FROM catalogo_medida_regional 
        WHERE tipo_medida = 'perfil_ap' AND descripcion = p_perfil_ap_desc;
    END IF;

    INSERT INTO examen_regional (
        id_historia,
        id_craneo_forma,
        id_cara_forma,
        id_perfil_ap,
        ojos_cejas_adecuada,
        ojos_implantacion_obs,
        escleroticas,
        agudeza_visual_conservada,
        iris_color,
        arco_senil,
        nariz_forma,
        nariz_permeables,
        nariz_secreciones,
        senos_paranasales_dolorosos,
        oidos_anomalias_morfologicas,
        oidos_anomalias_obs,
        oidos_secreciones,
        audicion_conservada,
        cuello_simetrico,
        cuello_simetrico_obs,
        cuello_movilidad_conservada,
        cuello_movilidad_obs,
        laringe_alineada,
        laringe_alineada_obs,
        cuello_otros
    )
    VALUES (
        p_id_historia,
        v_id_craneo_forma,
        v_id_cara_forma,
        v_id_perfil_ap,
        p_ojos_cejas_adecuada,
        p_ojos_implantacion_obs,
        p_escleroticas,
        p_agudeza_visual_conservada,
        p_iris_color,
        p_arco_senil,
        p_nariz_forma,
        p_nariz_permeables,
        p_nariz_secreciones,
        p_senos_paranasales_dolorosos,
        p_oidos_anomalias_morfologicas,
        p_oidos_anomalias_obs,
        p_oidos_secreciones,
        p_audicion_conservada,
        p_cuello_simetrico,
        p_cuello_simetrico_obs,
        p_cuello_movilidad_conservada,
        p_cuello_movilidad_obs,
        p_laringe_alineada,
        p_laringe_alineada_obs,
        p_cuello_otros
    );

    RAISE NOTICE 'Examen regional registrado para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe o algún catálogo referenciado no es válido.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene un examen regional registrado.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar el examen regional: %', SQLERRM;
END;
$$;


--
-- Name: i_filiacion(uuid, character varying, date, character varying, character varying, character varying, character varying, character varying, character varying, character varying, date, character varying, date, character varying, character varying, character varying, character varying, integer, character varying, date); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_filiacion(IN p_id_historia uuid, IN p_raza character varying, IN p_fecha_nacimiento date, IN p_lugar character varying, IN p_estado_civil character varying, IN p_nombre_conyuge character varying, IN p_ocupacion character varying, IN p_lugar_procedencia character varying, IN p_tiempo_residencia_tacna character varying, IN p_direccion character varying, IN p_ultima_visita_dentista date, IN p_motivo_visita_dentista character varying, IN p_ultima_visita_medico date, IN p_motivo_visita_medico character varying, IN p_contacto_emergencia character varying, IN p_telefono_emergencia character varying, IN p_acompaniante character varying, IN p_edad integer DEFAULT NULL::integer, IN p_sexo character varying DEFAULT NULL::character varying, IN p_fecha_elaboracion date DEFAULT NULL::date)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Configurar usuario para auditoría
    -- Si no se pasa el usuario (NULL), se usa el valor por defecto en la función de auditoría
    INSERT INTO filiacion (
        id_historia,
        raza,
        fecha_nacimiento,
        lugar,
        estado_civil,
        nombre_conyuge,
        ocupacion,
        lugar_procedencia,
        tiempo_residencia_tacna,
        direccion,
        ultima_visita_dentista,
        motivo_visita_dentista,
        ultima_visita_medico,
        motivo_visita_medico,
        contacto_emergencia,
        telefono_emergencia,
        acompaniante,
        edad,
        sexo,
        fecha_elaboracion
    )
    VALUES (
        p_id_historia,
        p_raza,
        p_fecha_nacimiento,
        p_lugar,
        p_estado_civil,
        p_nombre_conyuge,
        p_ocupacion,
        p_lugar_procedencia,
        p_tiempo_residencia_tacna,
        p_direccion,
        p_ultima_visita_dentista,
        p_motivo_visita_dentista,
        p_ultima_visita_medico,
        p_motivo_visita_medico,
        p_contacto_emergencia,
        p_telefono_emergencia,
        p_acompaniante,
        p_edad,
        p_sexo,
        p_fecha_elaboracion
    );

    RAISE NOTICE 'Filiacion registrada exitosamente para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'La historia % ya tiene una filiacion registrada.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar la filiacion: %', SQLERRM;
END;
$$;


--
-- Name: i_motivo_consulta(uuid, text, uuid); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_motivo_consulta(IN p_id_historia uuid, IN p_motivo text, IN p_usuario_id uuid)
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_usuario_id::TEXT, true);
    
    INSERT INTO motivo_consulta (
        id_historia,
        motivo,
        fecha_registro
    )
    VALUES (
        p_id_historia,
        p_motivo,
        CURRENT_TIMESTAMP
    );

    RAISE NOTICE 'Motivo de consulta registrado para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Ya existe un motivo de consulta para la historia %.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar el motivo de consulta: %', SQLERRM;
END;
$$;


--
-- Name: i_paciente(character varying, character varying, character, date, character varying, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_paciente(IN p_nombre character varying, IN p_apellido character varying, IN p_dni character, IN p_fecha_nacimiento date, IN p_sexo character varying, IN p_telefono character varying DEFAULT NULL::character varying, IN p_email character varying DEFAULT NULL::character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_sexo UUID;
    v_id_paciente UUID;
BEGIN
    SELECT id_sexo INTO v_id_sexo
    FROM catalogo_sexo
    WHERE UPPER(descripcion) = UPPER(p_sexo);
    
    IF v_id_sexo IS NULL THEN
        RAISE EXCEPTION 'El sexo proporcionado no existe en el catálogo. Use: Masculino o Femenino';
    END IF;

    INSERT INTO paciente (
        nombre,
        apellido,
        dni,
        fecha_nacimiento,
        id_sexo,
        telefono,
        email,
        fecha_registro,
        activo
    ) VALUES (
        p_nombre,
        p_apellido,
        p_dni,
        p_fecha_nacimiento,
        v_id_sexo,
        p_telefono,
        p_email,
        CURRENT_TIMESTAMP,
        TRUE
    )
    RETURNING id_paciente INTO v_id_paciente;

    RAISE NOTICE 'Paciente registrado: % % (DNI: %) con ID: %', p_nombre, p_apellido, p_dni, v_id_paciente;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Ya existe un paciente registrado con el DNI: %', p_dni;
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Error de integridad referencial: %', SQLERRM;
    WHEN check_violation THEN
        RAISE EXCEPTION 'Error de validación de datos: %', SQLERRM;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al registrar paciente: %', SQLERRM;
END;
$$;


--
-- Name: PROCEDURE i_paciente(IN p_nombre character varying, IN p_apellido character varying, IN p_dni character, IN p_fecha_nacimiento date, IN p_sexo character varying, IN p_telefono character varying, IN p_email character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON PROCEDURE public.i_paciente(IN p_nombre character varying, IN p_apellido character varying, IN p_dni character, IN p_fecha_nacimiento date, IN p_sexo character varying, IN p_telefono character varying, IN p_email character varying) IS 'Registra un nuevo paciente en el sistema (version para seeds)';


--
-- Name: i_referencia_clinica(uuid, character varying, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_referencia_clinica(IN p_id_historia uuid, IN p_clinica_desc character varying, IN p_observaciones text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_clinica UUID;
BEGIN
    -- Buscar UUID de la clínica
    SELECT id_clinica INTO v_id_clinica 
    FROM catalogo_clinica 
    WHERE descripcion = p_clinica_desc;
    
    IF v_id_clinica IS NULL THEN
        RAISE EXCEPTION 'Clínica "%" no encontrada en catálogo', p_clinica_desc;
    END IF;

    INSERT INTO referencia_clinica (
        id_historia,
        id_clinica,
        observaciones,
        fecha,
        estado
    )
    VALUES (
        p_id_historia,
        v_id_clinica,
        p_observaciones,
        CURRENT_DATE,
        'pendiente'
    );

    RAISE NOTICE 'Referencia clínica registrada para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe o la clínica no es válida.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar la referencia clínica: %', SQLERRM;
END;
$$;


--
-- Name: i_registrar_usuario(character varying, character varying, character varying, character varying, character varying, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_registrar_usuario(IN p_codigo_usuario character varying, IN p_nombre character varying, IN p_apellido character varying, IN p_dni character varying, IN p_email character varying, IN p_rol character varying, IN p_contrasena_hash character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO usuario (codigo_usuario, nombre, apellido, dni, email, rol, contrasena_hash)
    VALUES (p_codigo_usuario, p_nombre, p_apellido, p_dni, p_email, p_rol, p_contrasena_hash);

    RAISE NOTICE 'Usuario con codigo % registrado exitosamente.', p_codigo_usuario;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'El DNI %, email %, usuario % ya se encuentran registrados.', p_dni, p_email, p_codigo_usuario;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrió un error al registrar el usuario: %', SQLERRM;
END;
$$;


--
-- Name: i_revision_historia(uuid, uuid, uuid, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_revision_historia(IN p_id_historia uuid, IN p_id_docente uuid, IN p_id_estado_revision uuid, IN p_observacion text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO revision_historia (id_historia, id_docente, id_estado_revision, observaciones)
    VALUES (p_id_historia, p_id_docente, p_id_estado_revision, p_observacion);

    RAISE NOTICE 'Revision de historia registrada exitosamente para historia % por docente %.', p_id_historia, p_id_docente;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'El id_historia % o el id_docente % no existen.', p_id_historia, p_id_docente;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al registrar la revision: %', SQLERRM;
END;
$$;


--
-- Name: i_usuario(character varying, character varying, character varying, character varying, character varying, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.i_usuario(IN p_codigo_usuario character varying, IN p_nombre character varying, IN p_apellido character varying, IN p_dni character varying, IN p_email character varying, IN p_rol character varying, IN p_contrasena_hash character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO usuario (codigo_usuario, nombre, apellido, dni, email, rol, contrasena_hash)
    VALUES (p_codigo_usuario, p_nombre, p_apellido, p_dni, p_email, p_rol, p_contrasena_hash);

    RAISE NOTICE 'Usuario con codigo % registrado exitosamente.', p_codigo_usuario;

EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'El DNI %, email %, usuario % ya se encuentran registrados.', p_dni, p_email, p_codigo_usuario;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrió un error al registrar el usuario: %', SQLERRM;
END;
$$;


--
-- Name: u_antecedente_cumplimiento(uuid, boolean, character varying, character varying, boolean, boolean, boolean, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_antecedente_cumplimiento(IN p_id_historia uuid, IN p_dentista_dolor boolean, IN p_frecuenca_dentista character varying, IN p_higiene_oral character varying, IN p_tranquilo boolean, IN p_nervioso boolean, IN p_panico boolean, IN p_desagrado_atencion text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    UPDATE antecedente_cumplimiento SET
        dentista_dolor = p_dentista_dolor,
        frecuenca_dentista = p_frecuenca_dentista,
        higiene_oral = p_higiene_oral,
        tranquilo = p_tranquilo,
        nervioso = p_nervioso,
        panico = p_panico,
        desagrado_atencion = p_desagrado_atencion
    WHERE id_historia = p_id_historia;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe antecedente de cumplimiento para la historia %.', p_id_historia;
    END IF;
    RAISE NOTICE 'Antecedentes de cumplimiento actualizados para historia %.', p_id_historia;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al actualizar los antecedentes de cumplimiento: %', SQLERRM;
END;
$$;


--
-- Name: u_antecedente_cumplimiento(uuid, boolean, boolean, integer, boolean, integer, boolean, boolean, boolean, text, date, character varying, character varying); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_antecedente_cumplimiento(IN p_id_historia uuid, IN p_motivo_dolor boolean, IN p_motivo_control boolean, IN p_frecuencia_control_meses integer, IN p_motivo_limpieza boolean, IN p_frecuencia_limpieza_meses integer, IN p_actitud_tranquilo boolean, IN p_actitud_aprensivo boolean, IN p_actitud_panico boolean, IN p_desagrado_atencion text, IN p_fecha_consentimiento date, IN p_firma_nombre character varying, IN p_historia_elaborada_por character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    UPDATE antecedente_cumplimiento SET
        motivo_dolor = p_motivo_dolor,
        motivo_control = p_motivo_control,
        frecuencia_control_meses = p_frecuencia_control_meses,
        motivo_limpieza = p_motivo_limpieza,
        frecuencia_limpieza_meses = p_frecuencia_limpieza_meses,
        actitud_tranquilo = p_actitud_tranquilo,
        actitud_aprensivo = p_actitud_aprensivo,
        actitud_panico = p_actitud_panico,
        desagrado_atencion = p_desagrado_atencion,
        fecha_consentimiento = p_fecha_consentimiento,
        firma_nombre = p_firma_nombre,
        historia_elaborada_por = p_historia_elaborada_por
    WHERE id_historia = p_id_historia;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe antecedente de cumplimiento para la historia %.', p_id_historia;
    END IF;
    RAISE NOTICE 'Antecedentes de cumplimiento actualizados para historia %.', p_id_historia;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al actualizar los antecedentes de cumplimiento: %', SQLERRM;
END;
$$;


--
-- Name: u_antecedente_familiar(uuid, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_antecedente_familiar(IN p_id_historia uuid, IN p_descripcion text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    UPDATE antecedente_familiar SET
        descripcion = p_descripcion
    WHERE id_historia = p_id_historia;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe antecedente familiar para la historia %.', p_id_historia;
    END IF;
    RAISE NOTICE 'Antecedentes familiares actualizados para historia %.', p_id_historia;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al actualizar los antecedentes familiares: %', SQLERRM;
END;
$$;


--
-- Name: u_antecedente_medico(uuid, character varying, boolean, character varying, text, text, text, text, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_antecedente_medico(IN p_id_historia uuid, IN p_salud_general character varying, IN p_bajo_tratamiento boolean, IN p_tipo_tratamiento character varying, IN p_hospitalizaciones text, IN p_traumatismos text, IN p_alergias text, IN p_medicamentos_contraindicados text, IN p_odontologicos text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    UPDATE antecedente_medico SET
        salud_general = p_salud_general,
        bajo_tratamiento = p_bajo_tratamiento,
        tipo_tratamiento = p_tipo_tratamiento,
        hospitalizaciones = p_hospitalizaciones,
        traumatismos = p_traumatismos,
        alergias = p_alergias,
        medicamentos_contraindicados = p_medicamentos_contraindicados,
        odontologicos = p_odontologicos
    WHERE id_historia = p_id_historia;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe antecedente médico para la historia %.', p_id_historia;
    END IF;
    RAISE NOTICE 'Antecedentes médicos actualizados para historia %.', p_id_historia;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al actualizar los antecedentes médicos: %', SQLERRM;
END;
$$;


--
-- Name: u_antecedente_medico(uuid, character varying, boolean, character varying, text, boolean, text, text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_antecedente_medico(IN p_id_historia uuid, IN p_salud_general character varying, IN p_bajo_tratamiento boolean, IN p_tipo_tratamiento character varying, IN p_hospitalizaciones text, IN p_tuvo_traumatismos boolean, IN p_tipo_traumatismos text, IN p_alergias text, IN p_medicamentos_contraindicados text, IN p_enf_hepatitis boolean, IN p_enf_alergia_cronica boolean, IN p_enf_corazon boolean, IN p_enf_fiebre_reumatica boolean, IN p_enf_anemia boolean, IN p_enf_asma boolean, IN p_enf_diabetes boolean, IN p_enf_epilepsia boolean, IN p_enf_coagulacion boolean, IN p_enf_tbc boolean, IN p_enf_hipertension boolean, IN p_enf_ulcera boolean, IN p_enf_neurologica boolean, IN p_otras_enf_patologicas text, IN p_odontologicos text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    UPDATE antecedente_medico SET
        salud_general = p_salud_general,
        bajo_tratamiento = p_bajo_tratamiento,
        tipo_tratamiento = p_tipo_tratamiento,
        hospitalizaciones = p_hospitalizaciones,
        tuvo_traumatismos = p_tuvo_traumatismos,
        tipo_traumatismos = p_tipo_traumatismos,
        alergias = p_alergias,
        medicamentos_contraindicados = p_medicamentos_contraindicados,
        enf_hepatitis = p_enf_hepatitis,
        enf_alergia_cronica = p_enf_alergia_cronica,
        enf_corazon = p_enf_corazon,
        enf_fiebre_reumatica = p_enf_fiebre_reumatica,
        enf_anemia = p_enf_anemia,
        enf_asma = p_enf_asma,
        enf_diabetes = p_enf_diabetes,
        enf_epilepsia = p_enf_epilepsia,
        enf_coagulacion = p_enf_coagulacion,
        enf_tbc = p_enf_tbc,
        enf_hipertension = p_enf_hipertension,
        enf_ulcera = p_enf_ulcera,
        enf_neurologica = p_enf_neurologica,
        otras_enf_patologicas = p_otras_enf_patologicas,
        odontologicos = p_odontologicos
    WHERE id_historia = p_id_historia;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe antecedente médico para la historia %.', p_id_historia;
    END IF;
    RAISE NOTICE 'Antecedentes médicos actualizados para historia %.', p_id_historia;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al actualizar los antecedentes médicos: %', SQLERRM;
END;
$$;


--
-- Name: u_antecedente_personal(uuid, boolean, character varying, text, text, text, boolean, character varying, boolean, integer, boolean, integer, boolean, character varying, boolean, character varying, boolean, boolean, boolean, boolean, boolean, text, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_antecedente_personal(IN p_id_historia uuid, IN p_esta_embarazada boolean, IN p_mac character varying, IN p_otros text, IN p_psicosocial text, IN p_vacunas text, IN p_hepatitis_b boolean, IN p_grupo_sanguineo_desc character varying, IN p_fuma boolean, IN p_cigarrillos_dia integer, IN p_toma_te boolean, IN p_tazas_te_dia integer, IN p_toma_alcohol boolean, IN p_frecuencia_alcohol character varying, IN p_aprieta_dientes boolean, IN p_momento_aprieta character varying, IN p_rechina boolean, IN p_dolor_muscular boolean, IN p_chupa_dedo boolean, IN p_muerde_objetos boolean, IN p_muerde_labios boolean, IN p_otros_habitos text, IN p_frecuencia_cepillado integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_grupo_sanguineo UUID;
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    -- Buscar UUID del grupo sanguíneo
    IF p_grupo_sanguineo_desc IS NOT NULL THEN
        SELECT id_grupo_sanguineo INTO v_id_grupo_sanguineo 
        FROM catalogo_grupo_sanguineo 
        WHERE descripcion = p_grupo_sanguineo_desc;
        IF v_id_grupo_sanguineo IS NULL THEN
            RAISE EXCEPTION 'Grupo sanguíneo "%" no encontrado en catálogo. Valores válidos: %',
                p_grupo_sanguineo_desc,
                (SELECT string_agg(descripcion, ', ') FROM catalogo_grupo_sanguineo);
        END IF;
    END IF;
    UPDATE antecedente_personal SET
        esta_embarazada = p_esta_embarazada,
        mac = p_mac,
        otros = p_otros,
        psicosocial = p_psicosocial,
        vacunas = p_vacunas,
        hepatitis_b = p_hepatitis_b,
        id_grupo_sanguineo = v_id_grupo_sanguineo,
        fuma = p_fuma,
        cigarrillos_dia = p_cigarrillos_dia,
        toma_te = p_toma_te,
        tazas_te_dia = p_tazas_te_dia,
        toma_alcohol = p_toma_alcohol,
        frecuencia_alcohol = p_frecuencia_alcohol,
        aprieta_dientes = p_aprieta_dientes,
        momento_aprieta = p_momento_aprieta,
        rechina = p_rechina,
        dolor_muscular = p_dolor_muscular,
        chupa_dedo = p_chupa_dedo,
        muerde_objetos = p_muerde_objetos,
        muerde_labios = p_muerde_labios,
        otros_habitos = p_otros_habitos,
        frecuencia_cepillado = p_frecuencia_cepillado
    WHERE id_historia = p_id_historia;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe antecedente personal para la historia %.', p_id_historia;
    END IF;
    RAISE NOTICE 'Antecedentes personales actualizados para historia %.', p_id_historia;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe o el grupo sanguíneo no es válido.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al actualizar los antecedentes personales: %', SQLERRM;
END;
$$;


--
-- Name: u_antecedente_personal(uuid, boolean, character varying, text, text, text, boolean, character varying, boolean, integer, boolean, integer, boolean, character varying, boolean, character varying, boolean, boolean, boolean, boolean, boolean, text, integer, boolean, boolean, boolean, boolean, boolean, character varying, boolean, boolean, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_antecedente_personal(IN p_id_historia uuid, IN p_esta_embarazada boolean, IN p_mac character varying, IN p_otros text, IN p_psicosocial text, IN p_vacunas text, IN p_hepatitis_b boolean, IN p_grupo_sanguineo_desc character varying, IN p_fuma boolean, IN p_cigarrillos_dia integer, IN p_toma_te boolean, IN p_tazas_te_dia integer, IN p_toma_alcohol boolean, IN p_frecuencia_alcohol character varying, IN p_aprieta_dientes boolean, IN p_momento_aprieta character varying, IN p_rechina boolean, IN p_dolor_muscular boolean, IN p_chupa_dedo boolean, IN p_muerde_objetos boolean, IN p_muerde_labios boolean, IN p_otros_habitos text, IN p_frecuencia_cepillado integer, IN p_cepillo_duro boolean, IN p_cepillo_mediano boolean, IN p_cepillo_blando boolean, IN p_cepillo_electrico boolean, IN p_cepillo_interproximal boolean, IN p_tipo_interproximal character varying, IN p_seda_dental boolean, IN p_enjuague_bucal boolean, IN p_otros_elementos_higiene text)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_grupo_sanguineo UUID;
BEGIN
    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;
    -- Buscar UUID del grupo sanguíneo
    IF p_grupo_sanguineo_desc IS NOT NULL THEN
        SELECT id_grupo_sanguineo INTO v_id_grupo_sanguineo 
        FROM catalogo_grupo_sanguineo 
        WHERE descripcion = p_grupo_sanguineo_desc;
        IF v_id_grupo_sanguineo IS NULL THEN
            RAISE EXCEPTION 'Grupo sanguíneo "%" no encontrado en catálogo. Valores válidos: %',
                p_grupo_sanguineo_desc,
                (SELECT string_agg(descripcion, ', ') FROM catalogo_grupo_sanguineo);
        END IF;
    END IF;
    UPDATE antecedente_personal SET
        esta_embarazada = p_esta_embarazada,
        mac = p_mac,
        otros = p_otros,
        psicosocial = p_psicosocial,
        vacunas = p_vacunas,
        hepatitis_b = p_hepatitis_b,
        id_grupo_sanguineo = v_id_grupo_sanguineo,
        fuma = p_fuma,
        cigarrillos_dia = p_cigarrillos_dia,
        toma_te = p_toma_te,
        tazas_te_dia = p_tazas_te_dia,
        toma_alcohol = p_toma_alcohol,
        frecuencia_alcohol = p_frecuencia_alcohol,
        aprieta_dientes = p_aprieta_dientes,
        momento_aprieta = p_momento_aprieta,
        rechina = p_rechina,
        dolor_muscular = p_dolor_muscular,
        chupa_dedo = p_chupa_dedo,
        muerde_objetos = p_muerde_objetos,
        muerde_labios = p_muerde_labios,
        otros_habitos = p_otros_habitos,
        frecuencia_cepillado = p_frecuencia_cepillado,
        cepillo_duro = p_cepillo_duro,
        cepillo_mediano = p_cepillo_mediano,
        cepillo_blando = p_cepillo_blando,
        cepillo_electrico = p_cepillo_electrico,
        cepillo_interproximal = p_cepillo_interproximal,
        tipo_interproximal = p_tipo_interproximal,
        seda_dental = p_seda_dental,
        enjuague_bucal = p_enjuague_bucal,
        otros_elementos_higiene = p_otros_elementos_higiene
    WHERE id_historia = p_id_historia;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe antecedente personal para la historia %.', p_id_historia;
    END IF;
    RAISE NOTICE 'Antecedentes personales actualizados para historia %.', p_id_historia;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe o el grupo sanguíneo no es válido.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al actualizar los antecedentes personales: %', SQLERRM;
END;
$$;


--
-- Name: u_enfermedad_actual(uuid, character varying, character varying, character varying, character varying, text, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_enfermedad_actual(IN p_id_historia uuid, IN p_sintoma_principal character varying, IN p_tiempo_enfermedad character varying, IN p_forma_inicio character varying, IN p_curso character varying, IN p_relato text, IN p_tratamiento_prev text)
    LANGUAGE plpgsql
    AS $$
BEGIN

    IF p_id_historia IS NULL THEN
        RAISE EXCEPTION 'El id_historia no puede ser nulo.';
    END IF;

    UPDATE enfermedad_actual SET
        sintoma_principal = p_sintoma_principal,
        tiempo_enfermedad = p_tiempo_enfermedad,
        forma_inicio = p_forma_inicio,
        curso = p_curso,
        relato = p_relato,
        tratamiento_prev = p_tratamiento_prev
    WHERE id_historia = p_id_historia;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe enfermedad actual para la historia %.', p_id_historia;
    END IF;

    RAISE NOTICE 'Enfermedad actual actualizada para historia %.', p_id_historia;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al actualizar la enfermedad actual: %', SQLERRM;
END;
$$;


--
-- Name: u_examen_clinico_boca(uuid, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, text, character varying, character varying, character varying, character varying, character varying, boolean, numeric, character varying, boolean, text, numeric, boolean, boolean, text, boolean, boolean, boolean, text, boolean, boolean, boolean, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_examen_clinico_boca(IN p_id_historia uuid, IN p_labios_sin_lesiones text, IN p_labios_con_lesiones text, IN p_vestibulo_sin_lesiones text, IN p_vestibulo_con_lesiones text, IN p_carrillos_retromolar_sin_lesiones text, IN p_carrillos_retromolar_con_lesiones text, IN p_paladar_sin_lesiones text, IN p_paladar_con_lesiones text, IN p_orofaringe_sin_lesiones text, IN p_orofaringe_con_lesiones text, IN p_piso_boca_sin_lesiones text, IN p_piso_boca_con_lesiones text, IN p_lengua_sin_lesiones text, IN p_lengua_con_lesiones text, IN p_encia_sin_lesiones text, IN p_encia_con_lesiones text, IN p_oclusion_molar_der character varying, IN p_oclusion_molar_izq character varying, IN p_oclusion_canina_der character varying, IN p_oclusion_canina_izq character varying, IN p_oclusion_mordida_cruzada character varying, IN p_oclusion_vestibuloclusion boolean, IN p_oclusion_overbite numeric, IN p_oclusion_mordida_abierta character varying, IN p_oclusion_sobremordida boolean, IN p_oclusion_relacion_vertical_otros text, IN p_oclusion_overjet numeric, IN p_oclusion_protrusion boolean, IN p_oclusion_guia_incisiva boolean, IN p_oclusion_contacto_posterior text, IN p_lat_der_guia_canina boolean, IN p_lat_der_funcion_grupo boolean, IN p_lat_der_contacto_balance boolean, IN p_lat_der_describa text, IN p_lat_izq_guia_canina boolean, IN p_lat_izq_funcion_grupo boolean, IN p_lat_izq_contacto_balance boolean, IN p_lat_izq_describa text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE examen_clinico_boca
    SET
        -- (Campos de tejidos igual...)
        labios_sin_lesiones = p_labios_sin_lesiones, labios_con_lesiones = p_labios_con_lesiones,
        vestibulo_sin_lesiones = p_vestibulo_sin_lesiones, vestibulo_con_lesiones = p_vestibulo_con_lesiones,
        carrillos_retromolar_sin_lesiones = p_carrillos_retromolar_sin_lesiones, carrillos_retromolar_con_lesiones = p_carrillos_retromolar_con_lesiones,
        paladar_sin_lesiones = p_paladar_sin_lesiones, paladar_con_lesiones = p_paladar_con_lesiones,
        orofaringe_sin_lesiones = p_orofaringe_sin_lesiones, orofaringe_con_lesiones = p_orofaringe_con_lesiones,
        piso_boca_sin_lesiones = p_piso_boca_sin_lesiones, piso_boca_con_lesiones = p_piso_boca_con_lesiones,
        lengua_sin_lesiones = p_lengua_sin_lesiones, lengua_con_lesiones = p_lengua_con_lesiones,
        encia_sin_lesiones = p_encia_sin_lesiones, encia_con_lesiones = p_encia_con_lesiones,
        -- Oclusión
        oclusion_molar_der = p_oclusion_molar_der, oclusion_molar_izq = p_oclusion_molar_izq,
        oclusion_canina_der = p_oclusion_canina_der, oclusion_canina_izq = p_oclusion_canina_izq,
        oclusion_mordida_cruzada = p_oclusion_mordida_cruzada, oclusion_vestibuloclusion = p_oclusion_vestibuloclusion,
        oclusion_overbite = p_oclusion_overbite, oclusion_mordida_abierta = p_oclusion_mordida_abierta,
        oclusion_sobremordida = p_oclusion_sobremordida, oclusion_relacion_vertical_otros = p_oclusion_relacion_vertical_otros,
        oclusion_overjet = p_oclusion_overjet, oclusion_protrusion = p_oclusion_protrusion,
        oclusion_guia_incisiva = p_oclusion_guia_incisiva, -- ✅
        oclusion_contacto_posterior = p_oclusion_contacto_posterior,
        -- Lateralidad
        lat_der_guia_canina = p_lat_der_guia_canina, lat_der_funcion_grupo = p_lat_der_funcion_grupo,
        lat_der_contacto_balance = p_lat_der_contacto_balance, lat_der_describa = p_lat_der_describa,
        lat_izq_guia_canina = p_lat_izq_guia_canina, lat_izq_funcion_grupo = p_lat_izq_funcion_grupo,
        lat_izq_contacto_balance = p_lat_izq_contacto_balance, lat_izq_describa = p_lat_izq_describa
    WHERE id_historia = p_id_historia;

    IF NOT FOUND THEN
        INSERT INTO examen_clinico_boca (
            id_historia,
            labios_sin_lesiones, labios_con_lesiones, vestibulo_sin_lesiones, vestibulo_con_lesiones,
            carrillos_retromolar_sin_lesiones, carrillos_retromolar_con_lesiones,
            paladar_sin_lesiones, paladar_con_lesiones, orofaringe_sin_lesiones, orofaringe_con_lesiones,
            piso_boca_sin_lesiones, piso_boca_con_lesiones, lengua_sin_lesiones, lengua_con_lesiones,
            encia_sin_lesiones, encia_con_lesiones,
            oclusion_molar_der, oclusion_molar_izq, oclusion_canina_der, oclusion_canina_izq,
            oclusion_mordida_cruzada, oclusion_vestibuloclusion,
            oclusion_overbite, oclusion_mordida_abierta, oclusion_sobremordida, oclusion_relacion_vertical_otros,
            oclusion_overjet, oclusion_protrusion, oclusion_guia_incisiva, oclusion_contacto_posterior,
            lat_der_guia_canina, lat_der_funcion_grupo, lat_der_contacto_balance, lat_der_describa,
            lat_izq_guia_canina, lat_izq_funcion_grupo, lat_izq_contacto_balance, lat_izq_describa
        ) VALUES (
            p_id_historia,
            p_labios_sin_lesiones, p_labios_con_lesiones, p_vestibulo_sin_lesiones, p_vestibulo_con_lesiones,
            p_carrillos_retromolar_sin_lesiones, p_carrillos_retromolar_con_lesiones,
            p_paladar_sin_lesiones, p_paladar_con_lesiones, p_orofaringe_sin_lesiones, p_orofaringe_con_lesiones,
            p_piso_boca_sin_lesiones, p_piso_boca_con_lesiones, p_lengua_sin_lesiones, p_lengua_con_lesiones,
            p_encia_sin_lesiones, p_encia_con_lesiones,
            p_oclusion_molar_der, p_oclusion_molar_izq, p_oclusion_canina_der, p_oclusion_canina_izq,
            p_oclusion_mordida_cruzada, p_oclusion_vestibuloclusion,
            p_oclusion_overbite, p_oclusion_mordida_abierta, p_oclusion_sobremordida, p_oclusion_relacion_vertical_otros,
            p_oclusion_overjet, p_oclusion_protrusion, p_oclusion_guia_incisiva, p_oclusion_contacto_posterior,
            p_lat_der_guia_canina, p_lat_der_funcion_grupo, p_lat_der_contacto_balance, p_lat_der_describa,
            p_lat_izq_guia_canina, p_lat_izq_funcion_grupo, p_lat_izq_contacto_balance, p_lat_izq_describa
        );
    END IF;
END;
$$;


--
-- Name: u_examen_general(uuid, character varying, character varying, character varying, character varying, text, text, character varying, character varying, character varying, character varying, character varying, character varying, numeric, numeric, character varying, character varying, character varying, text, character varying, text, character varying, text, character varying, character varying, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_examen_general(IN p_id_historia uuid, IN p_posicion character varying, IN p_actitud character varying, IN p_deambulacion character varying, IN p_facies character varying, IN p_facies_obs text, IN p_conciencia text, IN p_constitucion character varying, IN p_estado_nutritivo character varying, IN p_temperatura character varying, IN p_presion_arterial character varying, IN p_frecuencia_respiratoria character varying, IN p_pulso character varying, IN p_peso numeric, IN p_talla numeric, IN p_piel_color character varying, IN p_piel_humedad character varying, IN p_piel_lesiones character varying, IN p_piel_lesiones_obs text, IN p_piel_anexos character varying, IN p_piel_anexos_obs text, IN p_tcs_distribucion character varying, IN p_tcs_distribucion_obs text, IN p_tcs_cantidad character varying, IN p_ganglios character varying, IN p_ganglios_obs text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Intentar actualizar (UPDATE)
    UPDATE examen_general
    SET
        posicion = p_posicion, actitud = p_actitud, deambulacion = p_deambulacion,
        facies = p_facies, facies_obs = p_facies_obs, conciencia = p_conciencia,
        constitucion = p_constitucion, estado_nutritivo = p_estado_nutritivo,
        temperatura = p_temperatura, presion_arterial = p_presion_arterial,
        frecuencia_respiratoria = p_frecuencia_respiratoria, pulso = p_pulso,
        peso = p_peso, talla = p_talla,
        piel_color = p_piel_color, piel_humedad = p_piel_humedad,
        piel_lesiones = p_piel_lesiones, piel_lesiones_obs = p_piel_lesiones_obs,
        piel_anexos = p_piel_anexos, piel_anexos_obs = p_piel_anexos_obs,
        tcs_distribucion = p_tcs_distribucion, tcs_distribucion_obs = p_tcs_distribucion_obs,
        tcs_cantidad = p_tcs_cantidad,
        ganglios = p_ganglios, ganglios_obs = p_ganglios_obs
    WHERE id_historia = p_id_historia;

    -- Si no existe, insertar (INSERT)
    IF NOT FOUND THEN
        INSERT INTO examen_general (
            id_historia, posicion, actitud, deambulacion, facies, facies_obs,
            conciencia, constitucion, estado_nutritivo, temperatura, presion_arterial,
            frecuencia_respiratoria, pulso, peso, talla,
            piel_color, piel_humedad, piel_lesiones, piel_lesiones_obs,
            piel_anexos, piel_anexos_obs, tcs_distribucion, tcs_distribucion_obs,
            tcs_cantidad, ganglios, ganglios_obs
        ) VALUES (
            p_id_historia, p_posicion, p_actitud, p_deambulacion, p_facies, p_facies_obs,
            p_conciencia, p_constitucion, p_estado_nutritivo, p_temperatura, p_presion_arterial,
            p_frecuencia_respiratoria, p_pulso, p_peso, p_talla,
            p_piel_color, p_piel_humedad, p_piel_lesiones, p_piel_lesiones_obs,
            p_piel_anexos, p_piel_anexos_obs, p_tcs_distribucion, p_tcs_distribucion_obs,
            p_tcs_cantidad, p_ganglios, p_ganglios_obs
        );
    END IF;
END;
$$;


--
-- Name: u_examen_regional(uuid, character varying, character varying, text, character varying, character varying, character varying, character varying, boolean, text, character varying, boolean, character varying, boolean, character varying, boolean, boolean, boolean, boolean, text, boolean, boolean, character varying, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, numeric, text, boolean, character varying, text, boolean, text, boolean, text, boolean, text, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_examen_regional(IN p_id_historia uuid, IN p_cabeza_posicion character varying, IN p_cabeza_movimientos character varying, IN p_cabeza_movimientos_obs text, IN p_craneo_tamano character varying, IN p_craneo_forma character varying, IN p_cara_forma_frente character varying, IN p_cara_forma_perfil character varying, IN p_ojos_cejas_adecuada boolean, IN p_ojos_implantacion_obs text, IN p_ojos_escleroticas character varying, IN p_ojos_agudeza_visual boolean, IN p_ojos_iris_color character varying, IN p_ojos_arco_senil boolean, IN p_nariz_forma character varying, IN p_nariz_permeables boolean, IN p_nariz_secreciones boolean, IN p_nariz_senos_dolorosos boolean, IN p_oidos_anomalias_morfologicas boolean, IN p_oidos_anomalias_obs text, IN p_oidos_secreciones boolean, IN p_oidos_audicion_conservada boolean, IN p_atm_trayectoria character varying, IN p_atm_lat_izq_dolor boolean, IN p_atm_lat_izq_ruido boolean, IN p_atm_lat_izq_salto boolean, IN p_atm_lat_der_dolor boolean, IN p_atm_lat_der_ruido boolean, IN p_atm_lat_der_salto boolean, IN p_atm_prot_dolor boolean, IN p_atm_prot_ruido boolean, IN p_atm_prot_salto boolean, IN p_atm_aper_dolor boolean, IN p_atm_aper_ruido boolean, IN p_atm_aper_salto boolean, IN p_atm_cierre_dolor boolean, IN p_atm_cierre_ruido boolean, IN p_atm_cierre_salto boolean, IN p_atm_coordinacion_condilar boolean, IN p_atm_apertura_maxima_mm numeric, IN p_atm_observaciones text, IN p_atm_musculos_dolor boolean, IN p_atm_musculos_dolor_grado character varying, IN p_atm_musculos_dolor_zona text, IN p_cuello_simetrico boolean, IN p_cuello_simetrico_obs text, IN p_cuello_movilidad_conservada boolean, IN p_cuello_movilidad_obs text, IN p_laringe_alineada boolean, IN p_laringe_alineada_obs text, IN p_cuello_otros text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE examen_regional
    SET
        cabeza_posicion = p_cabeza_posicion, cabeza_movimientos = p_cabeza_movimientos, cabeza_movimientos_obs = p_cabeza_movimientos_obs,
        craneo_tamano = p_craneo_tamano, craneo_forma = p_craneo_forma, cara_forma_frente = p_cara_forma_frente, cara_forma_perfil = p_cara_forma_perfil,
        ojos_cejas_adecuada = p_ojos_cejas_adecuada, ojos_implantacion_obs = p_ojos_implantacion_obs, ojos_escleroticas = p_ojos_escleroticas,
        ojos_agudeza_visual = p_ojos_agudeza_visual, ojos_iris_color = p_ojos_iris_color, ojos_arco_senil = p_ojos_arco_senil,
        nariz_forma = p_nariz_forma, nariz_permeables = p_nariz_permeables, nariz_secreciones = p_nariz_secreciones, nariz_senos_dolorosos = p_nariz_senos_dolorosos,
        oidos_anomalias_morfologicas = p_oidos_anomalias_morfologicas, oidos_anomalias_obs = p_oidos_anomalias_obs, oidos_secreciones = p_oidos_secreciones, oidos_audicion_conservada = p_oidos_audicion_conservada,
        -- ATM
        atm_trayectoria = p_atm_trayectoria,
        atm_lat_izq_dolor = p_atm_lat_izq_dolor, atm_lat_izq_ruido = p_atm_lat_izq_ruido, atm_lat_izq_salto = p_atm_lat_izq_salto,
        atm_lat_der_dolor = p_atm_lat_der_dolor, atm_lat_der_ruido = p_atm_lat_der_ruido, atm_lat_der_salto = p_atm_lat_der_salto,
        atm_prot_dolor = p_atm_prot_dolor, atm_prot_ruido = p_atm_prot_ruido, atm_prot_salto = p_atm_prot_salto,
        atm_aper_dolor = p_atm_aper_dolor, atm_aper_ruido = p_atm_aper_ruido, atm_aper_salto = p_atm_aper_salto,
        atm_cierre_dolor = p_atm_cierre_dolor, atm_cierre_ruido = p_atm_cierre_ruido, atm_cierre_salto = p_atm_cierre_salto,
        atm_coordinacion_condilar = p_atm_coordinacion_condilar, atm_apertura_maxima_mm = p_atm_apertura_maxima_mm, atm_observaciones = p_atm_observaciones,
        atm_musculos_dolor = p_atm_musculos_dolor, atm_musculos_dolor_grado = p_atm_musculos_dolor_grado, atm_musculos_dolor_zona = p_atm_musculos_dolor_zona,
        -- Cuello
        cuello_simetrico = p_cuello_simetrico, cuello_simetrico_obs = p_cuello_simetrico_obs,
        cuello_movilidad_conservada = p_cuello_movilidad_conservada, cuello_movilidad_obs = p_cuello_movilidad_obs,
        laringe_alineada = p_laringe_alineada, laringe_alineada_obs = p_laringe_alineada_obs, cuello_otros = p_cuello_otros
    WHERE id_historia = p_id_historia;

    IF NOT FOUND THEN
        INSERT INTO examen_regional (
            id_historia, cabeza_posicion, cabeza_movimientos, cabeza_movimientos_obs, craneo_tamano, craneo_forma, cara_forma_frente, cara_forma_perfil,
            ojos_cejas_adecuada, ojos_implantacion_obs, ojos_escleroticas, ojos_agudeza_visual, ojos_iris_color, ojos_arco_senil,
            nariz_forma, nariz_permeables, nariz_secreciones, nariz_senos_dolorosos,
            oidos_anomalias_morfologicas, oidos_anomalias_obs, oidos_secreciones, oidos_audicion_conservada,
            atm_trayectoria,
            atm_lat_izq_dolor, atm_lat_izq_ruido, atm_lat_izq_salto,
            atm_lat_der_dolor, atm_lat_der_ruido, atm_lat_der_salto,
            atm_prot_dolor, atm_prot_ruido, atm_prot_salto,
            atm_aper_dolor, atm_aper_ruido, atm_aper_salto,
            atm_cierre_dolor, atm_cierre_ruido, atm_cierre_salto,
            atm_coordinacion_condilar, atm_apertura_maxima_mm, atm_observaciones,
            atm_musculos_dolor, atm_musculos_dolor_grado, atm_musculos_dolor_zona,
            cuello_simetrico, cuello_simetrico_obs, cuello_movilidad_conservada, cuello_movilidad_obs,
            laringe_alineada, laringe_alineada_obs, cuello_otros
        ) VALUES (
            p_id_historia, p_cabeza_posicion, p_cabeza_movimientos, p_cabeza_movimientos_obs, p_craneo_tamano, p_craneo_forma, p_cara_forma_frente, p_cara_forma_perfil,
            p_ojos_cejas_adecuada, p_ojos_implantacion_obs, p_ojos_escleroticas, p_ojos_agudeza_visual, p_ojos_iris_color, p_ojos_arco_senil,
            p_nariz_forma, p_nariz_permeables, p_nariz_secreciones, p_nariz_senos_dolorosos,
            p_oidos_anomalias_morfologicas, p_oidos_anomalias_obs, p_oidos_secreciones, p_oidos_audicion_conservada,
            p_atm_trayectoria,
            p_atm_lat_izq_dolor, p_atm_lat_izq_ruido, p_atm_lat_izq_salto,
            p_atm_lat_der_dolor, p_atm_lat_der_ruido, p_atm_lat_der_salto,
            p_atm_prot_dolor, p_atm_prot_ruido, p_atm_prot_salto,
            p_atm_aper_dolor, p_atm_aper_ruido, p_atm_aper_salto,
            p_atm_cierre_dolor, p_atm_cierre_ruido, p_atm_cierre_salto,
            p_atm_coordinacion_condilar, p_atm_apertura_maxima_mm, p_atm_observaciones,
            p_atm_musculos_dolor, p_atm_musculos_dolor_grado, p_atm_musculos_dolor_zona,
            p_cuello_simetrico, p_cuello_simetrico_obs, p_cuello_movilidad_conservada, p_cuello_movilidad_obs,
            p_laringe_alineada, p_laringe_alineada_obs, p_cuello_otros
        );
    END IF;
END;
$$;


--
-- Name: u_filiacion(uuid, character varying, date, character varying, character varying, character varying, character varying, character varying, character varying, character varying, date, character varying, date, character varying, character varying, character varying, character varying, integer, character varying, date); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_filiacion(IN p_id_historia uuid, IN p_raza character varying, IN p_fecha_nacimiento date, IN p_lugar character varying, IN p_estado_civil character varying, IN p_nombre_conyuge character varying, IN p_ocupacion character varying, IN p_lugar_procedencia character varying, IN p_tiempo_residencia_tacna character varying, IN p_direccion character varying, IN p_ultima_visita_dentista date, IN p_motivo_visita_dentista character varying, IN p_ultima_visita_medico date, IN p_motivo_visita_medico character varying, IN p_contacto_emergencia character varying, IN p_telefono_emergencia character varying, IN p_acompaniante character varying, IN p_edad integer DEFAULT NULL::integer, IN p_sexo character varying DEFAULT NULL::character varying, IN p_fecha_elaboracion date DEFAULT NULL::date)
    LANGUAGE plpgsql
    AS $$
BEGIN

    UPDATE filiacion SET
        raza = p_raza,
        fecha_nacimiento = p_fecha_nacimiento,
        lugar = p_lugar,
        estado_civil = p_estado_civil,
        nombre_conyuge = p_nombre_conyuge,
        ocupacion = p_ocupacion,
        lugar_procedencia = p_lugar_procedencia,
        tiempo_residencia_tacna = p_tiempo_residencia_tacna,
        direccion = p_direccion,
        ultima_visita_dentista = p_ultima_visita_dentista,
        motivo_visita_dentista = p_motivo_visita_dentista,
        ultima_visita_medico = p_ultima_visita_medico,
        motivo_visita_medico = p_motivo_visita_medico,
        contacto_emergencia = p_contacto_emergencia,
        telefono_emergencia = p_telefono_emergencia,
        acompaniante = p_acompaniante,
        edad = p_edad,
        sexo = p_sexo,
        fecha_elaboracion = p_fecha_elaboracion
    WHERE id_historia = p_id_historia;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró filiación con el id_historia proporcionado (%).', p_id_historia;
    END IF;

    RAISE NOTICE 'Filiacion actualizada exitosamente para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al actualizar la filiacion: %', SQLERRM;
END;
$$;


--
-- Name: u_motivo_consulta(uuid, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_motivo_consulta(IN p_id_historia uuid, IN p_motivo text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE motivo_consulta
    SET motivo = p_motivo,
        fecha_registro = CURRENT_TIMESTAMP
    WHERE id_historia = p_id_historia;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró motivo de consulta para la historia clínica indicada (%).', p_id_historia;
    END IF;

    RAISE NOTICE 'Motivo de consulta actualizado para historia %.', p_id_historia;

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'La historia % no existe.', p_id_historia;
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Ya existe un motivo de consulta para la historia %.', p_id_historia;
    WHEN others THEN
        RAISE EXCEPTION 'Ocurrio un error al actualizar el motivo de consulta: %', SQLERRM;
END;
$$;


--
-- Name: u_paciente(uuid, character varying, character varying, character varying, character varying, boolean); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.u_paciente(IN p_id_paciente uuid, IN p_nombre character varying DEFAULT NULL::character varying, IN p_apellido character varying DEFAULT NULL::character varying, IN p_telefono character varying DEFAULT NULL::character varying, IN p_email character varying DEFAULT NULL::character varying, IN p_activo boolean DEFAULT NULL::boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Verificar que el paciente existe
    IF NOT EXISTS (SELECT 1 FROM paciente WHERE id_paciente = p_id_paciente) THEN
        RAISE EXCEPTION 'No existe un paciente con el ID proporcionado';
    END IF;

    -- Actualizar solo los campos que no sean NULL
    UPDATE paciente
    SET
        nombre = COALESCE(p_nombre, nombre),
        apellido = COALESCE(p_apellido, apellido),
        telefono = COALESCE(p_telefono, telefono),
        email = COALESCE(p_email, email),
        activo = COALESCE(p_activo, activo)
    WHERE id_paciente = p_id_paciente;

    RAISE NOTICE 'Paciente actualizado exitosamente: %', p_id_paciente;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error al actualizar paciente: %', SQLERRM;
END;
$$;


--
-- Name: PROCEDURE u_paciente(IN p_id_paciente uuid, IN p_nombre character varying, IN p_apellido character varying, IN p_telefono character varying, IN p_email character varying, IN p_activo boolean); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON PROCEDURE public.u_paciente(IN p_id_paciente uuid, IN p_nombre character varying, IN p_apellido character varying, IN p_telefono character varying, IN p_email character varying, IN p_activo boolean) IS 'Actualiza los datos de un paciente existente (nombre, teléfono, email, estado activo)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: adjunto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adjunto (
    id_adjunto uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    nombre_original character varying(500) NOT NULL,
    nombre_storage character varying(500) NOT NULL,
    tipo_mime character varying(100) NOT NULL,
    tamano_bytes integer NOT NULL,
    descripcion text,
    fecha_subida timestamp with time zone DEFAULT now() NOT NULL,
    id_usuario uuid
);


--
-- Name: antecedente_cumplimiento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.antecedente_cumplimiento (
    id_ant_cumplimiento uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    motivo_dolor boolean,
    motivo_control boolean,
    frecuencia_control_meses integer,
    motivo_limpieza boolean,
    frecuencia_limpieza_meses integer,
    actitud_tranquilo boolean,
    actitud_aprensivo boolean,
    actitud_panico boolean,
    desagrado_atencion text,
    fecha_consentimiento date,
    firma_nombre character varying(250),
    historia_elaborada_por character varying(150)
);


--
-- Name: antecedente_familiar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.antecedente_familiar (
    id_ant_fam uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid,
    descripcion text
);


--
-- Name: antecedente_medico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.antecedente_medico (
    id_ant_patologico uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    salud_general character varying(50),
    bajo_tratamiento boolean,
    tipo_tratamiento character varying(200),
    hospitalizaciones text,
    tuvo_traumatismos boolean,
    tipo_traumatismos text,
    alergias text,
    medicamentos_contraindicados text,
    enf_hepatitis boolean,
    enf_alergia_cronica boolean,
    enf_corazon boolean,
    enf_fiebre_reumatica boolean,
    enf_anemia boolean,
    enf_asma boolean,
    enf_diabetes boolean,
    enf_epilepsia boolean,
    enf_coagulacion boolean,
    enf_tbc boolean,
    enf_hipertension boolean,
    enf_ulcera boolean,
    enf_neurologica boolean,
    otras_enf_patologicas text,
    odontologicos text
);


--
-- Name: antecedente_personal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.antecedente_personal (
    id_antecedente uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    esta_embarazada boolean,
    mac character varying(200),
    otros text,
    psicosocial text,
    vacunas text,
    hepatitis_b boolean,
    id_grupo_sanguineo uuid,
    fuma boolean,
    cigarrillos_dia integer,
    toma_te boolean,
    tazas_te_dia integer,
    toma_alcohol boolean,
    frecuencia_alcohol character varying(100),
    aprieta_dientes boolean,
    momento_aprieta character varying(100),
    rechina boolean,
    dolor_muscular boolean,
    chupa_dedo boolean,
    muerde_objetos boolean,
    muerde_labios boolean,
    otros_habitos text,
    frecuencia_cepillado integer,
    cepillo_duro boolean,
    cepillo_mediano boolean,
    cepillo_blando boolean,
    cepillo_electrico boolean,
    cepillo_interproximal boolean,
    tipo_interproximal character varying(100),
    seda_dental boolean,
    enjuague_bucal boolean,
    otros_elementos_higiene text
);


--
-- Name: auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auditoria (
    id_auditoria uuid DEFAULT gen_random_uuid() NOT NULL,
    id_usuario uuid NOT NULL,
    fecha_cambio timestamp without time zone DEFAULT now() NOT NULL,
    nombre_tabla character varying(50) NOT NULL,
    id_registro_afectado uuid NOT NULL,
    accion character varying(10) NOT NULL,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    ip_address character varying(45),
    user_agent text,
    CONSTRAINT chk_auditoria_accion CHECK (((accion)::text = ANY ((ARRAY['INSERT'::character varying, 'UPDATE'::character varying, 'DELETE'::character varying])::text[])))
);


--
-- Name: catalogo_atm_trayectoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_atm_trayectoria (
    id_trayectoria uuid DEFAULT gen_random_uuid() NOT NULL,
    descripcion character varying(50) NOT NULL
);


--
-- Name: catalogo_clinica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_clinica (
    id_clinica uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL
);


--
-- Name: catalogo_dolor_grado; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_dolor_grado (
    id_grado uuid DEFAULT gen_random_uuid() NOT NULL,
    descripcion character varying(50) NOT NULL
);


--
-- Name: catalogo_enfermedad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_enfermedad (
    id_enfermedad uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL
);


--
-- Name: catalogo_estado_civil; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_estado_civil (
    id_estado_civil uuid DEFAULT gen_random_uuid() NOT NULL,
    descripcion character varying(50) NOT NULL
);


--
-- Name: catalogo_estado_revision; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_estado_revision (
    id_estado_revision uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(20) NOT NULL
);


--
-- Name: catalogo_examen_auxiliar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_examen_auxiliar (
    id_examen uuid DEFAULT gen_random_uuid() NOT NULL,
    descripcion character varying(100) NOT NULL
);


--
-- Name: catalogo_grado_instruccion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_grado_instruccion (
    id_grado_instruccion uuid DEFAULT gen_random_uuid() NOT NULL,
    descripcion character varying(100) NOT NULL
);


--
-- Name: catalogo_grupo_sanguineo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_grupo_sanguineo (
    id_grupo_sanguineo uuid DEFAULT gen_random_uuid() NOT NULL,
    descripcion character varying(10) NOT NULL
);


--
-- Name: catalogo_habito; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_habito (
    id_habito uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(100) NOT NULL
);


--
-- Name: catalogo_medida_regional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_medida_regional (
    id_medida uuid DEFAULT gen_random_uuid() NOT NULL,
    tipo_medida character varying(50) NOT NULL,
    descripcion character varying(50) NOT NULL
);


--
-- Name: catalogo_movimiento_mandibular; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_movimiento_mandibular (
    id_movimiento uuid DEFAULT gen_random_uuid() NOT NULL,
    descripcion character varying(50) NOT NULL
);


--
-- Name: catalogo_ocupacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_ocupacion (
    id_ocupacion uuid DEFAULT gen_random_uuid() NOT NULL,
    descripcion character varying(100) NOT NULL
);


--
-- Name: catalogo_posicion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_posicion (
    id_posicion uuid DEFAULT gen_random_uuid() NOT NULL,
    posicion character varying(50) NOT NULL
);


--
-- Name: catalogo_sexo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogo_sexo (
    id_sexo uuid DEFAULT gen_random_uuid() NOT NULL,
    descripcion character varying(20) NOT NULL
);


--
-- Name: TABLE catalogo_sexo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.catalogo_sexo IS 'Datos seed insertados';


--
-- Name: cita; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cita (
    id_cita uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    id_estudiante uuid NOT NULL,
    fecha_hora timestamp with time zone NOT NULL,
    duracion_min integer DEFAULT 60 NOT NULL,
    motivo text,
    estado character varying(50) DEFAULT 'programada'::character varying NOT NULL,
    id_usuario uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: derivacion_clinicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.derivacion_clinicas (
    id_derivacion uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    destinos jsonb,
    observaciones text,
    fecha_derivacion date DEFAULT CURRENT_DATE,
    alumno_diagnostico character varying(200),
    docente character varying(200)
);


--
-- Name: diagnostico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnostico (
    id_diagnostico uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    tipo character varying(50),
    fecha date DEFAULT CURRENT_DATE,
    descripcion text,
    clinica_respuesta character varying(200),
    examenes_auxiliares jsonb,
    interconsulta_detalle text,
    fecha_interconsulta date,
    clinica_interconsulta character varying(200),
    diagnostico_definitivo text,
    tratamiento_realizar text,
    pronostico text,
    alumno_tratante character varying(200),
    CONSTRAINT diagnostico_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['presuntivo'::character varying, 'definitivo_clinicas'::character varying])::text[])))
);


--
-- Name: TABLE diagnostico; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.diagnostico IS 'Tabla unificada. Tipo=presuntivo (Secc III). Tipo=definitivo_clinicas (Secc V + Plan)';


--
-- Name: empleados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empleados (
    id_empleado integer NOT NULL,
    nombre text NOT NULL,
    departamento text NOT NULL,
    salario numeric(10,2),
    fecha_ingreso date DEFAULT CURRENT_DATE
);


--
-- Name: empleados_id_empleado_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.empleados_id_empleado_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: empleados_id_empleado_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.empleados_id_empleado_seq OWNED BY public.empleados.id_empleado;


--
-- Name: enfermedad_actual; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enfermedad_actual (
    id_enfermedad_actual uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid,
    sintoma_principal character varying(300),
    tiempo_enfermedad character varying(100),
    forma_inicio character varying(200),
    curso character varying(200),
    relato text,
    tratamiento_prev text
);


--
-- Name: epb; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.epb (
    id_epb uuid NOT NULL,
    id_historia uuid NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    valores text NOT NULL,
    codigo_max smallint NOT NULL,
    id_usuario uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: equipo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.equipo (
    id_equipo uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(300) NOT NULL,
    descripcion text,
    codigo character varying(100),
    estado character varying(50) DEFAULT 'disponible'::character varying NOT NULL
);


--
-- Name: evolucion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evolucion (
    id_evolucion uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    fecha date DEFAULT CURRENT_DATE,
    actividad text NOT NULL,
    alumno character varying(200),
    observaciones text,
    CONSTRAINT chk_evolucion_fecha CHECK ((fecha <= CURRENT_DATE))
);


--
-- Name: examen_auxiliar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.examen_auxiliar (
    id_examen_auxiliar uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    id_examen uuid NOT NULL,
    detalle character varying(200),
    fecha_solicitud timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: examen_clinico_boca; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.examen_clinico_boca (
    id_boca uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid,
    labios_sin_lesiones text,
    labios_con_lesiones text,
    vestibulo_sin_lesiones text,
    vestibulo_con_lesiones text,
    carrillos_retromolar_sin_lesiones text,
    carrillos_retromolar_con_lesiones text,
    paladar_sin_lesiones text,
    paladar_con_lesiones text,
    orofaringe_sin_lesiones text,
    orofaringe_con_lesiones text,
    piso_boca_sin_lesiones text,
    piso_boca_con_lesiones text,
    lengua_sin_lesiones text,
    lengua_con_lesiones text,
    encia_sin_lesiones text,
    encia_con_lesiones text,
    oclusion_molar_der character varying(50),
    oclusion_molar_izq character varying(50),
    oclusion_canina_der character varying(50),
    oclusion_canina_izq character varying(50),
    oclusion_mordida_cruzada character varying(50),
    oclusion_vestibuloclusion boolean,
    oclusion_overbite numeric(4,1),
    oclusion_mordida_abierta character varying(50),
    oclusion_sobremordida boolean,
    oclusion_relacion_vertical_otros text,
    oclusion_overjet numeric(4,1),
    oclusion_protrusion boolean,
    oclusion_guia_incisiva boolean,
    oclusion_contacto_posterior text,
    lat_der_guia_canina boolean,
    lat_der_funcion_grupo boolean,
    lat_der_contacto_balance boolean,
    lat_der_describa text,
    lat_izq_guia_canina boolean,
    lat_izq_funcion_grupo boolean,
    lat_izq_contacto_balance boolean,
    lat_izq_describa text
);


--
-- Name: examen_general; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.examen_general (
    id_examen uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid,
    posicion character varying(50),
    actitud character varying(50),
    deambulacion character varying(50),
    facies character varying(50),
    facies_obs text,
    conciencia text,
    constitucion character varying(50),
    estado_nutritivo character varying(50),
    temperatura character varying(50),
    presion_arterial character varying(50),
    frecuencia_respiratoria character varying(50),
    pulso character varying(50),
    peso numeric(5,2),
    talla numeric(5,2),
    piel_color character varying(100),
    piel_humedad character varying(50),
    piel_lesiones character varying(50),
    piel_lesiones_obs text,
    piel_anexos character varying(50),
    piel_anexos_obs text,
    tcs_distribucion character varying(50),
    tcs_distribucion_obs text,
    tcs_cantidad character varying(50),
    ganglios character varying(50),
    ganglios_obs text
);


--
-- Name: examen_higiene_oral; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.examen_higiene_oral (
    id_higiene uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    estado_higiene character varying(20),
    fecha_registro timestamp without time zone DEFAULT now(),
    CONSTRAINT examen_higiene_oral_estado_higiene_check CHECK (((estado_higiene)::text = ANY ((ARRAY['Bueno'::character varying, 'Regular'::character varying, 'Deficiente'::character varying])::text[])))
);


--
-- Name: TABLE examen_higiene_oral; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.examen_higiene_oral IS 'Módulo de Examen Físico: Evaluación cualitativa de la higiene bucal';


--
-- Name: examen_regional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.examen_regional (
    id_regional uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid,
    cabeza_posicion character varying(50),
    cabeza_movimientos character varying(50),
    cabeza_movimientos_obs text,
    craneo_tamano character varying(50),
    craneo_forma character varying(50),
    cara_forma_frente character varying(50),
    cara_forma_perfil character varying(50),
    ojos_cejas_adecuada boolean,
    ojos_implantacion_obs text,
    ojos_escleroticas character varying(50),
    ojos_agudeza_visual boolean,
    ojos_iris_color character varying(50),
    ojos_arco_senil boolean,
    nariz_forma character varying(100),
    nariz_permeables boolean,
    nariz_secreciones boolean,
    nariz_senos_dolorosos boolean,
    oidos_anomalias_morfologicas boolean,
    oidos_anomalias_obs text,
    oidos_secreciones boolean,
    oidos_audicion_conservada boolean,
    atm_trayectoria character varying(50),
    atm_lat_izq_dolor boolean,
    atm_lat_izq_ruido boolean,
    atm_lat_izq_salto boolean,
    atm_lat_der_dolor boolean,
    atm_lat_der_ruido boolean,
    atm_lat_der_salto boolean,
    atm_prot_dolor boolean,
    atm_prot_ruido boolean,
    atm_prot_salto boolean,
    atm_aper_dolor boolean,
    atm_aper_ruido boolean,
    atm_aper_salto boolean,
    atm_cierre_dolor boolean,
    atm_cierre_ruido boolean,
    atm_cierre_salto boolean,
    atm_coordinacion_condilar boolean,
    atm_apertura_maxima_mm numeric(5,2),
    atm_observaciones text,
    atm_musculos_dolor boolean,
    atm_musculos_dolor_grado character varying(50),
    atm_musculos_dolor_zona text,
    cuello_simetrico boolean,
    cuello_simetrico_obs text,
    cuello_movilidad_conservada boolean,
    cuello_movilidad_obs text,
    laringe_alineada boolean,
    laringe_alineada_obs text,
    cuello_otros text
);


--
-- Name: ficha_evaluacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ficha_evaluacion (
    id_evaluacion uuid DEFAULT gen_random_uuid() NOT NULL,
    id_ficha uuid NOT NULL,
    id_historia uuid NOT NULL,
    puntaje_total numeric(5,2),
    comentarios text,
    estado character varying(50) DEFAULT 'pendiente'::character varying NOT NULL,
    id_docente uuid,
    fecha_evaluacion timestamp with time zone
);


--
-- Name: ficha_operacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ficha_operacion (
    id_ficha uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    diagnostico text,
    procedimiento text NOT NULL,
    materiales text,
    observaciones text,
    estado character varying(50) DEFAULT 'borrador'::character varying NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    alumno character varying(200),
    id_usuario uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ficha_operacion_auditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ficha_operacion_auditoria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    id_ficha uuid NOT NULL,
    campo character varying(100) NOT NULL,
    valor_anterior text,
    valor_nuevo text,
    id_usuario uuid,
    fecha timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: filiacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.filiacion (
    id_filiacion uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid,
    raza character varying(100),
    fecha_nacimiento date,
    lugar character varying(150),
    estado_civil character varying(100),
    nombre_conyuge character varying(200),
    ocupacion character varying(100),
    lugar_procedencia character varying(150),
    tiempo_residencia_tacna character varying(50),
    direccion character varying(200),
    ultima_visita_dentista date,
    motivo_visita_dentista character varying(300),
    ultima_visita_medico date,
    motivo_visita_medico character varying(300),
    contacto_emergencia character varying(200),
    telefono_emergencia character varying(20),
    acompaniante character varying(200),
    edad integer,
    sexo character varying(20),
    fecha_elaboracion date,
    CONSTRAINT chk_filiacion_fecha_elaboracion CHECK ((fecha_elaboracion <= CURRENT_DATE)),
    CONSTRAINT chk_filiacion_fecha_nacimiento CHECK ((fecha_nacimiento <= CURRENT_DATE)),
    CONSTRAINT chk_filiacion_ultima_visita_dentista CHECK ((ultima_visita_dentista <= CURRENT_DATE)),
    CONSTRAINT chk_filiacion_ultima_visita_medico CHECK ((ultima_visita_medico <= CURRENT_DATE))
);


--
-- Name: historia_clinica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historia_clinica (
    id_historia uuid DEFAULT gen_random_uuid() NOT NULL,
    id_paciente uuid,
    id_estudiante uuid NOT NULL,
    fecha_elaboracion date DEFAULT CURRENT_DATE NOT NULL,
    ultima_modificacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'borrador'::character varying,
    CONSTRAINT chk_historia_clinica_estado CHECK (((estado)::text = ANY ((ARRAY['en_proceso'::character varying, 'completada'::character varying, 'aprobada'::character varying, 'rechazada'::character varying, 'borrador'::character varying])::text[]))),
    CONSTRAINT chk_historia_clinica_fecha_elaboracion CHECK ((fecha_elaboracion <= CURRENT_DATE))
);


--
-- Name: iho_s; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.iho_s (
    id_iho uuid NOT NULL,
    id_historia uuid NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    valores text NOT NULL,
    idb numeric(4,2) NOT NULL,
    icalc numeric(4,2) NOT NULL,
    ihos numeric(4,2) NOT NULL,
    clasificacion character varying(20) NOT NULL,
    id_usuario uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: motivo_consulta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.motivo_consulta (
    id_motivo uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid,
    motivo text NOT NULL,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notificacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacion (
    id_notificacion uuid DEFAULT gen_random_uuid() NOT NULL,
    id_destinatario uuid NOT NULL,
    titulo character varying(300) NOT NULL,
    mensaje text NOT NULL,
    tipo character varying(50) NOT NULL,
    leida boolean DEFAULT false NOT NULL,
    id_referencia uuid,
    fecha timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: odontograma_entrada; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.odontograma_entrada (
    id_entrada uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    numero_diente smallint NOT NULL,
    superficie character varying(20),
    diagnostico text,
    tratamiento text,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    alumno character varying(200),
    id_usuario uuid,
    tipo character varying(12) DEFAULT 'EVOLUCION'::character varying NOT NULL,
    codigo_hallazgo character varying(10)
);


--
-- Name: odontograma_svg; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.odontograma_svg (
    id_svg uuid NOT NULL,
    id_historia uuid NOT NULL,
    tipo character varying(12) NOT NULL,
    svg text NOT NULL,
    especificaciones text,
    observaciones text,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    id_usuario uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: paciente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paciente (
    id_paciente uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(200) NOT NULL,
    apellido character varying(200) NOT NULL,
    dni character(8),
    fecha_nacimiento date,
    telefono character varying(20),
    email character varying(200),
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    activo boolean DEFAULT true,
    sexo character varying(20)
);


--
-- Name: pago_hc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pago_hc (
    id_pago uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    monto numeric(6,2) DEFAULT 2.00 NOT NULL,
    fecha_pago date DEFAULT CURRENT_DATE NOT NULL,
    id_admin uuid
);


--
-- Name: prescripcion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prescripcion (
    id_prescripcion uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    medicamento character varying(300) NOT NULL,
    dosis character varying(200),
    duracion character varying(100),
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    prescriptor character varying(200),
    id_usuario uuid
);


--
-- Name: prestamo_equipo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prestamo_equipo (
    id_prestamo uuid DEFAULT gen_random_uuid() NOT NULL,
    id_equipo uuid NOT NULL,
    id_estudiante uuid NOT NULL,
    fecha_prestamo timestamp with time zone DEFAULT now() NOT NULL,
    fecha_devolucion_prevista timestamp with time zone,
    fecha_devolucion_real timestamp with time zone,
    estado character varying(50) DEFAULT 'activo'::character varying NOT NULL,
    id_admin uuid
);


--
-- Name: referencia_clinica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referencia_clinica (
    id_ref uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    id_clinica uuid NOT NULL,
    observaciones text,
    fecha date DEFAULT CURRENT_DATE,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    CONSTRAINT chk_referencia_clinica_estado CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'atendida'::character varying, 'cancelada'::character varying])::text[]))),
    CONSTRAINT chk_referencia_clinica_fecha CHECK ((fecha <= CURRENT_DATE))
);


--
-- Name: refresh_token; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_token (
    jti uuid NOT NULL,
    id_usuario uuid NOT NULL,
    revocado boolean DEFAULT false NOT NULL,
    reemplazado_por uuid,
    expira_en timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: revision_historia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.revision_historia (
    id_revision uuid DEFAULT gen_random_uuid() NOT NULL,
    id_historia uuid NOT NULL,
    id_docente uuid NOT NULL,
    fecha date DEFAULT CURRENT_DATE,
    id_estado_revision uuid NOT NULL,
    observaciones text,
    CONSTRAINT chk_revision_historia_fecha CHECK ((fecha <= CURRENT_DATE))
);


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    id_usuario uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo_usuario character varying(100) NOT NULL,
    nombre character varying(200) NOT NULL,
    apellido character varying(200) NOT NULL,
    dni character(8) NOT NULL,
    email character varying(200) NOT NULL,
    rol character varying(50) NOT NULL,
    contrasena_hash character varying(255) NOT NULL,
    activo boolean DEFAULT true,
    CONSTRAINT chk_usuario_dni_formato CHECK ((dni ~ '^[0-9]{8}$'::text)),
    CONSTRAINT chk_usuario_email CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT chk_usuario_rol CHECK (((rol)::text = ANY ((ARRAY['estudiante'::character varying, 'docente'::character varying, 'admin'::character varying])::text[])))
);


--
-- Name: TABLE usuario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.usuario IS 'Estudiantes reales del curso de Base de Datos II - ESIS UNJBG';


--
-- Name: empleados id_empleado; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados ALTER COLUMN id_empleado SET DEFAULT nextval('public.empleados_id_empleado_seq'::regclass);


--
-- Data for Name: adjunto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.adjunto (id_adjunto, id_historia, nombre_original, nombre_storage, tipo_mime, tamano_bytes, descripcion, fecha_subida, id_usuario) FROM stdin;
\.


--
-- Data for Name: antecedente_cumplimiento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.antecedente_cumplimiento (id_ant_cumplimiento, id_historia, motivo_dolor, motivo_control, frecuencia_control_meses, motivo_limpieza, frecuencia_limpieza_meses, actitud_tranquilo, actitud_aprensivo, actitud_panico, desagrado_atencion, fecha_consentimiento, firma_nombre, historia_elaborada_por) FROM stdin;
1c9e9670-8020-40c9-9c07-489e92a4a374	e1616800-f790-4058-8c40-8c62f1b6afcd	t	f	12	f	6	t	f	f	Ninguno	2025-11-30	Juan Pérez	Dr. López
c06ec703-b9c2-484f-baee-c3b1045ea87e	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	f	f	\N	f	\N	f	f	f	\N	\N	\N	\N
862500c3-1e38-4de4-8dba-b58856edd95e	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	f	f	\N	f	\N	f	f	f	\N	\N	\N	\N
2eda37ee-e18f-4b76-989c-8d1cd0ec2278	2ff6d047-c7a1-4cf4-963c-c8558b6c572b	f	f	\N	f	\N	f	f	f	\N	\N	\N	\N
bed9b666-8230-4ed4-8f9a-7b8c2a3b9f91	d394fbcf-cc84-4c90-9f13-a458aec92e66	f	f	\N	f	\N	f	f	f	\N	\N	\N	\N
cdfbec91-d069-42a4-b4c3-d5e1b5b39b66	95cf32b6-c707-423f-b26e-2cb4893c26c7	f	f	\N	f	\N	f	f	f	\N	\N	\N	\N
f3c1b8c1-c985-4f8d-8b94-a21e16247453	4a766208-4cc4-481f-94f6-2f2adb2cc655	f	f	\N	f	\N	f	f	f	\N	\N	\N	\N
5c9d9b92-a8fd-4952-9b38-ae4ae20df624	4cc2fe5c-337e-4439-b349-77e0127542f5	f	f	\N	f	\N	f	f	f	\N	\N	\N	\N
35f40796-47b3-42c8-bbc2-9f1a83bb9b17	eff908c3-ad3c-4807-8706-61988d104eb6	f	f	\N	f	\N	f	f	f	\N	\N	\N	\N
7d0920db-0bff-456c-9d33-32e3a1425ea5	90d29073-ed9b-41d5-89ad-16f716d6c27b	t	t	11	t	11	t	t	t	123123	2005-04-23	jheral	asda
169ed627-d573-470c-aa1b-fb2084d5e65c	550e8400-e29b-41d4-a716-446655440000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: antecedente_familiar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.antecedente_familiar (id_ant_fam, id_historia, descripcion) FROM stdin;
11426772-a129-4e51-9cd7-1d64e4aee909	e1616800-f790-4058-8c40-8c62f1b6afcd	Padre con hipertensión, madre mal.
91ee6553-6ff8-4e5a-97ee-c8fdd141c755	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	\N
e67cce20-3ec6-4c9e-a84a-85b4e2f92524	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	\N
cf7dbc93-c0b5-4271-aeb9-219f191ff0c0	2ff6d047-c7a1-4cf4-963c-c8558b6c572b	\N
b2c98cd1-1f55-463c-b928-6df39270996e	d394fbcf-cc84-4c90-9f13-a458aec92e66	\N
b441d701-e6fb-46bf-9924-f1c54502577e	95cf32b6-c707-423f-b26e-2cb4893c26c7	\N
a555ee1d-8ba1-47ee-8940-090ecb5c56c8	4a766208-4cc4-481f-94f6-2f2adb2cc655	\N
cfd1a090-d47e-4834-b275-25d7d490ab93	4cc2fe5c-337e-4439-b349-77e0127542f5	\N
6f0920b0-dd1a-4b58-b7b0-561b6ebef46e	eff908c3-ad3c-4807-8706-61988d104eb6	\N
0958c787-3140-4e86-835a-6c0e7df2bed3	90d29073-ed9b-41d5-89ad-16f716d6c27b	holaasdasd
\.


--
-- Data for Name: antecedente_medico; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.antecedente_medico (id_ant_patologico, id_historia, salud_general, bajo_tratamiento, tipo_tratamiento, hospitalizaciones, tuvo_traumatismos, tipo_traumatismos, alergias, medicamentos_contraindicados, enf_hepatitis, enf_alergia_cronica, enf_corazon, enf_fiebre_reumatica, enf_anemia, enf_asma, enf_diabetes, enf_epilepsia, enf_coagulacion, enf_tbc, enf_hipertension, enf_ulcera, enf_neurologica, otras_enf_patologicas, odontologicos) FROM stdin;
ae1cc285-6e4b-429b-a65a-7b9137c18fab	e1616800-f790-4058-8c40-8c62f1b6afcd	Mala	f		Ninguna	f		Penicilina	Penicilina	f	f	f	f	f	f	f	f	f	f	f	f	f		Extracción de muela
ca955c5c-52d3-4cf2-8638-06da3619e6ce	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	Regular	f	\N	\N	f	\N	\N	\N	t	t	f	f	f	f	f	f	f	f	f	f	f	\N	Caries
11898c12-05ff-48c9-9bc9-a1b6ae905c2c	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	Regular	f	\N	\N	f	\N	\N	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	\N	\N
a590cf1f-312b-4134-a753-6afdb1aeed25	2ff6d047-c7a1-4cf4-963c-c8558b6c572b	Regular	f	\N	\N	f	\N	\N	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	\N	\N
cc468534-83ca-49f9-bbe9-f0a7f1c5837f	d394fbcf-cc84-4c90-9f13-a458aec92e66	Regular	f	\N	\N	f	\N	\N	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	\N	\N
a13dc9b4-3530-42d8-be6f-94fe0f37c72d	95cf32b6-c707-423f-b26e-2cb4893c26c7	Regular	f	\N	\N	f	\N	\N	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	\N	\N
59209749-366a-440f-9ef2-d1c3ee647e09	4a766208-4cc4-481f-94f6-2f2adb2cc655	Regular	t	asda	\N	f	\N	\N	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	\N	\N
a0c3522e-6028-454e-8e77-f11599dc03fa	4cc2fe5c-337e-4439-b349-77e0127542f5	Regular	f	\N	\N	f	\N	\N	\N	f	t	t	f	f	f	f	f	f	f	f	f	f	\N	\N
81a7f3c8-e6e1-4c21-a982-51094efff672	eff908c3-ad3c-4807-8706-61988d104eb6	Regular	f	\N	\N	f	\N	\N	\N	f	f	f	f	f	f	f	f	f	f	f	f	f	\N	\N
fb7378e0-84fd-4532-b0ad-f31fe2407a98	90d29073-ed9b-41d5-89ad-16f716d6c27b	Mala	t	\N	si noseaadasda	t	asdasd	\N	\N	t	t	f	f	f	f	f	t	f	f	f	f	f	asdasd	sadas
dafa8d66-4933-45c1-a520-99b99d538d21	550e8400-e29b-41d4-a716-446655440000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: antecedente_personal; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.antecedente_personal (id_antecedente, id_historia, esta_embarazada, mac, otros, psicosocial, vacunas, hepatitis_b, id_grupo_sanguineo, fuma, cigarrillos_dia, toma_te, tazas_te_dia, toma_alcohol, frecuencia_alcohol, aprieta_dientes, momento_aprieta, rechina, dolor_muscular, chupa_dedo, muerde_objetos, muerde_labios, otros_habitos, frecuencia_cepillado, cepillo_duro, cepillo_mediano, cepillo_blando, cepillo_electrico, cepillo_interproximal, tipo_interproximal, seda_dental, enjuague_bucal, otros_elementos_higiene) FROM stdin;
f3c3c170-9d0f-4e4a-9c91-363bed432087	ec56d593-2d6e-4184-b1c6-f241e23abf73	f	false	\N	\N	\N	f	\N	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
7baf11b6-de7c-4e6c-ab4f-ea8f8cea5d1a	e222b37a-52d9-45a3-83b1-e08c3ae6d4d4	f	false	\N	\N	\N	f	\N	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
2beeb75b-b1ab-45d4-9d43-ebe025983bac	2bd3dfef-af95-450b-b6bd-3b05555d9b6e	f	true	\N	\N	\N	f	\N	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
cb06a69f-e7cb-4636-852d-70936ca9af69	9258696e-35bc-4c67-92ab-551a9ea88d4c	f	false	\N	\N	\N	f	\N	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
3d60d52f-7a28-4bf7-a331-2ef4b661d9a2	6eecb185-a562-4099-ad3e-5f6ace205f4d	f	false	\N	\N	\N	f	\N	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
19c43404-2910-4a4c-9ee1-dee00a4d9999	fad097b8-8b44-4c2c-ac35-66fd43e62df6	t	true	a	ass	\N	f	\N	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
8f8eab8a-c51d-4200-a86e-f7802ac1ab9c	90d29073-ed9b-41d5-89ad-16f716d6c27b	f	true	asdasd	aaaaaaaasdasd	asdasd	t	\N	f	\N	f	\N	\N	\N	f	asdasd	f	f	f	f	f	aaeasdasd	\N	f	f	f	f	f	aaaee	f	f	aa
3c24e831-0961-441b-9aa6-000c2eb32403	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	t	false	\N	asdasd\n	Covid	f	af048336-63fa-47c7-9b4f-0a9fff806282	f	\N	f	\N	\N	\N	f	\N	f	f	t	f	t	\N	\N	t	f	f	f	f	\N	f	t	\N
ff74cb22-1ed8-4b73-b51d-8fec6026eea9	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	f	false	\N	\N	\N	f	26c54b60-387c-42da-9a4b-fda784ecdfab	f	\N	t	1	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
67edf75d-b73c-440c-b0a8-807dbf859128	2ff6d047-c7a1-4cf4-963c-c8558b6c572b	f	false	\N	asdasd	\N	f	\N	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
2828baa5-9a2d-4e71-8cf0-9e738102321b	d394fbcf-cc84-4c90-9f13-a458aec92e66	f	false	dasd	\N	\N	f	26c54b60-387c-42da-9a4b-fda784ecdfab	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
6c315c8e-32c2-449a-94d9-91de0e68b241	95cf32b6-c707-423f-b26e-2cb4893c26c7	f	false	\N	\N	\N	f	7b58cd88-e77c-4ef1-907c-a67f926c643b	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
f091a8c3-9143-4825-8cfe-adfec3f330b7	4a766208-4cc4-481f-94f6-2f2adb2cc655	f	false	asdasd	asdasd	\N	f	\N	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
a03d3a14-d1c4-49ac-b4d3-277ae15ef16f	e1616800-f790-4058-8c40-8c62f1b6afcd	f	Ninguno	Ninguno	Sin problemas	Completo	f	55bb9f0f-8315-430c-a317-a180f8d01cdc	f	0	t	2	f		f		f	f	f	f	f	Limparme lo dientes con laa lengua	3	f	t	f	f	f		t	t	Hilo dental
f0edb545-874b-4c4b-9e42-9c23591f10a9	4cc2fe5c-337e-4439-b349-77e0127542f5	f	false	\N	asdasd	\N	t	\N	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	f	\N	\N	f	f	f	f	f	\N	f	f	\N
385f289e-1ffa-42c2-8739-2b48890701ee	eff908c3-ad3c-4807-8706-61988d104eb6	f	false	\N	asdasd	\N	f	\N	f	\N	f	\N	\N	\N	f	\N	f	f	f	f	t	\N	\N	f	f	f	f	f	\N	f	f	\N
20c7461e-d9af-43ff-8181-4195c2f52822	550e8400-e29b-41d4-a716-446655440000	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: auditoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.auditoria (id_auditoria, id_usuario, fecha_cambio, nombre_tabla, id_registro_afectado, accion, datos_anteriores, datos_nuevos, ip_address, user_agent) FROM stdin;
b28b4638-a73a-4fcd-8c98-971bd340f77b	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-02 07:55:23.452976	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "fdac3dfd-f403-44b0-8155-60291804abef", "id_historia": "948b53d6-f8b4-41d6-bc70-2c475368c755", "estado_higiene": "Regular", "fecha_registro": "2025-12-02T07:55:23.452976"}	\N	\N
f29afa5c-bced-4b0a-95d0-69ea711a9328	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-02 23:55:24.728138	examen_higiene_oral	00000000-0000-0000-0000-000000000000	UPDATE	{"id_higiene": "fdac3dfd-f403-44b0-8155-60291804abef", "id_historia": "948b53d6-f8b4-41d6-bc70-2c475368c755", "estado_higiene": "Regular", "fecha_registro": "2025-12-02T07:55:23.452976"}	{"id_higiene": "fdac3dfd-f403-44b0-8155-60291804abef", "id_historia": "948b53d6-f8b4-41d6-bc70-2c475368c755", "estado_higiene": "Regular", "fecha_registro": "2025-12-02T23:55:24.728138"}	\N	\N
03bebcd0-c23a-403c-9486-76683533212b	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-03 08:07:01.591137	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "ababb938-62a8-45a0-8349-995a3e3ad61e", "id_historia": "ddce1c78-a0f9-4e01-942e-554dae5a9c8d", "estado_higiene": "Regular", "fecha_registro": "2025-12-03T08:07:01.591137"}	\N	\N
f37336dd-f7b0-4146-a643-c92f6ba4e590	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-03 08:17:01.100582	examen_higiene_oral	00000000-0000-0000-0000-000000000000	UPDATE	{"id_higiene": "ababb938-62a8-45a0-8349-995a3e3ad61e", "id_historia": "ddce1c78-a0f9-4e01-942e-554dae5a9c8d", "estado_higiene": "Regular", "fecha_registro": "2025-12-03T08:07:01.591137"}	{"id_higiene": "ababb938-62a8-45a0-8349-995a3e3ad61e", "id_historia": "ddce1c78-a0f9-4e01-942e-554dae5a9c8d", "estado_higiene": "Bueno", "fecha_registro": "2025-12-03T08:17:01.100582"}	\N	\N
6fbde6e3-130e-4535-b5a6-22dc2f3ca215	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	2025-12-03 15:49:07.979704	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "446ad1e7-464c-4695-88d6-b077bf7b3259", "id_historia": "67db7e4c-180d-4574-b876-b9aed9b2a756", "estado_higiene": "Regular", "fecha_registro": "2025-12-03T15:49:07.979704"}	\N	\N
30c296bc-c280-46e9-825c-10f1103bb1b4	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-12-03 17:46:50.403903	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "da8fdc3d-a1d4-4858-ba85-5d3a5520a6ec", "id_historia": "7fafb97f-4e5e-4d90-9eab-7ccb58d7a148", "estado_higiene": "Regular", "fecha_registro": "2025-12-03T17:46:50.403903"}	\N	\N
c57b1b9c-f7cd-4c91-b050-31eb14076634	abcaeb82-22a9-41c4-a5d5-1254fa64b257	2025-12-03 17:48:15.934998	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "d662845e-1352-4a6e-ab23-e87d56c6c70c", "id_historia": "47c8afcb-d55e-4b18-ac75-67f4ce028ba7", "estado_higiene": "Regular", "fecha_registro": "2025-12-03T17:48:15.934998"}	\N	\N
45453e06-2468-4d54-bd35-780537ec24d3	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	2025-12-03 17:50:10.014733	examen_higiene_oral	00000000-0000-0000-0000-000000000000	UPDATE	{"id_higiene": "446ad1e7-464c-4695-88d6-b077bf7b3259", "id_historia": "67db7e4c-180d-4574-b876-b9aed9b2a756", "estado_higiene": "Regular", "fecha_registro": "2025-12-03T15:49:07.979704"}	{"id_higiene": "446ad1e7-464c-4695-88d6-b077bf7b3259", "id_historia": "67db7e4c-180d-4574-b876-b9aed9b2a756", "estado_higiene": "Bueno", "fecha_registro": "2025-12-03T17:50:10.014733"}	\N	\N
2998605d-ff99-4b34-ba51-87c90a3486a2	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-04 00:46:34.331892	examen_higiene_oral	00000000-0000-0000-0000-000000000000	UPDATE	{"id_higiene": "ababb938-62a8-45a0-8349-995a3e3ad61e", "id_historia": "ddce1c78-a0f9-4e01-942e-554dae5a9c8d", "estado_higiene": "Bueno", "fecha_registro": "2025-12-03T08:17:01.100582"}	{"id_higiene": "ababb938-62a8-45a0-8349-995a3e3ad61e", "id_historia": "ddce1c78-a0f9-4e01-942e-554dae5a9c8d", "estado_higiene": "Regular", "fecha_registro": "2025-12-04T00:46:34.331892"}	\N	\N
e0360528-46da-45c3-b75a-cbdb0ff0f290	e44b5d20-d75e-4673-bd55-34a753f89853	2025-12-04 00:58:17.798511	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "ffc3e110-e33f-48cf-ad17-e602bd1c5315", "id_historia": "2ff6d047-c7a1-4cf4-963c-c8558b6c572b", "estado_higiene": "Bueno", "fecha_registro": "2025-12-04T00:58:17.798511"}	\N	\N
66500236-948d-43ea-865e-6dacc4aa151f	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-04 06:38:52.096298	examen_higiene_oral	00000000-0000-0000-0000-000000000000	UPDATE	{"id_higiene": "fdac3dfd-f403-44b0-8155-60291804abef", "id_historia": "948b53d6-f8b4-41d6-bc70-2c475368c755", "estado_higiene": "Regular", "fecha_registro": "2025-12-02T23:55:24.728138"}	{"id_higiene": "fdac3dfd-f403-44b0-8155-60291804abef", "id_historia": "948b53d6-f8b4-41d6-bc70-2c475368c755", "estado_higiene": "Deficiente", "fecha_registro": "2025-12-04T06:38:52.096298"}	\N	\N
2e86ba22-8074-430e-a52e-ce03dd231027	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-04 14:35:31.845939	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "15aaf63f-fbc6-4a3e-9129-2990db8fa283", "id_historia": "eb3fa563-e3ee-4304-bcef-0ff390505ff7", "estado_higiene": "Regular", "fecha_registro": "2025-12-04T14:35:31.845939"}	\N	\N
1f18b372-f088-453f-8529-ec62c44923cf	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-14 02:12:07.042503	evolucion	ad0d8ee0-987c-4216-8230-16a3cdb9529c	INSERT	\N	{"fecha": "2025-12-14", "alumno": "Erik", "actividad": "prueba2", "id_historia": "948b53d6-f8b4-41d6-bc70-2c475368c755", "id_evolucion": "ad0d8ee0-987c-4216-8230-16a3cdb9529c", "observaciones": null}	\N	\N
4c17db38-d056-462d-8bd9-be7e548dcb04	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-14 03:39:48.583653	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "6e63dfe4-aacb-4631-a8d3-95b9bad848eb", "id_historia": "b2328e31-85a7-4261-b092-9cf4b0dbeca7", "estado_higiene": "Regular", "fecha_registro": "2025-12-14T03:39:48.583653"}	\N	\N
94f9fd28-7a6f-45e6-8b16-3e6d48bf45ab	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-14 03:40:02.339212	diagnostico	234cc0da-5bd7-4639-ac1d-1e2e99722c04	INSERT	\N	{"tipo": "presuntivo", "fecha": "2025-12-14", "pronostico": null, "descripcion": "HI?", "id_historia": "b2328e31-85a7-4261-b092-9cf4b0dbeca7", "id_diagnostico": "234cc0da-5bd7-4639-ac1d-1e2e99722c04", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
f8ffb44f-42a0-4887-99cb-f3a12e6a2cce	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-14 03:40:23.222446	derivacion_clinicas	00000000-0000-0000-0000-000000000000	INSERT	\N	{"docente": "Ricardo", "destinos": {"periodoncia": true, "integral_nino": true}, "id_historia": "b2328e31-85a7-4261-b092-9cf4b0dbeca7", "id_derivacion": "5f70039b-a2e4-4e35-b775-a6fa4f57e6c2", "observaciones": "prueba", "fecha_derivacion": "2025-12-14", "alumno_diagnostico": "Erik"}	\N	\N
bb77a9af-7572-4335-8e8d-39bfa9e14896	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-14 03:41:24.14011	evolucion	777945e0-4df8-41e3-a841-363a95986569	INSERT	\N	{"fecha": "2025-12-14", "alumno": "e", "actividad": "Si", "id_historia": "b2328e31-85a7-4261-b092-9cf4b0dbeca7", "id_evolucion": "777945e0-4df8-41e3-a841-363a95986569", "observaciones": null}	\N	\N
94667f12-cb5a-4e8a-a687-84b5aa4ceab9	00000000-0000-0000-0000-000000000000	2025-12-14 22:48:36.442279	filiacion	aa22a608-8a27-4468-93f5-3f13be0648d1	INSERT	\N	{"edad": 20, "raza": null, "sexo": "Masculino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "287bb0a7-97dc-46eb-9e45-76d1a6c3dfab", "acompaniante": null, "estado_civil": null, "id_filiacion": "aa22a608-8a27-4468-93f5-3f13be0648d1", "nombre_conyuge": null, "fecha_nacimiento": "2025-12-14", "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
744ae163-ae65-42bd-8149-a5140de8bda4	00000000-0000-0000-0000-000000000000	2026-05-25 16:32:34.44762	filiacion	ac27b4e0-b8e2-4a17-a617-fa48791e0cd2	INSERT	\N	{"edad": 2, "raza": null, "sexo": "Masculino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "dacf98a8-099d-41a7-9b1c-f54121ab9fcd", "acompaniante": null, "estado_civil": null, "id_filiacion": "ac27b4e0-b8e2-4a17-a617-fa48791e0cd2", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
d819562d-27b1-46e8-8688-b5898d90507b	00000000-0000-0000-0000-000000000000	2025-12-15 20:52:55.396255	filiacion	f8718eec-0c37-44b3-9440-f0766722376b	UPDATE	{"edad": 23, "raza": "Mestizo", "sexo": "Femenino", "lugar": "Tacna", "direccion": "Av. Bolognesi 123", "ocupacion": "Estudiante", "id_historia": "67db7e4c-180d-4574-b876-b9aed9b2a756", "acompaniante": "daniel", "estado_civil": "Soltero", "id_filiacion": "f8718eec-0c37-44b3-9440-f0766722376b", "nombre_conyuge": null, "fecha_nacimiento": "1995-05-15", "fecha_elaboracion": "2025-12-02", "lugar_procedencia": null, "contacto_emergencia": "jesus", "telefono_emergencia": "999888777", "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	{"edad": 23, "raza": "Mestizo", "sexo": "Femenino", "lugar": "Tacna", "direccion": "Av. Bolognesi 123", "ocupacion": "Estudiante", "id_historia": "67db7e4c-180d-4574-b876-b9aed9b2a756", "acompaniante": "daniel", "estado_civil": "Soltero", "id_filiacion": "f8718eec-0c37-44b3-9440-f0766722376b", "nombre_conyuge": null, "fecha_nacimiento": "1995-05-15", "fecha_elaboracion": "2025-12-02", "lugar_procedencia": null, "contacto_emergencia": "jesus", "telefono_emergencia": "999888777", "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
aef06f73-f599-49cb-92be-a2bc5b734f91	00000000-0000-0000-0000-000000000000	2025-12-15 20:53:02.281565	filiacion	f8718eec-0c37-44b3-9440-f0766722376b	UPDATE	{"edad": 23, "raza": "Mestizo", "sexo": "Femenino", "lugar": "Tacna", "direccion": "Av. Bolognesi 123", "ocupacion": "Estudiante", "id_historia": "67db7e4c-180d-4574-b876-b9aed9b2a756", "acompaniante": "daniel", "estado_civil": "Soltero", "id_filiacion": "f8718eec-0c37-44b3-9440-f0766722376b", "nombre_conyuge": null, "fecha_nacimiento": "1995-05-15", "fecha_elaboracion": "2025-12-02", "lugar_procedencia": null, "contacto_emergencia": "jesus", "telefono_emergencia": "999888777", "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	{"edad": 23, "raza": "Mestizo", "sexo": "Femenino", "lugar": "Tacna", "direccion": "Av. Bolognesi 123", "ocupacion": "Estudiante", "id_historia": "67db7e4c-180d-4574-b876-b9aed9b2a756", "acompaniante": "daniel", "estado_civil": "Soltero", "id_filiacion": "f8718eec-0c37-44b3-9440-f0766722376b", "nombre_conyuge": null, "fecha_nacimiento": "1995-05-15", "fecha_elaboracion": "2025-12-02", "lugar_procedencia": null, "contacto_emergencia": "jesus", "telefono_emergencia": "999888777", "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
8a36bd49-7b99-4153-9b0e-eaf20327ea4d	00000000-0000-0000-0000-000000000000	2025-12-15 23:51:53.737794	filiacion	927ce708-2072-4c6b-b527-dfcd5fc5730e	INSERT	\N	{"edad": 20, "raza": "mestizo", "sexo": "Masculino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "c2a65d57-c67c-4cf2-ad37-c81fa85319bc", "acompaniante": null, "estado_civil": null, "id_filiacion": "927ce708-2072-4c6b-b527-dfcd5fc5730e", "nombre_conyuge": null, "fecha_nacimiento": "2025-12-15", "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
ef56c939-d1c6-4c46-a2eb-a4a1e4e4e1f4	c6c8d452-dce5-406e-9c29-7d59ff8ec685	2025-12-15 23:52:27.321408	evolucion	202c8b66-ad88-45df-9786-2c6eebe29459	INSERT	\N	{"fecha": "2025-12-15", "alumno": "ERik", "actividad": "prueba", "id_historia": "c2a65d57-c67c-4cf2-ad37-c81fa85319bc", "id_evolucion": "202c8b66-ad88-45df-9786-2c6eebe29459", "observaciones": null}	\N	\N
9536620f-0357-42be-94a8-4269559c12bc	c6c8d452-dce5-406e-9c29-7d59ff8ec685	2025-12-15 23:52:38.014	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "b6db83c6-923f-4b25-bd24-78f873c0f165", "id_historia": "c2a65d57-c67c-4cf2-ad37-c81fa85319bc", "estado_higiene": "Regular", "fecha_registro": "2025-12-15T23:52:38.014"}	\N	\N
4f383190-dd20-4163-90e7-6190ee16755e	00000000-0000-0000-0000-000000000000	2025-12-16 17:10:31.073004	filiacion	9af79ba4-2858-42cd-9a9d-52fc833ab3e8	UPDATE	{"edad": 19, "raza": null, "sexo": "Femenino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "b5ba4cd9-a25a-4345-b5bf-00323aa836f7", "acompaniante": null, "estado_civil": null, "id_filiacion": "9af79ba4-2858-42cd-9a9d-52fc833ab3e8", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	{"edad": 19, "raza": null, "sexo": "Femenino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "b5ba4cd9-a25a-4345-b5bf-00323aa836f7", "acompaniante": null, "estado_civil": null, "id_filiacion": "9af79ba4-2858-42cd-9a9d-52fc833ab3e8", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
f0a3e0d0-9d14-4256-ad5b-1df3e62a08f4	00000000-0000-0000-0000-000000000000	2025-12-16 17:10:32.17776	filiacion	9af79ba4-2858-42cd-9a9d-52fc833ab3e8	UPDATE	{"edad": 19, "raza": null, "sexo": "Femenino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "b5ba4cd9-a25a-4345-b5bf-00323aa836f7", "acompaniante": null, "estado_civil": null, "id_filiacion": "9af79ba4-2858-42cd-9a9d-52fc833ab3e8", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	{"edad": 19, "raza": null, "sexo": "Femenino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "b5ba4cd9-a25a-4345-b5bf-00323aa836f7", "acompaniante": null, "estado_civil": null, "id_filiacion": "9af79ba4-2858-42cd-9a9d-52fc833ab3e8", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
5a77863e-f948-45d4-b3f8-7ecd9854c987	00000000-0000-0000-0000-000000000000	2025-12-16 17:10:32.411242	filiacion	9af79ba4-2858-42cd-9a9d-52fc833ab3e8	UPDATE	{"edad": 19, "raza": null, "sexo": "Femenino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "b5ba4cd9-a25a-4345-b5bf-00323aa836f7", "acompaniante": null, "estado_civil": null, "id_filiacion": "9af79ba4-2858-42cd-9a9d-52fc833ab3e8", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	{"edad": 19, "raza": null, "sexo": "Femenino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "b5ba4cd9-a25a-4345-b5bf-00323aa836f7", "acompaniante": null, "estado_civil": null, "id_filiacion": "9af79ba4-2858-42cd-9a9d-52fc833ab3e8", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
d1451b46-c93f-4ee5-924b-82ce28c71113	00000000-0000-0000-0000-000000000000	2025-12-16 17:10:32.645331	filiacion	9af79ba4-2858-42cd-9a9d-52fc833ab3e8	UPDATE	{"edad": 19, "raza": null, "sexo": "Femenino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "b5ba4cd9-a25a-4345-b5bf-00323aa836f7", "acompaniante": null, "estado_civil": null, "id_filiacion": "9af79ba4-2858-42cd-9a9d-52fc833ab3e8", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	{"edad": 19, "raza": null, "sexo": "Femenino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "b5ba4cd9-a25a-4345-b5bf-00323aa836f7", "acompaniante": null, "estado_civil": null, "id_filiacion": "9af79ba4-2858-42cd-9a9d-52fc833ab3e8", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
1156d9b1-4e93-4c08-9974-db72f680235e	00000000-0000-0000-0000-000000000000	2025-12-16 17:10:32.89532	filiacion	9af79ba4-2858-42cd-9a9d-52fc833ab3e8	UPDATE	{"edad": 19, "raza": null, "sexo": "Femenino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "b5ba4cd9-a25a-4345-b5bf-00323aa836f7", "acompaniante": null, "estado_civil": null, "id_filiacion": "9af79ba4-2858-42cd-9a9d-52fc833ab3e8", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	{"edad": 19, "raza": null, "sexo": "Femenino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "b5ba4cd9-a25a-4345-b5bf-00323aa836f7", "acompaniante": null, "estado_civil": null, "id_filiacion": "9af79ba4-2858-42cd-9a9d-52fc833ab3e8", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
b2f740aa-b569-472e-8c21-a19ae1d3221e	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	2025-12-16 18:09:58.413331	evolucion	a93f6ded-8497-4486-8d6d-720fc62c30c0	INSERT	\N	{"fecha": "2025-12-16", "alumno": "Silvia", "actividad": "Limpieza", "id_historia": "b5ba4cd9-a25a-4345-b5bf-00323aa836f7", "id_evolucion": "a93f6ded-8497-4486-8d6d-720fc62c30c0", "observaciones": null}	\N	\N
d0c828cc-c6da-4912-90e0-257da50fd918	00000000-0000-0000-0000-000000000000	2026-04-23 03:46:18.040149	filiacion	65f22ba5-bc3d-49ef-a5a3-4edb18c95317	INSERT	\N	{"edad": 20, "raza": null, "sexo": "Masculino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "19125c29-5984-4d5b-9bc8-6ddf3c3deb53", "acompaniante": null, "estado_civil": null, "id_filiacion": "65f22ba5-bc3d-49ef-a5a3-4edb18c95317", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
2cd32dc5-3278-4246-a8fc-735c57963d7e	00000000-0000-0000-0000-000000000000	2026-04-23 03:52:52.946436	enfermedad_actual	2dc1f18a-11aa-43e7-a2f0-0734e2cb9b34	INSERT	\N	{"curso": "", "relato": "", "id_historia": "84974bdc-0d6f-478a-a4df-1310e1a71ea0", "forma_inicio": "asdasd", "tratamiento_prev": "", "sintoma_principal": "dasda", "tiempo_enfermedad": "asdasd", "id_enfermedad_actual": "2dc1f18a-11aa-43e7-a2f0-0734e2cb9b34"}	\N	\N
53ec2023-6a88-44eb-ba83-9ab9d6c418dc	00000000-0000-0000-0000-000000000000	2026-05-25 06:10:03.108317	filiacion	61e234c4-2f2a-4f7f-a7f7-94a2bcecc3c2	INSERT	\N	{"edad": 23, "raza": null, "sexo": "Masculino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "4a766208-4cc4-481f-94f6-2f2adb2cc655", "acompaniante": null, "estado_civil": null, "id_filiacion": "61e234c4-2f2a-4f7f-a7f7-94a2bcecc3c2", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
1c066cfc-aaf9-452d-bc58-271b360f04fb	00000000-0000-0000-0000-000000000000	2026-05-25 16:30:21.359287	antecedente_medico	00000000-0000-0000-0000-000000000000	INSERT	\N	{"enf_tbc": false, "alergias": null, "enf_asma": false, "enf_anemia": false, "enf_ulcera": false, "enf_corazon": false, "id_historia": "4a766208-4cc4-481f-94f6-2f2adb2cc655", "enf_diabetes": false, "enf_epilepsia": false, "enf_hepatitis": false, "odontologicos": null, "salud_general": "Regular", "enf_coagulacion": false, "enf_neurologica": false, "bajo_tratamiento": true, "enf_hipertension": false, "tipo_tratamiento": "asda", "hospitalizaciones": null, "id_ant_patologico": "59209749-366a-440f-9ef2-d1c3ee647e09", "tipo_traumatismos": null, "tuvo_traumatismos": false, "enf_alergia_cronica": false, "enf_fiebre_reumatica": false, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
7d78d6d8-8765-456d-b902-6460492a59bc	00000000-0000-0000-0000-000000000000	2026-05-25 16:30:21.351975	antecedente_familiar	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_ant_fam": "a555ee1d-8ba1-47ee-8940-090ecb5c56c8", "descripcion": null, "id_historia": "4a766208-4cc4-481f-94f6-2f2adb2cc655"}	\N	\N
9393cb85-9dd9-4cb3-abf8-904b0028bc30	00000000-0000-0000-0000-000000000000	2026-05-25 16:30:21.353019	antecedente_personal	00000000-0000-0000-0000-000000000000	INSERT	\N	{"mac": "false", "fuma": false, "otros": "asdasd", "rechina": false, "toma_te": false, "vacunas": null, "chupa_dedo": false, "hepatitis_b": false, "id_historia": "4a766208-4cc4-481f-94f6-2f2adb2cc655", "psicosocial": "asdasd", "seda_dental": false, "cepillo_duro": false, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": false, "otros_habitos": null, "cepillo_blando": false, "dolor_muscular": false, "enjuague_bucal": false, "id_antecedente": "f091a8c3-9143-4825-8cfe-adfec3f330b7", "muerde_objetos": false, "aprieta_dientes": false, "cepillo_mediano": false, "cigarrillos_dia": null, "esta_embarazada": false, "momento_aprieta": null, "cepillo_electrico": false, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": false, "otros_elementos_higiene": null}	\N	\N
57445af7-36eb-4916-ad56-f2271732d126	00000000-0000-0000-0000-000000000000	2026-05-25 16:30:21.365884	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_historia": "4a766208-4cc4-481f-94f6-2f2adb2cc655", "firma_nombre": null, "motivo_dolor": false, "actitud_panico": false, "motivo_control": false, "motivo_limpieza": false, "actitud_aprensivo": false, "actitud_tranquilo": false, "desagrado_atencion": null, "id_ant_cumplimiento": "f3c1b8c1-c985-4f8d-8b94-a21e16247453", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
574f2aaf-ea48-44bd-95ee-c99b88c712ea	00000000-0000-0000-0000-000000000000	2026-05-25 16:31:43.326283	motivo_consulta	00000000-0000-0000-0000-000000000000	UPDATE	{"motivo": "Idkdhf", "id_motivo": "11880342-1b78-459f-acfe-53f0d19ee052", "id_historia": "4a766208-4cc4-481f-94f6-2f2adb2cc655", "fecha_registro": "2025-12-03T17:59:58.494722"}	{"motivo": "Idkdhfasdasd", "id_motivo": "11880342-1b78-459f-acfe-53f0d19ee052", "id_historia": "4a766208-4cc4-481f-94f6-2f2adb2cc655", "fecha_registro": "2026-05-25T16:31:43.326283"}	\N	\N
a8a0a5b6-3469-40e2-8723-b01c324c3f08	00000000-0000-0000-0000-000000000000	2026-05-25 16:36:00.147561	motivo_consulta	00000000-0000-0000-0000-000000000000	UPDATE	{"motivo": "Ksjdjfj", "id_motivo": "7e340bdb-0786-4536-8c3e-1f29fdafd188", "id_historia": "7fafb97f-4e5e-4d90-9eab-7ccb58d7a148", "fecha_registro": "2025-12-03T17:57:20.690989"}	{"motivo": "hlola", "id_motivo": "7e340bdb-0786-4536-8c3e-1f29fdafd188", "id_historia": "7fafb97f-4e5e-4d90-9eab-7ccb58d7a148", "fecha_registro": "2026-05-25T16:36:00.147561"}	\N	\N
6bea6938-ac32-4036-abb6-e175a8b0f173	00000000-0000-0000-0000-000000000000	2026-05-25 16:38:12.354237	motivo_consulta	00000000-0000-0000-0000-000000000000	UPDATE	{"motivo": "Dolor de cabeza y mareos casi siempre", "id_motivo": "0a1e119d-83e7-484e-af09-d1733393d299", "id_historia": "bea73607-a9cc-462f-b14f-bedb4d503e6d", "fecha_registro": "2025-12-02T14:39:21.917425"}	{"motivo": "Dolor de cabeza y mareos casi siempre", "id_motivo": "0a1e119d-83e7-484e-af09-d1733393d299", "id_historia": "bea73607-a9cc-462f-b14f-bedb4d503e6d", "fecha_registro": "2026-05-25T16:38:12.354237"}	\N	\N
3feb1d50-fddc-4f6c-b233-6e47335a2145	00000000-0000-0000-0000-000000000000	2026-05-25 16:38:55.34933	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": "Ninguno", "fuma": false, "otros": "Ninguno", "rechina": false, "toma_te": true, "vacunas": "Completo", "chupa_dedo": false, "hepatitis_b": false, "id_historia": "e1616800-f790-4058-8c40-8c62f1b6afcd", "psicosocial": "Sin problemas", "seda_dental": true, "cepillo_duro": false, "tazas_te_dia": 2, "toma_alcohol": false, "muerde_labios": false, "otros_habitos": "Limparme lo dientes con laa lengua", "cepillo_blando": false, "dolor_muscular": false, "enjuague_bucal": true, "id_antecedente": "a03d3a14-d1c4-49ac-b4d3-277ae15ef16f", "muerde_objetos": false, "aprieta_dientes": false, "cepillo_mediano": true, "cigarrillos_dia": 0, "esta_embarazada": false, "momento_aprieta": "", "cepillo_electrico": false, "frecuencia_alcohol": "", "id_grupo_sanguineo": "55bb9f0f-8315-430c-a317-a180f8d01cdc", "tipo_interproximal": "", "frecuencia_cepillado": 3, "cepillo_interproximal": false, "otros_elementos_higiene": "Hilo dental"}	{"mac": "Ninguno", "fuma": false, "otros": "Ninguno", "rechina": false, "toma_te": true, "vacunas": "Completo", "chupa_dedo": false, "hepatitis_b": false, "id_historia": "e1616800-f790-4058-8c40-8c62f1b6afcd", "psicosocial": "Sin problemas", "seda_dental": true, "cepillo_duro": false, "tazas_te_dia": 2, "toma_alcohol": false, "muerde_labios": false, "otros_habitos": "Limparme lo dientes con laa lengua", "cepillo_blando": false, "dolor_muscular": false, "enjuague_bucal": true, "id_antecedente": "a03d3a14-d1c4-49ac-b4d3-277ae15ef16f", "muerde_objetos": false, "aprieta_dientes": false, "cepillo_mediano": true, "cigarrillos_dia": 0, "esta_embarazada": false, "momento_aprieta": "", "cepillo_electrico": false, "frecuencia_alcohol": "", "id_grupo_sanguineo": "55bb9f0f-8315-430c-a317-a180f8d01cdc", "tipo_interproximal": "", "frecuencia_cepillado": 3, "cepillo_interproximal": false, "otros_elementos_higiene": "Hilo dental"}	\N	\N
693e8fde-eaa0-41b5-a07b-534bccf81062	00000000-0000-0000-0000-000000000000	2026-05-26 17:13:11.331613	filiacion	e8414278-1824-41a5-814d-7b550d8dc0c9	INSERT	\N	{"edad": 18, "raza": null, "sexo": "Masculino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "acompaniante": null, "estado_civil": null, "id_filiacion": "e8414278-1824-41a5-814d-7b550d8dc0c9", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
570188c5-310a-423a-bcfd-8a3f6df7f729	00000000-0000-0000-0000-000000000000	2026-05-26 17:13:57.168931	antecedente_personal	00000000-0000-0000-0000-000000000000	INSERT	\N	{"mac": "false", "fuma": false, "otros": null, "rechina": false, "toma_te": false, "vacunas": null, "chupa_dedo": false, "hepatitis_b": true, "id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "psicosocial": "asdasd", "seda_dental": false, "cepillo_duro": false, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": false, "otros_habitos": null, "cepillo_blando": false, "dolor_muscular": false, "enjuague_bucal": false, "id_antecedente": "f0edb545-874b-4c4b-9e42-9c23591f10a9", "muerde_objetos": false, "aprieta_dientes": false, "cepillo_mediano": false, "cigarrillos_dia": null, "esta_embarazada": false, "momento_aprieta": null, "cepillo_electrico": false, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": false, "otros_elementos_higiene": null}	\N	\N
8046381c-5392-4c19-b26c-a81be610749c	00000000-0000-0000-0000-000000000000	2026-05-26 17:13:57.169525	antecedente_familiar	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_ant_fam": "cfd1a090-d47e-4834-b275-25d7d490ab93", "descripcion": null, "id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5"}	\N	\N
fd262b4a-4584-47ff-bdd7-449cc810d468	00000000-0000-0000-0000-000000000000	2026-05-26 17:13:57.169312	antecedente_medico	00000000-0000-0000-0000-000000000000	INSERT	\N	{"enf_tbc": false, "alergias": null, "enf_asma": false, "enf_anemia": false, "enf_ulcera": false, "enf_corazon": true, "id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "enf_diabetes": false, "enf_epilepsia": false, "enf_hepatitis": false, "odontologicos": null, "salud_general": "Regular", "enf_coagulacion": false, "enf_neurologica": false, "bajo_tratamiento": false, "enf_hipertension": false, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "a0c3522e-6028-454e-8e77-f11599dc03fa", "tipo_traumatismos": null, "tuvo_traumatismos": false, "enf_alergia_cronica": true, "enf_fiebre_reumatica": false, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
fe621e64-3b20-44a3-8dcd-5efaba8445ff	00000000-0000-0000-0000-000000000000	2026-05-26 17:13:57.177182	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "firma_nombre": null, "motivo_dolor": false, "actitud_panico": false, "motivo_control": false, "motivo_limpieza": false, "actitud_aprensivo": false, "actitud_tranquilo": false, "desagrado_atencion": null, "id_ant_cumplimiento": "5c9d9b92-a8fd-4952-9b38-ae4ae20df624", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
7e21bde6-2ed4-4e55-aee9-214c378bbcd6	00000000-0000-0000-0000-000000000000	2026-05-26 17:15:34.122734	enfermedad_actual	ba4b5820-a92d-46c4-9c5f-30fabe7e893b	UPDATE	{"curso": "Progresivo", "relato": "Paciente refiere fiebre alta, malestar general y tos seca.", "id_historia": "bea73607-a9cc-462f-b14f-bedb4d503e6d", "forma_inicio": "Brusco", "tratamiento_prev": "Paracetamol y jarabe", "sintoma_principal": "Fiebre y tos", "tiempo_enfermedad": "4 días", "id_enfermedad_actual": "ba4b5820-a92d-46c4-9c5f-30fabe7e893b"}	{"curso": "Progresivo", "relato": "Paciente refiere fiebre alta, malestar general y tos seca.", "id_historia": "bea73607-a9cc-462f-b14f-bedb4d503e6d", "forma_inicio": "Brusco", "tratamiento_prev": "Paracetamol y jarabe", "sintoma_principal": "Fiebre y tos", "tiempo_enfermedad": "4 días", "id_enfermedad_actual": "ba4b5820-a92d-46c4-9c5f-30fabe7e893b"}	\N	\N
cf719bb2-9f3b-47a4-b848-ddd12c4bc2ac	00000000-0000-0000-0000-000000000000	2026-05-26 17:30:26.901242	examen_general	00000000-0000-0000-0000-000000000000	INSERT	\N	{"peso": null, "pulso": null, "talla": null, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": null, "id_examen": "1724530b-316a-4c56-bc5b-24c331ffce40", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
e042209f-4d27-4f6d-acd7-4426350c3361	00000000-0000-0000-0000-000000000000	2026-05-26 18:36:29.032095	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_historia": "eff908c3-ad3c-4807-8706-61988d104eb6", "firma_nombre": null, "motivo_dolor": false, "actitud_panico": false, "motivo_control": false, "motivo_limpieza": false, "actitud_aprensivo": false, "actitud_tranquilo": false, "desagrado_atencion": null, "id_ant_cumplimiento": "35f40796-47b3-42c8-bbc2-9f1a83bb9b17", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
f80c6ea9-8d19-4c1b-b57f-a2c4b7046a80	00000000-0000-0000-0000-000000000000	2026-05-26 17:30:39.280092	examen_regional	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "id_regional": "a337d3e4-f46e-4912-9f9d-ca776502b7d2", "nariz_forma": null, "craneo_forma": null, "cuello_otros": null, "craneo_tamano": null, "atm_aper_dolor": null, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": null, "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": null, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": null, "atm_observaciones": null, "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": true, "oidos_secreciones": null, "ojos_escleroticas": "Pigmentadas", "atm_musculos_dolor": null, "cabeza_movimientos": null, "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": null, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": null, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	\N	\N
f7c0fc16-5f34-4e4b-9ca9-502289214f3b	00000000-0000-0000-0000-000000000000	2026-05-26 17:44:51.166092	examen_regional	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "id_regional": "a337d3e4-f46e-4912-9f9d-ca776502b7d2", "nariz_forma": null, "craneo_forma": null, "cuello_otros": null, "craneo_tamano": null, "atm_aper_dolor": null, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": null, "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": null, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": null, "atm_observaciones": null, "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": true, "oidos_secreciones": null, "ojos_escleroticas": "Pigmentadas", "atm_musculos_dolor": null, "cabeza_movimientos": null, "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": null, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": null, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	{"id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "id_regional": "a337d3e4-f46e-4912-9f9d-ca776502b7d2", "nariz_forma": null, "craneo_forma": null, "cuello_otros": null, "craneo_tamano": null, "atm_aper_dolor": null, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": null, "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": true, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": null, "atm_observaciones": null, "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": true, "oidos_secreciones": null, "ojos_escleroticas": "Pigmentadas", "atm_musculos_dolor": null, "cabeza_movimientos": "Temblor", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": null, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": null, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	\N	\N
969d2697-910f-4f06-8222-31f57c29bd18	00000000-0000-0000-0000-000000000000	2026-05-26 17:45:00.933644	examen_general	00000000-0000-0000-0000-000000000000	UPDATE	{"peso": null, "pulso": null, "talla": null, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": null, "id_examen": "1724530b-316a-4c56-bc5b-24c331ffce40", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	{"peso": null, "pulso": null, "talla": null, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": null, "id_examen": "1724530b-316a-4c56-bc5b-24c331ffce40", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": null, "estado_nutritivo": "No adecuado", "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
83a6f487-b12a-495c-97a6-3e7be828c21b	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-26 17:45:08.244625	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "35500f62-e84b-48b0-888c-ec76e7f6fd27", "id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-26T17:45:08.244625"}	\N	\N
a6fcf833-3dae-424d-ad77-372b12095ffc	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-26 17:45:15.894132	examen_higiene_oral	00000000-0000-0000-0000-000000000000	UPDATE	{"id_higiene": "35500f62-e84b-48b0-888c-ec76e7f6fd27", "id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-26T17:45:08.244625"}	{"id_higiene": "35500f62-e84b-48b0-888c-ec76e7f6fd27", "id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "estado_higiene": "Regular", "fecha_registro": "2026-05-26T17:45:15.894132"}	\N	\N
95634bb8-a5ed-496f-bd6e-cb43da62985a	00000000-0000-0000-0000-000000000000	2026-05-26 17:45:34.997609	examen_clinico_boca	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_boca": "2cd912ae-f8e4-4492-9cb8-0097b25a5ed7", "id_historia": "4cc2fe5c-337e-4439-b349-77e0127542f5", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": null, "oclusion_molar_izq": null, "labios_con_lesiones": "<zx<zx", "labios_sin_lesiones": null, "lat_der_guia_canina": null, "lat_izq_guia_canina": null, "lengua_con_lesiones": null, "lengua_sin_lesiones": null, "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": null, "paladar_sin_lesiones": null, "lat_der_funcion_grupo": null, "lat_izq_funcion_grupo": null, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": null, "piso_boca_sin_lesiones": null, "vestibulo_con_lesiones": null, "vestibulo_sin_lesiones": null, "orofaringe_con_lesiones": null, "orofaringe_sin_lesiones": null, "lat_der_contacto_balance": null, "lat_izq_contacto_balance": null, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": null, "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": null, "carrillos_retromolar_sin_lesiones": null}	\N	\N
b347c768-3180-4480-b135-197413948fb4	00000000-0000-0000-0000-000000000000	2026-05-26 18:24:55.71981	filiacion	395596ce-4ba2-4206-8984-3526ab62d944	INSERT	\N	{"edad": 40, "raza": null, "sexo": "Femenino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "eff908c3-ad3c-4807-8706-61988d104eb6", "acompaniante": null, "estado_civil": null, "id_filiacion": "395596ce-4ba2-4206-8984-3526ab62d944", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
ff5ce0f7-df53-419d-9abb-a87dccb5a6c6	00000000-0000-0000-0000-000000000000	2026-05-26 18:36:29.032742	antecedente_familiar	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_ant_fam": "6f0920b0-dd1a-4b58-b7b0-561b6ebef46e", "descripcion": null, "id_historia": "eff908c3-ad3c-4807-8706-61988d104eb6"}	\N	\N
6fb0700d-4b9c-4d1e-bb6f-602d426b94d1	00000000-0000-0000-0000-000000000000	2026-05-26 18:36:29.044573	antecedente_personal	00000000-0000-0000-0000-000000000000	INSERT	\N	{"mac": "false", "fuma": false, "otros": null, "rechina": false, "toma_te": false, "vacunas": null, "chupa_dedo": false, "hepatitis_b": false, "id_historia": "eff908c3-ad3c-4807-8706-61988d104eb6", "psicosocial": "asdasd", "seda_dental": false, "cepillo_duro": false, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": true, "otros_habitos": null, "cepillo_blando": false, "dolor_muscular": false, "enjuague_bucal": false, "id_antecedente": "385f289e-1ffa-42c2-8739-2b48890701ee", "muerde_objetos": false, "aprieta_dientes": false, "cepillo_mediano": false, "cigarrillos_dia": null, "esta_embarazada": false, "momento_aprieta": null, "cepillo_electrico": false, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": false, "otros_elementos_higiene": null}	\N	\N
c8976b9d-5478-4e6f-852a-339ecf58a5c2	00000000-0000-0000-0000-000000000000	2026-05-26 18:36:29.036779	antecedente_medico	00000000-0000-0000-0000-000000000000	INSERT	\N	{"enf_tbc": false, "alergias": null, "enf_asma": false, "enf_anemia": false, "enf_ulcera": false, "enf_corazon": false, "id_historia": "eff908c3-ad3c-4807-8706-61988d104eb6", "enf_diabetes": false, "enf_epilepsia": false, "enf_hepatitis": false, "odontologicos": null, "salud_general": "Regular", "enf_coagulacion": false, "enf_neurologica": false, "bajo_tratamiento": false, "enf_hipertension": false, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "81a7f3c8-e6e1-4c21-a982-51094efff672", "tipo_traumatismos": null, "tuvo_traumatismos": false, "enf_alergia_cronica": false, "enf_fiebre_reumatica": false, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
7658ce8f-bce7-4217-b66c-997cfc047d9c	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:45.682119	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
2a3d5127-24f9-46a3-b38d-50aa05108017	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:48.750275	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
e381ad61-b64d-42bf-8fbe-9502aa11c03a	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:48.875883	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
b45abf4e-b697-4a4e-b9d1-0d264409b255	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:48.997797	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
15a0a26f-ffe0-46c2-8575-fea55438e44f	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:49.525709	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
045f5283-2a29-44c1-b43d-7db47ef33188	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:49.576746	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
bf475237-c980-4b5d-87cd-7e6ebc7e4a36	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:49.656167	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
d89537b0-e2f7-42bf-b107-61e3d919af78	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:02:00.932414	derivacion_clinicas	00000000-0000-0000-0000-000000000000	UPDATE	{"docente": "", "destinos": {"periodoncia": true}, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_derivacion": "38e927d0-cd84-4dc8-82e9-dfba85c27213", "observaciones": "", "fecha_derivacion": "2026-05-27", "alumno_diagnostico": ""}	{"docente": "", "destinos": {"periodoncia": true, "estomatologia": true}, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_derivacion": "38e927d0-cd84-4dc8-82e9-dfba85c27213", "observaciones": "", "fecha_derivacion": "2026-05-27", "alumno_diagnostico": ""}	\N	\N
63cefca0-af5c-4278-9556-e6dbbbf466e5	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:49.715301	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
9e777803-9b47-44b1-9c18-f4735b3dc73d	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:49.792496	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
4c47e306-49eb-440b-aef4-72671f6629d4	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:49.868437	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
913ebc47-dc4d-4f01-a469-9da2e75bcdb4	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:56.610684	antecedente_personal	00000000-0000-0000-0000-000000000000	INSERT	\N	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
1c35cdd4-b1b5-4b21-b73b-1a066a89d5b2	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:59.293674	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
5e16baec-f269-4864-94ad-8fc2d248da5a	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:59.431899	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
3304bcd7-1b58-4aa9-8d94-170a66e50e23	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:03:38.246753	diagnostico	4ba20335-a443-424f-be44-accaf7f7adf7	INSERT	\N	{"tipo": "definitivo_clinicas", "fecha": "2026-05-06", "pronostico": null, "descripcion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "4ba20335-a443-424f-be44-accaf7f7adf7", "alumno_tratante": "asda", "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
6073bb82-5228-45f2-b869-25e2ad7e4356	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:59.571265	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
e7c352a0-637b-400c-bdb1-4e955af269e8	00000000-0000-0000-0000-000000000000	2026-05-26 22:54:59.69976	antecedente_medico	00000000-0000-0000-0000-000000000000	INSERT	\N	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
c53b1e0d-9324-4489-80c8-e188e515de8c	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:00.535149	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
2ecd8181-4d64-44eb-9c35-808835700d96	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:00.660004	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
af28f365-8f0a-4003-83b3-e6d2cbdfebd0	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:00.795584	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
3a902ef4-7fff-4b6b-912b-108b0ee62db4	00000000-0000-0000-0000-000000000000	2026-05-27 17:06:04.458958	filiacion	6abc8cb6-c013-438e-a556-4bed68436963	INSERT	\N	{"edad": 43, "raza": null, "sexo": "Masculino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "911c4e3e-96ba-4582-8758-7317d1c50d7c", "acompaniante": null, "estado_civil": null, "id_filiacion": "6abc8cb6-c013-438e-a556-4bed68436963", "nombre_conyuge": null, "fecha_nacimiento": null, "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": null, "tiempo_residencia_tacna": null}	\N	\N
62bfc62a-199c-410b-b3b6-3d4a87a6f339	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:00.840024	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
ea88fdd7-5387-46d9-8ee6-4c315e320dd3	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:01.00611	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
af076949-248e-449d-a5e9-f2cda327ef44	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:01.157883	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
08dfec1e-5669-4357-bbd2-07e96acca3b7	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:02.225018	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
596aa2c4-824b-4ecd-b6dd-db2bbe771537	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:02.352719	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
87152f98-6bdc-4e99-833d-a5a6d8bb89d2	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:02.473301	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
a4fc6366-145b-4ae6-9b7e-9485674d7bfb	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:04.098254	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
7499b550-9028-4785-b564-46704a85fa96	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:04.21845	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
eae6c4db-0fc6-40aa-8617-a1d29003d838	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:04.337738	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
0366d7e1-1fd5-47fd-adfb-db2b4440ca14	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:04.445277	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
5b694646-8b82-44d4-ba77-6eb6914eb51d	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:38.850708	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
78d14145-c2d2-4bea-bf0f-a9411f6628cb	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:04.565183	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
10ba9ea2-6fee-43ac-a096-c2688cafa9f9	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:04.692709	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
ffc26d30-0082-4f9c-b6b8-67814cfc9495	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:38.611023	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
b9f66a2c-60bc-49b3-9246-0251d7215c69	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:38.611528	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
671b0fc9-bf26-47df-932d-0b386b8cf0c0	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:38.730132	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
f2a32444-602c-41e3-a4bd-da0e0ea02a9d	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:38.750006	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
171c6c86-020c-4d06-8b42-ce5e495e50bb	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:38.850197	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
64ae9d4f-d32c-48ff-ad12-c4750d0b57a8	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:38.876004	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
1e5ca3ec-882f-4a67-9395-518bcff5ce50	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:38.968207	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
2e96a9e6-6ab3-46f0-beaa-0c52d8e380f5	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:39.087688	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
a7168fd3-09e3-4121-afda-b508dac265da	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:46.855641	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
b36a7e35-6025-4f9b-bb1c-6727e1bc0019	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:46.988987	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
152150b4-f381-415d-9b95-292960949a4a	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:47.109092	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
c46eee67-ee72-4e45-98a8-703c29bdff06	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:47.621986	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
b29e1608-400b-4c6f-9ef0-a2dedf71749f	00000000-0000-0000-0000-000000000000	2026-05-30 16:06:07.859941	diagnostico	9efb645d-a6ca-4750-aff2-2ebc96053aa7	INSERT	\N	{"tipo": "presuntivo", "fecha": "2026-05-30", "pronostico": null, "descripcion": "Ga", "id_historia": "4a766208-4cc4-481f-94f6-2f2adb2cc655", "id_diagnostico": "9efb645d-a6ca-4750-aff2-2ebc96053aa7", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
c0471cbb-518d-461f-bbd8-d8cadbe4a148	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:47.622181	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
f7155718-fe3e-45be-b6b9-cd1f419d929c	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:47.74319	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
43b5ad59-2b68-42be-8520-ec73e5efab24	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:47.863731	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
537889b4-8e0b-45c4-b89d-4453bbf4ae7d	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:47.74261	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
65f42be7-84bf-4a52-b8bf-6b8bf9efac45	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:47.863869	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
cc903cf9-c013-4a82-99fa-ef297b62b9eb	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:48.030639	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
cca50f54-1565-4e5d-9680-4d87ad0a38f2	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:48.156402	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
1aa4f686-581c-44ea-81c2-ba195a346e47	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:51.170812	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
cda8c0d0-9e21-462f-9071-871f95c86999	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:48.287183	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
93a3fabc-f3ef-4d87-ba11-7e1b50a555c8	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:50.933427	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
49a73635-f973-4b1d-a6ba-034b683ec02c	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:50.940855	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
16b977f0-c566-4f7a-b5cb-cb74ace01538	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:51.053309	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
d8c53579-db06-4156-9cb6-9c8dfd79aefc	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:51.067801	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
83df66a7-4c12-4b3c-bb77-7ce579476fed	00000000-0000-0000-0000-000000000000	2026-05-27 00:34:45.951001	examen_general	00000000-0000-0000-0000-000000000000	INSERT	\N	{"peso": null, "pulso": null, "talla": null, "facies": null, "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
03bfea4e-501c-4168-842e-15bdce082170	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:51.186792	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
5e198723-f3cd-490f-ae6b-de60d4a84da3	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:51.73515	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
34f86d7c-63b5-4f17-bb9d-6d656300af8f	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:51.857702	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
8a2f766a-eb5a-44f2-84eb-963ba4ebb8d6	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:51.981679	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
87f3d21e-7bf3-4461-85eb-b10aface9b74	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:56.333855	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
5f14b7cd-f590-4c6b-a1ae-b8ea39adbb42	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 00:56:25.155521	examen_higiene_oral	00000000-0000-0000-0000-000000000000	UPDATE	{"id_higiene": "bb145a35-3129-4352-bc2b-25a55e0b7b75", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-27T00:56:20.784583"}	{"id_higiene": "bb145a35-3129-4352-bc2b-25a55e0b7b75", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "estado_higiene": "Regular", "fecha_registro": "2026-05-27T00:56:25.155521"}	\N	\N
aaf420b0-f232-43f9-9de3-6aa05bca6a47	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:56.519304	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
db9157fb-a62e-4571-a914-9237e82638cc	00000000-0000-0000-0000-000000000000	2026-05-26 22:55:56.718283	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
61bc9a5e-4e76-4f56-ae7d-6211b922b41e	00000000-0000-0000-0000-000000000000	2026-05-26 22:56:00.990161	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
6be8ea24-20d4-40cc-a637-2f65b1d61bb1	00000000-0000-0000-0000-000000000000	2026-05-26 22:56:01.123479	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
8cd044a0-d05a-44ab-9819-3b78d002ca35	00000000-0000-0000-0000-000000000000	2026-05-26 22:56:01.329564	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
13865b41-5564-4504-9fbe-45c976e21756	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:01:56.484544	derivacion_clinicas	00000000-0000-0000-0000-000000000000	INSERT	\N	{"docente": "", "destinos": {"periodoncia": true}, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_derivacion": "38e927d0-cd84-4dc8-82e9-dfba85c27213", "observaciones": "", "fecha_derivacion": "2026-05-27", "alumno_diagnostico": ""}	\N	\N
c83d124d-79f4-448b-aec2-74a34adc8091	00000000-0000-0000-0000-000000000000	2026-05-27 00:34:48.077357	examen_general	00000000-0000-0000-0000-000000000000	UPDATE	{"peso": null, "pulso": null, "talla": null, "facies": null, "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	{"peso": null, "pulso": null, "talla": null, "facies": null, "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
59b820a4-d931-4a9a-8b4b-8616262fecc8	00000000-0000-0000-0000-000000000000	2026-05-27 00:34:54.848943	examen_general	00000000-0000-0000-0000-000000000000	UPDATE	{"peso": null, "pulso": null, "talla": null, "facies": null, "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	{"peso": null, "pulso": null, "talla": null, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
24c2383e-4c53-4b07-b5fd-0c3c17ed4ef6	00000000-0000-0000-0000-000000000000	2026-05-27 00:35:03.279003	examen_general	00000000-0000-0000-0000-000000000000	UPDATE	{"peso": null, "pulso": null, "talla": null, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	{"peso": null, "pulso": null, "talla": null, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
056da6b0-f9e3-4aac-8ed2-a7b21224f857	00000000-0000-0000-0000-000000000000	2026-05-27 00:36:45.658068	examen_regional	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": null, "craneo_forma": null, "cuello_otros": null, "craneo_tamano": "Microcéfalo", "atm_aper_dolor": null, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": true, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": null, "atm_observaciones": null, "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": null, "atm_musculos_dolor": null, "cabeza_movimientos": "Tic", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": null, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": null, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	\N	\N
bba96665-861c-4aec-b0d7-a37c4e87adc9	00000000-0000-0000-0000-000000000000	2026-05-27 00:54:50.19571	examen_clinico_boca	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": null, "oclusion_molar_izq": "Clase II", "labios_con_lesiones": null, "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": null, "lengua_con_lesiones": null, "lengua_sin_lesiones": null, "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": null, "paladar_sin_lesiones": null, "lat_der_funcion_grupo": null, "lat_izq_funcion_grupo": null, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": null, "piso_boca_sin_lesiones": null, "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": null, "orofaringe_con_lesiones": null, "orofaringe_sin_lesiones": null, "lat_der_contacto_balance": null, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": null, "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": null, "carrillos_retromolar_sin_lesiones": null}	\N	\N
026ca5e4-3c3b-4bb7-961e-e0171e416f28	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 00:56:16.026722	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "bb145a35-3129-4352-bc2b-25a55e0b7b75", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-27T00:56:16.026722"}	\N	\N
4289edca-5169-4e06-a103-0b3467c4fd7e	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 00:56:20.784583	examen_higiene_oral	00000000-0000-0000-0000-000000000000	UPDATE	{"id_higiene": "bb145a35-3129-4352-bc2b-25a55e0b7b75", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-27T00:56:16.026722"}	{"id_higiene": "bb145a35-3129-4352-bc2b-25a55e0b7b75", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-27T00:56:20.784583"}	\N	\N
e9cc25f1-d60f-4983-80cd-a50862e10fa9	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:03:46.728123	diagnostico	4ba20335-a443-424f-be44-accaf7f7adf7	UPDATE	{"tipo": "definitivo_clinicas", "fecha": "2026-05-06", "pronostico": null, "descripcion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "4ba20335-a443-424f-be44-accaf7f7adf7", "alumno_tratante": "asda", "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "definitivo_clinicas", "fecha": "2026-05-14", "pronostico": null, "descripcion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "4ba20335-a443-424f-be44-accaf7f7adf7", "alumno_tratante": "asda", "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
6e89e685-fcf4-4875-9af7-f5a0307a16ce	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:04:19.302863	diagnostico	4ba20335-a443-424f-be44-accaf7f7adf7	UPDATE	{"tipo": "definitivo_clinicas", "fecha": "2026-05-14", "pronostico": null, "descripcion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "4ba20335-a443-424f-be44-accaf7f7adf7", "alumno_tratante": "asda", "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "definitivo_clinicas", "fecha": "2026-05-20", "pronostico": null, "descripcion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "4ba20335-a443-424f-be44-accaf7f7adf7", "alumno_tratante": "asda", "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
26a25122-f0d0-4811-9f9c-a0f0ba236954	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:32:17.38308	examen_higiene_oral	00000000-0000-0000-0000-000000000000	UPDATE	{"id_higiene": "bb145a35-3129-4352-bc2b-25a55e0b7b75", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "estado_higiene": "Regular", "fecha_registro": "2026-05-27T00:56:25.155521"}	{"id_higiene": "bb145a35-3129-4352-bc2b-25a55e0b7b75", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-27T01:32:17.38308"}	\N	\N
46613647-ec44-4951-bb42-0d5a1d6fafa6	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:32:23.865225	diagnostico	f2652b9c-a06d-4ea8-adb9-715ad7b6871f	INSERT	\N	{"tipo": "presuntivo", "fecha": "2026-05-27", "pronostico": null, "descripcion": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "f2652b9c-a06d-4ea8-adb9-715ad7b6871f", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
4978ac9c-fabc-4bdc-89ba-cce4f9ea7b3e	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:32:29.037733	derivacion_clinicas	00000000-0000-0000-0000-000000000000	UPDATE	{"docente": "", "destinos": {"periodoncia": true, "estomatologia": true}, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_derivacion": "38e927d0-cd84-4dc8-82e9-dfba85c27213", "observaciones": "", "fecha_derivacion": "2026-05-27", "alumno_diagnostico": ""}	{"docente": "", "destinos": {"periodoncia": true, "estomatologia": true, "integral_adulto": true}, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_derivacion": "38e927d0-cd84-4dc8-82e9-dfba85c27213", "observaciones": "asdasd", "fecha_derivacion": "2026-05-27", "alumno_diagnostico": ""}	\N	\N
45fb1842-f1c3-413b-ae58-80ffee8f80ef	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:32:36.37875	diagnostico	4ba20335-a443-424f-be44-accaf7f7adf7	UPDATE	{"tipo": "definitivo_clinicas", "fecha": "2026-05-20", "pronostico": null, "descripcion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "4ba20335-a443-424f-be44-accaf7f7adf7", "alumno_tratante": "asda", "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "4ba20335-a443-424f-be44-accaf7f7adf7", "alumno_tratante": "asda", "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": "asdasd", "diagnostico_definitivo": null}	\N	\N
b771760a-6004-49a9-859c-7c5d4aacba18	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:32:43.477377	diagnostico	4ba20335-a443-424f-be44-accaf7f7adf7	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "4ba20335-a443-424f-be44-accaf7f7adf7", "alumno_tratante": "asda", "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": "asdasd", "diagnostico_definitivo": null}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "4ba20335-a443-424f-be44-accaf7f7adf7", "alumno_tratante": "asda", "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": true}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "asdasd"}	\N	\N
bef9ccde-1f18-4d00-bed8-834df7ccc967	00000000-0000-0000-0000-000000000000	2026-05-28 03:08:19.203307	enfermedad_actual	0989bb3f-f348-4c52-9fff-f8b94802ec4d	UPDATE	{"curso": "", "relato": "", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "forma_inicio": "", "tratamiento_prev": "", "sintoma_principal": "", "tiempo_enfermedad": "", "id_enfermedad_actual": "0989bb3f-f348-4c52-9fff-f8b94802ec4d"}	{"curso": null, "relato": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "forma_inicio": "asdas", "tratamiento_prev": null, "sintoma_principal": "asdasd", "tiempo_enfermedad": "asdasd", "id_enfermedad_actual": "0989bb3f-f348-4c52-9fff-f8b94802ec4d"}	\N	\N
e2530f28-c2da-47e2-8252-06976a1d023e	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:32:51.367331	diagnostico	4ba20335-a443-424f-be44-accaf7f7adf7	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "4ba20335-a443-424f-be44-accaf7f7adf7", "alumno_tratante": "asda", "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": true}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "asdasd"}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "4ba20335-a443-424f-be44-accaf7f7adf7", "alumno_tratante": "asda", "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": true}, "fotografia": {"texto": "", "checked": true}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "asdasd"}	\N	\N
bcafe9d5-84b4-4e1e-8927-8df7fecad5ee	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:33:00.754853	evolucion	17a8fed7-853b-4b21-abb0-814eb74a5a34	INSERT	\N	{"fecha": "2026-05-27", "alumno": "asdasd", "actividad": "asdasdas", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_evolucion": "17a8fed7-853b-4b21-abb0-814eb74a5a34", "observaciones": null}	\N	\N
f41ee115-fe72-40e3-a891-5c5a84b25da1	00000000-0000-0000-0000-000000000000	2026-05-27 01:42:32.973762	examen_clinico_boca	00000000-0000-0000-0000-000000000000	UPDATE	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": null, "oclusion_molar_izq": "Clase II", "labios_con_lesiones": null, "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": null, "lengua_con_lesiones": null, "lengua_sin_lesiones": null, "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": null, "paladar_sin_lesiones": null, "lat_der_funcion_grupo": null, "lat_izq_funcion_grupo": null, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": null, "piso_boca_sin_lesiones": null, "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": null, "orofaringe_con_lesiones": null, "orofaringe_sin_lesiones": null, "lat_der_contacto_balance": null, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": null, "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": null, "carrillos_retromolar_sin_lesiones": null}	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": "Clase III", "oclusion_molar_izq": "Clase I", "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": "asdasd", "lengua_sin_lesiones": null, "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": "asdasd", "paladar_sin_lesiones": null, "lat_der_funcion_grupo": true, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": null, "piso_boca_sin_lesiones": null, "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": null, "orofaringe_con_lesiones": null, "orofaringe_sin_lesiones": null, "lat_der_contacto_balance": false, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": "asdas", "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": null, "carrillos_retromolar_sin_lesiones": null}	\N	\N
54417fb5-2731-43cb-aa30-bc13b57005d7	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:45:27.297662	examen_higiene_oral	00000000-0000-0000-0000-000000000000	UPDATE	{"id_higiene": "bb145a35-3129-4352-bc2b-25a55e0b7b75", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-27T01:32:17.38308"}	{"id_higiene": "bb145a35-3129-4352-bc2b-25a55e0b7b75", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "estado_higiene": "Regular", "fecha_registro": "2026-05-27T01:45:27.297662"}	\N	\N
76d4ba54-a87b-475a-9873-d661f54785f6	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:49:44.305009	diagnostico	f2652b9c-a06d-4ea8-adb9-715ad7b6871f	UPDATE	{"tipo": "presuntivo", "fecha": "2026-05-27", "pronostico": null, "descripcion": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "f2652b9c-a06d-4ea8-adb9-715ad7b6871f", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "presuntivo", "fecha": "2026-05-27", "pronostico": null, "descripcion": "asdasddasdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "f2652b9c-a06d-4ea8-adb9-715ad7b6871f", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
f6881b78-122b-4d01-8502-ea6a9c8240b2	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 01:50:08.195418	diagnostico	f2652b9c-a06d-4ea8-adb9-715ad7b6871f	UPDATE	{"tipo": "presuntivo", "fecha": "2026-05-27", "pronostico": null, "descripcion": "asdasddasdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "f2652b9c-a06d-4ea8-adb9-715ad7b6871f", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "presuntivo", "fecha": "2026-05-27", "pronostico": null, "descripcion": "asdasddasdasdasdasdaasdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_diagnostico": "f2652b9c-a06d-4ea8-adb9-715ad7b6871f", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
3fa776ee-564d-4abd-804e-8d80d86bf295	00000000-0000-0000-0000-000000000000	2026-05-27 01:52:53.777804	examen_general	00000000-0000-0000-0000-000000000000	INSERT	\N	{"peso": null, "pulso": null, "talla": null, "facies": null, "actitud": null, "ganglios": null, "posicion": "Sentado", "id_examen": "ffb2abab-6c58-4df1-8873-f6b77b274c97", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": null, "piel_anexos": "Alterados", "temperatura": "fdfsdf", "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": "asdasd", "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
529f64fd-45cd-4462-8e50-5913ad769b6d	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 02:43:42.422122	diagnostico	75066a2d-7bda-4c68-aa16-3fa7aa5b8037	UPDATE	{"tipo": "presuntivo", "fecha": "2026-05-28", "pronostico": null, "descripcion": "asdasda", "id_historia": "dacf98a8-099d-41a7-9b1c-f54121ab9fcd", "id_diagnostico": "75066a2d-7bda-4c68-aa16-3fa7aa5b8037", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "presuntivo", "fecha": "2026-05-28", "pronostico": null, "descripcion": "asdasdaasdasda", "id_historia": "dacf98a8-099d-41a7-9b1c-f54121ab9fcd", "id_diagnostico": "75066a2d-7bda-4c68-aa16-3fa7aa5b8037", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
bb0e9f91-fcf8-415f-bf3b-b290bdf22b84	00000000-0000-0000-0000-000000000000	2026-05-27 01:55:39.480766	examen_general	00000000-0000-0000-0000-000000000000	UPDATE	{"peso": null, "pulso": null, "talla": null, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": null, "piel_lesiones": null, "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": null, "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	{"peso": null, "pulso": null, "talla": null, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": "Abundante", "piel_lesiones": "Presentes", "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": "asdasd", "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
13ac9581-c74c-4a2d-97d0-7f53ef2d9717	00000000-0000-0000-0000-000000000000	2026-05-27 01:55:45.568515	examen_general	00000000-0000-0000-0000-000000000000	UPDATE	{"peso": null, "pulso": null, "talla": null, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": "Abundante", "piel_lesiones": "Presentes", "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": "asdasd", "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	{"peso": null, "pulso": null, "talla": null, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": "Abundante", "piel_lesiones": "Presentes", "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": "asdasd", "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
a26d9b02-812b-4319-8d1b-feef99b53c9e	00000000-0000-0000-0000-000000000000	2026-05-27 01:57:33.546151	examen_regional	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": null, "craneo_forma": null, "cuello_otros": null, "craneo_tamano": "Microcéfalo", "atm_aper_dolor": null, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": true, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": null, "atm_observaciones": null, "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": null, "atm_musculos_dolor": null, "cabeza_movimientos": "Tic", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": null, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": null, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": null, "craneo_forma": null, "cuello_otros": "asdasd", "craneo_tamano": "Microcéfalo", "atm_aper_dolor": true, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": false, "atm_prot_ruido": true, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": true, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": false, "atm_lat_der_ruido": true, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": true, "atm_lat_izq_salto": null, "atm_observaciones": null, "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": null, "atm_musculos_dolor": null, "cabeza_movimientos": "Tic", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": true, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": null, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	\N	\N
de785c0e-c742-4a93-ae88-ef7cafc386d2	00000000-0000-0000-0000-000000000000	2026-05-27 01:57:39.269647	examen_regional	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": null, "craneo_forma": null, "cuello_otros": "asdasd", "craneo_tamano": "Microcéfalo", "atm_aper_dolor": true, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": false, "atm_prot_ruido": true, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": true, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": false, "atm_lat_der_ruido": true, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": true, "atm_lat_izq_salto": null, "atm_observaciones": null, "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": null, "atm_musculos_dolor": null, "cabeza_movimientos": "Tic", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": true, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": null, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": null, "craneo_forma": null, "cuello_otros": "asdasd", "craneo_tamano": "Microcéfalo", "atm_aper_dolor": true, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": false, "atm_prot_ruido": true, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": true, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": false, "atm_lat_der_ruido": true, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": true, "atm_lat_izq_salto": null, "atm_observaciones": null, "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": null, "atm_musculos_dolor": null, "cabeza_movimientos": "Tic", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": true, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": null, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	\N	\N
b4c2aba9-e59c-4785-92d3-cf39a100896e	00000000-0000-0000-0000-000000000000	2026-05-27 02:04:53.760451	examen_general	00000000-0000-0000-0000-000000000000	UPDATE	{"peso": null, "pulso": null, "talla": null, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": null, "facies_obs": null, "piel_color": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": null, "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": "Abundante", "piel_lesiones": "Presentes", "piel_anexos_obs": null, "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": "asdasd", "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	{"peso": 2.00, "pulso": null, "talla": 3.00, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": "asdasd", "facies_obs": null, "piel_color": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": "Alterados", "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": "Abundante", "piel_lesiones": "Presentes", "piel_anexos_obs": "asads", "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": "asdasd", "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
089bb113-ea0c-42fd-ad4c-e93d43651205	00000000-0000-0000-0000-000000000000	2026-05-27 02:05:02.36612	examen_general	00000000-0000-0000-0000-000000000000	UPDATE	{"peso": 2.00, "pulso": null, "talla": 3.00, "facies": "No característica", "actitud": null, "ganglios": null, "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": "asdasd", "facies_obs": null, "piel_color": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": "Alterados", "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": null, "piel_humedad": null, "tcs_cantidad": "Abundante", "piel_lesiones": "Presentes", "piel_anexos_obs": "asads", "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": "asdasd", "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	{"peso": 2.00, "pulso": null, "talla": 3.00, "facies": "No característica", "actitud": null, "ganglios": "Palpables", "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": "asdasd", "facies_obs": null, "piel_color": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": "Alterados", "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": "asdas", "piel_humedad": null, "tcs_cantidad": "Abundante", "piel_lesiones": "Presentes", "piel_anexos_obs": "asads", "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": "asdasd", "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
cbdffbf2-8ce4-4691-8cda-af7abd1b9069	00000000-0000-0000-0000-000000000000	2026-05-27 02:05:09.40424	examen_general	00000000-0000-0000-0000-000000000000	UPDATE	{"peso": 2.00, "pulso": null, "talla": 3.00, "facies": "No característica", "actitud": null, "ganglios": "Palpables", "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": "asdasd", "facies_obs": null, "piel_color": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": "Alterados", "temperatura": null, "constitucion": null, "deambulacion": null, "ganglios_obs": "asdas", "piel_humedad": null, "tcs_cantidad": "Abundante", "piel_lesiones": "Presentes", "piel_anexos_obs": "asads", "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": "asdasd", "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	{"peso": 2.00, "pulso": null, "talla": 3.00, "facies": "No característica", "actitud": "Pasiva", "ganglios": "Palpables", "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": "asdasd", "facies_obs": null, "piel_color": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": "Alterados", "temperatura": null, "constitucion": null, "deambulacion": "Disbásica", "ganglios_obs": "asdas", "piel_humedad": null, "tcs_cantidad": "Abundante", "piel_lesiones": "Presentes", "piel_anexos_obs": "asads", "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": "asdasd", "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
a650b208-40b4-4c3a-a3bc-794375ce13a1	00000000-0000-0000-0000-000000000000	2026-05-27 02:05:18.89512	examen_general	00000000-0000-0000-0000-000000000000	UPDATE	{"peso": 2.00, "pulso": null, "talla": 3.00, "facies": "No característica", "actitud": "Pasiva", "ganglios": "Palpables", "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": "asdasd", "facies_obs": null, "piel_color": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": "Alterados", "temperatura": null, "constitucion": null, "deambulacion": "Disbásica", "ganglios_obs": "asdas", "piel_humedad": null, "tcs_cantidad": "Abundante", "piel_lesiones": "Presentes", "piel_anexos_obs": "asads", "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": "asdasd", "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	{"peso": 2.00, "pulso": null, "talla": 3.00, "facies": "No característica", "actitud": "Pasiva", "ganglios": "Palpables", "posicion": "De cúbito", "id_examen": "046b010e-e674-4405-8d48-a433f82fddae", "conciencia": "asdasd", "facies_obs": null, "piel_color": "asdasd", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "piel_anexos": "Alterados", "temperatura": null, "constitucion": "Normotipo", "deambulacion": "Disbásica", "ganglios_obs": "asdas", "piel_humedad": null, "tcs_cantidad": "Abundante", "piel_lesiones": "Presentes", "piel_anexos_obs": "asads", "estado_nutritivo": null, "presion_arterial": null, "tcs_distribucion": null, "piel_lesiones_obs": "asdasd", "tcs_distribucion_obs": null, "frecuencia_respiratoria": null}	\N	\N
b9a8e99a-cd6f-43d9-9844-3e03ddab3875	00000000-0000-0000-0000-000000000000	2026-05-27 02:12:56.636119	examen_regional	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": null, "craneo_forma": null, "cuello_otros": "asdasd", "craneo_tamano": "Microcéfalo", "atm_aper_dolor": true, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": false, "atm_prot_ruido": true, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": true, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": false, "atm_lat_der_ruido": true, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": true, "atm_lat_izq_salto": null, "atm_observaciones": null, "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": null, "atm_musculos_dolor": null, "cabeza_movimientos": "Tic", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": true, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": null, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": "asdsad", "craneo_forma": null, "cuello_otros": "asdasd", "craneo_tamano": "Microcéfalo", "atm_aper_dolor": true, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": null, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": null, "atm_observaciones": "dasd", "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": "Limpias", "atm_musculos_dolor": null, "cabeza_movimientos": "Temblor", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": true, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": 22.00, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	\N	\N
e9408ef5-5382-4a9d-b27d-11f0e23d03a7	00000000-0000-0000-0000-000000000000	2026-05-27 16:42:53.743269	examen_clinico_boca	00000000-0000-0000-0000-000000000000	UPDATE	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": "Clase III", "oclusion_molar_izq": "Clase I", "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": "asdasd", "lengua_sin_lesiones": null, "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": "asdasd", "paladar_sin_lesiones": "asd", "lat_der_funcion_grupo": true, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": null, "piso_boca_sin_lesiones": null, "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": "asda", "orofaringe_con_lesiones": "asdasd", "orofaringe_sin_lesiones": "asdasd", "lat_der_contacto_balance": null, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": "asdas", "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": "asdas", "carrillos_retromolar_sin_lesiones": "asdasd"}	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": "Clase III", "oclusion_molar_izq": "Clase I", "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": "asdasd", "lengua_sin_lesiones": "asdadasd", "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": "asdasd", "paladar_sin_lesiones": "asd", "lat_der_funcion_grupo": true, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": "asdasd", "piso_boca_sin_lesiones": "asdasd", "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": "asda", "orofaringe_con_lesiones": "asdasd", "orofaringe_sin_lesiones": "asdasd", "lat_der_contacto_balance": null, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": "asdas", "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": "asdas", "carrillos_retromolar_sin_lesiones": "asdasd"}	\N	\N
a59d1258-b117-459b-bdb6-e554125f5f65	00000000-0000-0000-0000-000000000000	2026-05-27 02:13:18.495831	examen_regional	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": "asdsad", "craneo_forma": null, "cuello_otros": "asdasd", "craneo_tamano": "Microcéfalo", "atm_aper_dolor": true, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": null, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": null, "atm_observaciones": "dasd", "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": "Limpias", "atm_musculos_dolor": null, "cabeza_movimientos": "Temblor", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": true, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": 22.00, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": "asdsad", "craneo_forma": null, "cuello_otros": "asdasd", "craneo_tamano": "Microcéfalo", "atm_aper_dolor": true, "atm_aper_ruido": null, "atm_aper_salto": true, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": true, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": "hola", "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": true, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": true, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": true, "atm_observaciones": "dasd", "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": "Limpias", "atm_musculos_dolor": null, "cabeza_movimientos": "Temblor", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": true, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": 22.00, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	\N	\N
b74d9fed-b9f3-4cc4-9b8f-f03f03581268	00000000-0000-0000-0000-000000000000	2026-05-27 02:13:51.980895	examen_regional	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": "asdsad", "craneo_forma": null, "cuello_otros": "asdasd", "craneo_tamano": "Microcéfalo", "atm_aper_dolor": true, "atm_aper_ruido": null, "atm_aper_salto": true, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": true, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": "hola", "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": true, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": true, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": true, "atm_observaciones": "dasd", "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": "Limpias", "atm_musculos_dolor": null, "cabeza_movimientos": "Temblor", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": true, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": 22.00, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": "asdsad", "craneo_forma": null, "cuello_otros": "asdasd", "craneo_tamano": "Microcéfalo", "atm_aper_dolor": null, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": "hola", "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": null, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": null, "atm_observaciones": "dasd", "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": "Limpias", "atm_musculos_dolor": null, "cabeza_movimientos": "Temblor", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": true, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": 22.00, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	\N	\N
ba769713-3b3d-4a9c-98a1-31688c5425e6	00000000-0000-0000-0000-000000000000	2026-05-27 02:14:05.119343	examen_regional	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": "asdsad", "craneo_forma": null, "cuello_otros": "asdasd", "craneo_tamano": "Microcéfalo", "atm_aper_dolor": null, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": "hola", "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": null, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": null, "atm_observaciones": "dasd", "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": "Limpias", "atm_musculos_dolor": null, "cabeza_movimientos": "Temblor", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": true, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": 22.00, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	{"id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "id_regional": "54c5377c-5b5a-479d-b4c9-efecd8dd4bfc", "nariz_forma": "asdsad", "craneo_forma": null, "cuello_otros": "asdasd", "craneo_tamano": "Microcéfalo", "atm_aper_dolor": null, "atm_aper_ruido": true, "atm_aper_salto": null, "atm_prot_dolor": null, "atm_prot_ruido": true, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": "hola", "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": null, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": null, "atm_observaciones": "dasd", "cara_forma_frente": null, "cara_forma_perfil": null, "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": "Limpias", "atm_musculos_dolor": null, "cabeza_movimientos": "Temblor", "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": true, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": 22.00, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	\N	\N
a2b8a2dc-c467-4212-8bff-bc37dd593ffe	00000000-0000-0000-0000-000000000000	2026-05-27 02:14:17.600512	examen_clinico_boca	00000000-0000-0000-0000-000000000000	UPDATE	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": "Clase III", "oclusion_molar_izq": "Clase I", "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": "asdasd", "lengua_sin_lesiones": null, "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": "asdasd", "paladar_sin_lesiones": null, "lat_der_funcion_grupo": true, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": null, "piso_boca_sin_lesiones": null, "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": null, "orofaringe_con_lesiones": null, "orofaringe_sin_lesiones": null, "lat_der_contacto_balance": false, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": "asdas", "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": null, "carrillos_retromolar_sin_lesiones": null}	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": "Clase III", "oclusion_molar_izq": "Clase I", "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": "asdasd", "lengua_sin_lesiones": null, "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": "asdasd", "paladar_sin_lesiones": null, "lat_der_funcion_grupo": true, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": null, "piso_boca_sin_lesiones": null, "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": "asda", "orofaringe_con_lesiones": null, "orofaringe_sin_lesiones": null, "lat_der_contacto_balance": false, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": "asdas", "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": "asdas", "carrillos_retromolar_sin_lesiones": "asdasd"}	\N	\N
d27f13bd-274d-4a90-a918-b1e1ab71d559	00000000-0000-0000-0000-000000000000	2026-05-27 16:41:50.272822	examen_clinico_boca	00000000-0000-0000-0000-000000000000	UPDATE	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": "Clase III", "oclusion_molar_izq": "Clase I", "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": "asdasd", "lengua_sin_lesiones": null, "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": "asdasd", "paladar_sin_lesiones": null, "lat_der_funcion_grupo": true, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": null, "piso_boca_sin_lesiones": null, "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": "asda", "orofaringe_con_lesiones": null, "orofaringe_sin_lesiones": null, "lat_der_contacto_balance": false, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": "asdas", "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": "asdas", "carrillos_retromolar_sin_lesiones": "asdasd"}	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": "Clase III", "oclusion_molar_izq": "Clase I", "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": "asdasd", "lengua_sin_lesiones": null, "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": "asdasd", "paladar_sin_lesiones": "asd", "lat_der_funcion_grupo": true, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": null, "piso_boca_sin_lesiones": null, "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": "asda", "orofaringe_con_lesiones": "asdasd", "orofaringe_sin_lesiones": "asdasd", "lat_der_contacto_balance": null, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": "asdas", "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": "asdas", "carrillos_retromolar_sin_lesiones": "asdasd"}	\N	\N
9ac5e3c3-5632-48d4-b3e5-234b6666cb85	00000000-0000-0000-0000-000000000000	2026-05-27 16:43:20.315808	examen_clinico_boca	00000000-0000-0000-0000-000000000000	UPDATE	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": "Clase III", "oclusion_molar_izq": "Clase I", "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": "asdasd", "lengua_sin_lesiones": "asdadasd", "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": "asdasd", "paladar_sin_lesiones": "asd", "lat_der_funcion_grupo": true, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": "asdasd", "piso_boca_sin_lesiones": "asdasd", "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": "asda", "orofaringe_con_lesiones": "asdasd", "orofaringe_sin_lesiones": "asdasd", "lat_der_contacto_balance": null, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": "asdas", "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": "asdas", "carrillos_retromolar_sin_lesiones": "asdasd"}	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": -1.0, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": "Clase III", "oclusion_molar_izq": "Clase I", "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": "asdasd", "lengua_sin_lesiones": "asdadasd", "oclusion_canina_der": "Clase III", "oclusion_canina_izq": "Clase II", "oclusion_protrusion": null, "paladar_con_lesiones": "asdasd", "paladar_sin_lesiones": "asd", "lat_der_funcion_grupo": true, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": "asdasd", "piso_boca_sin_lesiones": "asdasd", "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": "asda", "orofaringe_con_lesiones": "asdasd", "orofaringe_sin_lesiones": "asdasd", "lat_der_contacto_balance": null, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": "asdas", "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": "asdas", "carrillos_retromolar_sin_lesiones": "asdasd"}	\N	\N
dd43b936-3471-4958-acef-3f3a258cbeac	00000000-0000-0000-0000-000000000000	2026-05-27 16:43:35.523314	examen_clinico_boca	00000000-0000-0000-0000-000000000000	UPDATE	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": -1.0, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": "Clase III", "oclusion_molar_izq": "Clase I", "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": "asdasd", "lengua_sin_lesiones": "asdadasd", "oclusion_canina_der": "Clase III", "oclusion_canina_izq": "Clase II", "oclusion_protrusion": null, "paladar_con_lesiones": "asdasd", "paladar_sin_lesiones": "asd", "lat_der_funcion_grupo": true, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": "asdasd", "piso_boca_sin_lesiones": "asdasd", "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": "asda", "orofaringe_con_lesiones": "asdasd", "orofaringe_sin_lesiones": "asdasd", "lat_der_contacto_balance": null, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": "asdas", "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": "asdas", "carrillos_retromolar_sin_lesiones": "asdasd"}	{"id_boca": "092cb83d-f90e-4416-92d1-6ff62175f0a7", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": 1.0, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": "Clase III", "oclusion_molar_izq": "Clase I", "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asdasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": "asdasd", "lengua_sin_lesiones": "asdadasd", "oclusion_canina_der": "Clase III", "oclusion_canina_izq": "Clase II", "oclusion_protrusion": null, "paladar_con_lesiones": "asdasd", "paladar_sin_lesiones": "asd", "lat_der_funcion_grupo": true, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": "asdasd", "piso_boca_sin_lesiones": "asdasd", "vestibulo_con_lesiones": "asasd", "vestibulo_sin_lesiones": "asda", "orofaringe_con_lesiones": "asdasd", "orofaringe_sin_lesiones": "asdasd", "lat_der_contacto_balance": null, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": "asdas", "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": "asdas", "carrillos_retromolar_sin_lesiones": "asdasd"}	\N	\N
f09428a6-235e-403a-af14-ee144d966f7c	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 16:55:38.664685	examen_higiene_oral	00000000-0000-0000-0000-000000000000	UPDATE	{"id_higiene": "bb145a35-3129-4352-bc2b-25a55e0b7b75", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "estado_higiene": "Regular", "fecha_registro": "2026-05-27T01:45:27.297662"}	{"id_higiene": "bb145a35-3129-4352-bc2b-25a55e0b7b75", "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-27T16:55:38.664685"}	\N	\N
3cdbe907-7f31-439e-a743-bf5b5d8d3cb3	00000000-0000-0000-0000-000000000000	2026-05-27 16:56:45.656316	filiacion	900b0bc0-1b6f-490c-8f31-b91fb5a1c99f	UPDATE	{"edad": 35, "raza": "Mestizo", "sexo": "M", "lugar": "Tacna", "direccion": "Av. Ejemplo 123", "ocupacion": "Estudiante", "id_historia": "bea73607-a9cc-462f-b14f-bedb4d503e6d", "acompaniante": "Maria Lopez", "estado_civil": "Soltero", "id_filiacion": "900b0bc0-1b6f-490c-8f31-b91fb5a1c99f", "nombre_conyuge": null, "fecha_nacimiento": "1990-01-01", "fecha_elaboracion": "2025-12-01", "lugar_procedencia": "Arequipa", "contacto_emergencia": "Juan Perez", "telefono_emergencia": "999888777", "motivo_visita_medico": "Chequeo", "ultima_visita_medico": "2025-06-01", "motivo_visita_dentista": "Control", "ultima_visita_dentista": "2025-01-01", "tiempo_residencia_tacna": "5 años"}	{"edad": null, "raza": "Mestizo", "sexo": null, "lugar": "Tacna", "direccion": "Av. Ejemplo 123", "ocupacion": null, "id_historia": "bea73607-a9cc-462f-b14f-bedb4d503e6d", "acompaniante": "Maria Lopez", "estado_civil": null, "id_filiacion": "900b0bc0-1b6f-490c-8f31-b91fb5a1c99f", "nombre_conyuge": null, "fecha_nacimiento": "1990-01-01", "fecha_elaboracion": null, "lugar_procedencia": "Tacna", "contacto_emergencia": "Juan Perez", "telefono_emergencia": "999999999", "motivo_visita_medico": "Chequeo", "ultima_visita_medico": "2023-06-01", "motivo_visita_dentista": "Control", "ultima_visita_dentista": "2023-01-01", "tiempo_residencia_tacna": "10 años"}	\N	\N
e590345b-1867-483b-8269-8eab356b16c7	00000000-0000-0000-0000-000000000000	2026-05-27 16:57:43.308554	filiacion	57e08d07-3e55-4790-9e0e-997e491d4e5c	INSERT	\N	{"edad": null, "raza": "Mestizo", "sexo": null, "lugar": "Tacna", "direccion": "Av. Ejemplo 123", "ocupacion": null, "id_historia": "e144b73c-e19b-4457-a1c9-7d8635488602", "acompaniante": "Maria Lopez", "estado_civil": null, "id_filiacion": "57e08d07-3e55-4790-9e0e-997e491d4e5c", "nombre_conyuge": null, "fecha_nacimiento": "1990-01-01", "fecha_elaboracion": null, "lugar_procedencia": "Tacna", "contacto_emergencia": "Juan Perez", "telefono_emergencia": "999999999", "motivo_visita_medico": "Chequeo", "ultima_visita_medico": "2023-06-01", "motivo_visita_dentista": "Control", "ultima_visita_dentista": "2023-01-01", "tiempo_residencia_tacna": "10 años"}	\N	\N
a3dc94a9-4f10-4ad9-82a5-0a3440fa2e18	00000000-0000-0000-0000-000000000000	2026-05-27 17:03:03.225166	filiacion	4963c7b3-d7f1-4e9d-b027-711be155c27c	UPDATE	{"edad": 32, "raza": null, "sexo": "maculino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "acompaniante": null, "estado_civil": null, "id_filiacion": "4963c7b3-d7f1-4e9d-b027-711be155c27c", "nombre_conyuge": null, "fecha_nacimiento": "2007-11-29", "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": "2025-10-08", "tiempo_residencia_tacna": "B"}	{"edad": 32, "raza": null, "sexo": "Masculino", "lugar": null, "direccion": null, "ocupacion": null, "id_historia": "95cf32b6-c707-423f-b26e-2cb4893c26c7", "acompaniante": null, "estado_civil": null, "id_filiacion": "4963c7b3-d7f1-4e9d-b027-711be155c27c", "nombre_conyuge": null, "fecha_nacimiento": "2007-11-29", "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": "2025-10-08", "tiempo_residencia_tacna": "B"}	\N	\N
3b2f742a-7e83-43a3-9899-342ab5dd9831	00000000-0000-0000-0000-000000000000	2026-05-27 17:04:05.056223	filiacion	429f1fed-9aaf-4f5c-a11e-a262da98a2ab	INSERT	\N	{"edad": null, "raza": "Mestizo", "sexo": null, "lugar": "Tacna", "direccion": "Av. Ejemplo 123", "ocupacion": null, "id_historia": "275bf20f-a25d-4f5d-a3c2-d853c297e1ed", "acompaniante": "Maria Lopez", "estado_civil": null, "id_filiacion": "429f1fed-9aaf-4f5c-a11e-a262da98a2ab", "nombre_conyuge": null, "fecha_nacimiento": "1990-01-01", "fecha_elaboracion": null, "lugar_procedencia": "Tacna", "contacto_emergencia": "Juan Perez", "telefono_emergencia": "999999999", "motivo_visita_medico": "Chequeo", "ultima_visita_medico": "2023-06-01", "motivo_visita_dentista": "Control", "ultima_visita_dentista": "2023-01-01", "tiempo_residencia_tacna": "10 años"}	\N	\N
9db1b72e-d092-484c-82fb-39020a6e7b41	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-27 17:04:45.503313	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "4e1bafcc-9c10-4835-a6b9-37bcd5aafebf", "id_historia": "4a766208-4cc4-481f-94f6-2f2adb2cc655", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-27T17:04:45.503313"}	\N	\N
0a3d2752-9845-4b76-8816-ca9ebc6c9dda	00000000-0000-0000-0000-000000000000	2026-05-28 01:31:05.671806	filiacion	6de7eb48-1345-4379-befd-66fbab0b3c8c	UPDATE	{"edad": 2, "raza": null, "sexo": "Masculino", "lugar": null, "direccion": null, "ocupacion": "Comerciante", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "acompaniante": null, "estado_civil": null, "id_filiacion": "6de7eb48-1345-4379-befd-66fbab0b3c8c", "nombre_conyuge": null, "fecha_nacimiento": "1985-03-15", "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": "2025-11-27", "tiempo_residencia_tacna": null}	{"edad": 2, "raza": null, "sexo": "Masculino", "lugar": null, "direccion": null, "ocupacion": "Comerciante", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "acompaniante": null, "estado_civil": null, "id_filiacion": "6de7eb48-1345-4379-befd-66fbab0b3c8c", "nombre_conyuge": null, "fecha_nacimiento": "1985-03-15", "fecha_elaboracion": null, "lugar_procedencia": null, "contacto_emergencia": null, "telefono_emergencia": null, "motivo_visita_medico": null, "ultima_visita_medico": null, "motivo_visita_dentista": null, "ultima_visita_dentista": "2025-11-27", "tiempo_residencia_tacna": "asdasd"}	\N	\N
c7defe43-f993-4e90-86e8-c7c54549b86f	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:37:01.363076	derivacion_clinicas	00000000-0000-0000-0000-000000000000	INSERT	\N	{"docente": "asad", "destinos": {"cirugia": true, "integral_adulto": true}, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_derivacion": "ebffb732-9475-4eb0-9a84-dc667b335671", "observaciones": "asdasd", "fecha_derivacion": "2026-05-28", "alumno_diagnostico": "asdas"}	\N	\N
1823e5d2-4da7-4092-8b84-12fe9c91f70f	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:37:14.053948	derivacion_clinicas	00000000-0000-0000-0000-000000000000	UPDATE	{"docente": "asad", "destinos": {"cirugia": true, "integral_adulto": true}, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_derivacion": "ebffb732-9475-4eb0-9a84-dc667b335671", "observaciones": "asdasd", "fecha_derivacion": "2026-05-28", "alumno_diagnostico": "asdas"}	{"docente": "asad", "destinos": {"cirugia": false, "periodoncia": true, "integral_nino": true, "integral_adulto": true}, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_derivacion": "ebffb732-9475-4eb0-9a84-dc667b335671", "observaciones": "asdasdavvvvvv", "fecha_derivacion": "2026-05-28", "alumno_diagnostico": "asdas"}	\N	\N
0c03261a-35c0-4391-b395-6340b46b2ad2	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:40:10.998127	diagnostico	eefd0016-ae98-4f22-9519-8542d81af7d7	INSERT	\N	{"tipo": "presuntivo", "fecha": "2026-05-28", "pronostico": null, "descripcion": "sadasda", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "eefd0016-ae98-4f22-9519-8542d81af7d7", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
39ef9cd3-6503-446f-806d-aaef65afe62d	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:40:14.684321	diagnostico	eefd0016-ae98-4f22-9519-8542d81af7d7	UPDATE	{"tipo": "presuntivo", "fecha": "2026-05-28", "pronostico": null, "descripcion": "sadasda", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "eefd0016-ae98-4f22-9519-8542d81af7d7", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "presuntivo", "fecha": "2026-05-28", "pronostico": null, "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "eefd0016-ae98-4f22-9519-8542d81af7d7", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
e7758f80-ba14-4993-9329-efe981f83f3c	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:47:44.868702	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	INSERT	\N	{"tipo": "definitivo_clinicas", "fecha": "2026-04-28", "pronostico": "asdasd", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "asdasd", "clinica_respuesta": "asdasdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": "2026-05-11", "tratamiento_realizar": "asdasd", "clinica_interconsulta": "asdads", "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "asda"}	\N	\N
ffdc8b55-6e89-468c-8b7b-13b12d8f5c84	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:47:53.948755	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": "2026-04-28", "pronostico": "asdasd", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "asdasd", "clinica_respuesta": "asdasdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": "2026-05-11", "tratamiento_realizar": "asdasd", "clinica_interconsulta": "asdads", "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "asda"}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "asdasd", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
cf031e05-298c-4a75-8c93-6bc6eea3212d	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:48:00.726241	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "asdasd", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "asdasd", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "asdasd", "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": "asdasd", "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": "asdasd"}	\N	\N
e423204c-a603-44d6-a4d0-0ab6bdf59d35	00000000-0000-0000-0000-000000000000	2026-05-28 03:12:29.789304	motivo_consulta	00000000-0000-0000-0000-000000000000	UPDATE	{"motivo": "asdasd", "id_motivo": "68b9f8fe-5d07-47b1-9318-d38ff9982298", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "fecha_registro": "2025-11-30T22:44:31.424046"}	{"motivo": "asdasdasdasd", "id_motivo": "68b9f8fe-5d07-47b1-9318-d38ff9982298", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "fecha_registro": "2026-05-28T03:12:29.789304"}	\N	\N
ca98265e-0d14-4978-b759-5afa47ee0fc2	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:48:03.114238	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "asdasd", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "asdasd", "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": "asdasd", "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": "asdasd"}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "asdasdasd", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
91f90823-c741-4825-a5ef-1907fbd79435	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:48:07.062301	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "asdasdasd", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
5e7d2748-3ea7-46b8-a4d1-083a4a91ae1b	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:48:14.958916	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "saas", "checked": true}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
990bcfc9-438b-4fa1-953f-1543198299d9	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:48:25.348556	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "saas", "checked": true}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": "asdas", "interconsulta_detalle": null, "diagnostico_definitivo": "asdas"}	\N	\N
ab86b9eb-fd28-416c-b1ec-07f0281142c1	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:52:51.219731	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": "asdas", "interconsulta_detalle": null, "diagnostico_definitivo": "asdas"}	{"tipo": "definitivo_clinicas", "fecha": "2026-05-02", "pronostico": "hola", "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "asdasd", "clinica_respuesta": "asdads", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": true}}, "fecha_interconsulta": "2026-05-01", "tratamiento_realizar": "asdasd", "clinica_interconsulta": "asdads", "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "asdasd"}	\N	\N
9a213ba6-f52a-4868-b123-f8558dfe78f2	00000000-0000-0000-0000-000000000000	2026-05-28 09:47:23.675279	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
1e034e14-34d0-4721-867a-be35e02568cb	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 01:55:55.546337	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": "2026-05-02", "pronostico": "hola", "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "asdasd", "clinica_respuesta": "asdads", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": true}}, "fecha_interconsulta": "2026-05-01", "tratamiento_realizar": "asdasd", "clinica_interconsulta": "asdads", "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "asdasd"}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "hhhh", "clinica_respuesta": "asdads", "examenes_auxiliares": {"modelos": {"texto": "asdasd", "checked": true}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "asdas", "checked": true}, "radiograficos": {"texto": "adsasd", "checked": true}}, "fecha_interconsulta": "2026-05-01", "tratamiento_realizar": "asdasd", "clinica_interconsulta": "asdads", "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "asdasd"}	\N	\N
7f6d544a-00ac-4394-bc48-bec50942aa3b	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 02:00:20.448816	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "hhhh", "clinica_respuesta": "asdads", "examenes_auxiliares": {"modelos": {"texto": "asdasd", "checked": true}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "asdas", "checked": true}, "radiograficos": {"texto": "adsasd", "checked": true}}, "fecha_interconsulta": "2026-05-01", "tratamiento_realizar": "asdasd", "clinica_interconsulta": "asdads", "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "asdasd"}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "r", "clinica_respuesta": "asdads", "examenes_auxiliares": {"modelos": {"texto": "asdasd", "checked": true}, "fotografia": {"texto": "", "checked": true}, "laboratorio": {"texto": "asdas", "checked": true}, "radiograficos": {"texto": "adsasd", "checked": false}}, "fecha_interconsulta": "2026-05-01", "tratamiento_realizar": "rrrr", "clinica_interconsulta": "asdads", "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "asdasd"}	\N	\N
8ca9acba-9c08-40bf-a76c-79584f6a6715	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 02:02:30.251121	evolucion	5075f6e1-a831-489e-bca6-84201ea8e095	INSERT	\N	{"fecha": "2026-05-28", "alumno": "asdasdasd", "actividad": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_evolucion": "5075f6e1-a831-489e-bca6-84201ea8e095", "observaciones": null}	\N	\N
4b4776d7-fc7f-47a8-89ea-cecb6a4a7c00	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 02:39:02.880244	derivacion_clinicas	00000000-0000-0000-0000-000000000000	INSERT	\N	{"docente": null, "destinos": {"integral_nino": true}, "id_historia": "dacf98a8-099d-41a7-9b1c-f54121ab9fcd", "id_derivacion": "93fd0570-aa22-4e4e-9673-44d735d76e8d", "observaciones": "asdas", "fecha_derivacion": "2026-05-28", "alumno_diagnostico": null}	\N	\N
fff68554-cb22-451f-9cb1-b56744d15aee	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 02:39:08.455861	diagnostico	7eb51fb5-22fc-4d55-8df8-7003d9d524d5	INSERT	\N	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "dacf98a8-099d-41a7-9b1c-f54121ab9fcd", "id_diagnostico": "7eb51fb5-22fc-4d55-8df8-7003d9d524d5", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": true}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
ae52f8b0-e678-4937-be49-674a46a990dc	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 02:39:21.311437	diagnostico	7eb51fb5-22fc-4d55-8df8-7003d9d524d5	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "dacf98a8-099d-41a7-9b1c-f54121ab9fcd", "id_diagnostico": "7eb51fb5-22fc-4d55-8df8-7003d9d524d5", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": true}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "dacf98a8-099d-41a7-9b1c-f54121ab9fcd", "id_diagnostico": "7eb51fb5-22fc-4d55-8df8-7003d9d524d5", "alumno_tratante": null, "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": true}}, "fecha_interconsulta": null, "tratamiento_realizar": "asdad", "clinica_interconsulta": null, "interconsulta_detalle": "asdasd", "diagnostico_definitivo": null}	\N	\N
e942b45e-1a24-4ae1-8ad8-f1a117a8afc8	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 02:39:28.423693	evolucion	cfe53171-0651-4b8d-a99b-1d5b1ecdb2a4	INSERT	\N	{"fecha": "2026-05-28", "alumno": "asdasd", "actividad": "asdasdasda", "id_historia": "dacf98a8-099d-41a7-9b1c-f54121ab9fcd", "id_evolucion": "cfe53171-0651-4b8d-a99b-1d5b1ecdb2a4", "observaciones": null}	\N	\N
045c2240-a907-47ce-ab37-5c538d619659	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 02:42:07.340322	diagnostico	7eb51fb5-22fc-4d55-8df8-7003d9d524d5	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "dacf98a8-099d-41a7-9b1c-f54121ab9fcd", "id_diagnostico": "7eb51fb5-22fc-4d55-8df8-7003d9d524d5", "alumno_tratante": null, "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": true}}, "fecha_interconsulta": null, "tratamiento_realizar": "asdad", "clinica_interconsulta": null, "interconsulta_detalle": "asdasd", "diagnostico_definitivo": null}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "dacf98a8-099d-41a7-9b1c-f54121ab9fcd", "id_diagnostico": "7eb51fb5-22fc-4d55-8df8-7003d9d524d5", "alumno_tratante": null, "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": true}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": true}}, "fecha_interconsulta": null, "tratamiento_realizar": "asdad", "clinica_interconsulta": null, "interconsulta_detalle": "asdasd", "diagnostico_definitivo": null}	\N	\N
c24f8d17-f61b-49df-b240-db65001ae2c4	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 02:43:38.173578	diagnostico	75066a2d-7bda-4c68-aa16-3fa7aa5b8037	INSERT	\N	{"tipo": "presuntivo", "fecha": "2026-05-28", "pronostico": null, "descripcion": "asdasda", "id_historia": "dacf98a8-099d-41a7-9b1c-f54121ab9fcd", "id_diagnostico": "75066a2d-7bda-4c68-aa16-3fa7aa5b8037", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
05991109-4f3b-447b-a85b-5f9a608be7b1	00000000-0000-0000-0000-000000000000	2026-05-28 03:12:49.69669	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": false, "alergias": null, "enf_asma": false, "enf_anemia": false, "enf_ulcera": false, "enf_corazon": false, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "enf_diabetes": false, "enf_epilepsia": false, "enf_hepatitis": false, "odontologicos": "sadas", "salud_general": "Regular", "enf_coagulacion": false, "enf_neurologica": false, "bajo_tratamiento": true, "enf_hipertension": false, "tipo_tratamiento": null, "hospitalizaciones": "si noseaadasda", "id_ant_patologico": "fb7378e0-84fd-4532-b0ad-f31fe2407a98", "tipo_traumatismos": null, "tuvo_traumatismos": true, "enf_alergia_cronica": false, "enf_fiebre_reumatica": false, "otras_enf_patologicas": "asdasd", "medicamentos_contraindicados": null}	{"enf_tbc": false, "alergias": null, "enf_asma": false, "enf_anemia": false, "enf_ulcera": false, "enf_corazon": false, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "enf_diabetes": false, "enf_epilepsia": true, "enf_hepatitis": true, "odontologicos": "sadas", "salud_general": "Mala", "enf_coagulacion": false, "enf_neurologica": false, "bajo_tratamiento": true, "enf_hipertension": false, "tipo_tratamiento": null, "hospitalizaciones": "si noseaadasda", "id_ant_patologico": "fb7378e0-84fd-4532-b0ad-f31fe2407a98", "tipo_traumatismos": "asdasd", "tuvo_traumatismos": true, "enf_alergia_cronica": true, "enf_fiebre_reumatica": false, "otras_enf_patologicas": "asdasd", "medicamentos_contraindicados": null}	\N	\N
8aee49aa-8f48-46ed-b183-d646ee4bd48d	00000000-0000-0000-0000-000000000000	2026-05-28 03:12:49.704112	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": "true", "fuma": false, "otros": null, "rechina": false, "toma_te": false, "vacunas": null, "chupa_dedo": false, "hepatitis_b": true, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "psicosocial": "aaaaaaa", "seda_dental": false, "cepillo_duro": false, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": false, "otros_habitos": "aae", "cepillo_blando": false, "dolor_muscular": false, "enjuague_bucal": false, "id_antecedente": "8f8eab8a-c51d-4200-a86e-f7802ac1ab9c", "muerde_objetos": false, "aprieta_dientes": false, "cepillo_mediano": false, "cigarrillos_dia": null, "esta_embarazada": false, "momento_aprieta": null, "cepillo_electrico": false, "frecuencia_alcohol": null, "id_grupo_sanguineo": "26c54b60-387c-42da-9a4b-fda784ecdfab", "tipo_interproximal": "aaaee", "frecuencia_cepillado": null, "cepillo_interproximal": false, "otros_elementos_higiene": "aa"}	{"mac": "true", "fuma": false, "otros": "asdasd", "rechina": false, "toma_te": false, "vacunas": "asdasd", "chupa_dedo": false, "hepatitis_b": true, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "psicosocial": "aaaaaaaasdasd", "seda_dental": false, "cepillo_duro": false, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": false, "otros_habitos": "aaeasdasd", "cepillo_blando": false, "dolor_muscular": false, "enjuague_bucal": false, "id_antecedente": "8f8eab8a-c51d-4200-a86e-f7802ac1ab9c", "muerde_objetos": false, "aprieta_dientes": false, "cepillo_mediano": false, "cigarrillos_dia": null, "esta_embarazada": false, "momento_aprieta": "asdasd", "cepillo_electrico": false, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": "aaaee", "frecuencia_cepillado": null, "cepillo_interproximal": false, "otros_elementos_higiene": "aa"}	\N	\N
2050bfca-5f2b-4909-b933-f26f73c24e49	00000000-0000-0000-0000-000000000000	2026-05-28 03:12:49.721107	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "firma_nombre": "jheral", "motivo_dolor": true, "actitud_panico": true, "motivo_control": true, "motivo_limpieza": true, "actitud_aprensivo": true, "actitud_tranquilo": true, "desagrado_atencion": "123123", "id_ant_cumplimiento": "7d0920db-0bff-456c-9d33-32e3a1425ea5", "fecha_consentimiento": "2005-04-23", "historia_elaborada_por": "asda", "frecuencia_control_meses": 11, "frecuencia_limpieza_meses": 11}	{"id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "firma_nombre": "jheral", "motivo_dolor": true, "actitud_panico": true, "motivo_control": true, "motivo_limpieza": true, "actitud_aprensivo": true, "actitud_tranquilo": true, "desagrado_atencion": "123123", "id_ant_cumplimiento": "7d0920db-0bff-456c-9d33-32e3a1425ea5", "fecha_consentimiento": "2005-04-23", "historia_elaborada_por": "asda", "frecuencia_control_meses": 11, "frecuencia_limpieza_meses": 11}	\N	\N
ea2f392c-cbe7-4306-a79d-65eaa63e3e1a	00000000-0000-0000-0000-000000000000	2026-05-28 03:12:49.727708	antecedente_familiar	00000000-0000-0000-0000-000000000000	UPDATE	{"id_ant_fam": "0958c787-3140-4e86-835a-6c0e7df2bed3", "descripcion": "hola", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b"}	{"id_ant_fam": "0958c787-3140-4e86-835a-6c0e7df2bed3", "descripcion": "holaasdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b"}	\N	\N
40830eb6-086d-408f-8db9-b1444ca315bb	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 03:33:07.669572	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "e4fa4079-b26f-4ff1-bf99-23cd3b2c6a13", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-28T03:33:07.669572"}	\N	\N
a22b21b3-1434-4c72-bdb0-03278fc4ee94	00000000-0000-0000-0000-000000000000	2026-05-28 03:33:17.994188	examen_clinico_boca	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_boca": "b07c6dac-4662-438e-90fd-419ed7524262", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "lat_der_describa": null, "lat_izq_describa": null, "oclusion_overjet": null, "oclusion_overbite": null, "encia_con_lesiones": null, "encia_sin_lesiones": null, "oclusion_molar_der": null, "oclusion_molar_izq": null, "labios_con_lesiones": "asdasd", "labios_sin_lesiones": "asasd", "lat_der_guia_canina": null, "lat_izq_guia_canina": true, "lengua_con_lesiones": null, "lengua_sin_lesiones": null, "oclusion_canina_der": null, "oclusion_canina_izq": null, "oclusion_protrusion": null, "paladar_con_lesiones": null, "paladar_sin_lesiones": null, "lat_der_funcion_grupo": null, "lat_izq_funcion_grupo": true, "oclusion_sobremordida": null, "oclusion_guia_incisiva": null, "piso_boca_con_lesiones": null, "piso_boca_sin_lesiones": null, "vestibulo_con_lesiones": "asdad", "vestibulo_sin_lesiones": null, "orofaringe_con_lesiones": null, "orofaringe_sin_lesiones": null, "lat_der_contacto_balance": null, "lat_izq_contacto_balance": true, "oclusion_mordida_abierta": null, "oclusion_mordida_cruzada": null, "oclusion_vestibuloclusion": null, "oclusion_contacto_posterior": null, "oclusion_relacion_vertical_otros": null, "carrillos_retromolar_con_lesiones": null, "carrillos_retromolar_sin_lesiones": "asdasd"}	\N	\N
9647d6f4-8bb5-49b4-8298-ca9a85ace19a	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 03:40:13.194399	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "r", "clinica_respuesta": "asdads", "examenes_auxiliares": {"modelos": {"texto": "asdasd", "checked": true}, "fotografia": {"texto": "", "checked": true}, "laboratorio": {"texto": "asdas", "checked": true}, "radiograficos": {"texto": "adsasd", "checked": false}}, "fecha_interconsulta": "2026-05-01", "tratamiento_realizar": "rrrr", "clinica_interconsulta": "asdads", "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "asdasd"}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "asdasd", "checked": true}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": "asdasd"}	\N	\N
15131770-aec9-4bf0-b25d-e49c7f4ac5bf	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 03:40:16.537797	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "asdasd", "checked": true}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": "asdasd"}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "asdasd", "checked": true}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": "asdasd"}	\N	\N
b17bffb8-3c26-4aab-8097-84b44f3e57ff	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 03:40:31.365112	derivacion_clinicas	00000000-0000-0000-0000-000000000000	UPDATE	{"docente": "asad", "destinos": {"cirugia": false, "periodoncia": true, "integral_nino": true, "integral_adulto": true}, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_derivacion": "ebffb732-9475-4eb0-9a84-dc667b335671", "observaciones": "asdasdavvvvvv", "fecha_derivacion": "2026-05-28", "alumno_diagnostico": "asdas"}	{"docente": "asad", "destinos": {"cirugia": true, "periodoncia": true, "estomatologia": true, "integral_nino": true, "integral_adulto": true}, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_derivacion": "ebffb732-9475-4eb0-9a84-dc667b335671", "observaciones": "eeee", "fecha_derivacion": "2026-05-28", "alumno_diagnostico": "asdas"}	\N	\N
a41b4505-0b15-4d9e-8824-631faeee07a0	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 03:40:38.043656	diagnostico	eefd0016-ae98-4f22-9519-8542d81af7d7	UPDATE	{"tipo": "presuntivo", "fecha": "2026-05-28", "pronostico": null, "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "eefd0016-ae98-4f22-9519-8542d81af7d7", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "presuntivo", "fecha": "2026-05-28", "pronostico": null, "descripcion": "asdasdsad", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "eefd0016-ae98-4f22-9519-8542d81af7d7", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
62e0856f-28fb-4840-bf11-ad0495566e12	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 03:40:43.217135	evolucion	0dea1329-3c7f-4ac9-9e1f-679df4f77348	INSERT	\N	{"fecha": "2026-05-28", "alumno": "asdasd", "actividad": "asdasda", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_evolucion": "0dea1329-3c7f-4ac9-9e1f-679df4f77348", "observaciones": null}	\N	\N
1503fc62-647f-4628-a75b-2ebb67e30292	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 03:40:49.946969	evolucion	c50f201b-30b8-4e48-9a4a-5b76a6d83ce5	INSERT	\N	{"fecha": "2026-05-28", "alumno": "dasdasd", "actividad": "asdas", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_evolucion": "c50f201b-30b8-4e48-9a4a-5b76a6d83ce5", "observaciones": null}	\N	\N
e6953f4b-87d5-4fbb-92a4-e5ee7b801ba2	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 03:40:59.84265	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "asdasd", "checked": true}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": "asdasd"}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "asdasd", "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": "asdsad", "diagnostico_definitivo": "asdasd"}	\N	\N
b48ee9d2-6bec-4714-b856-1032b1b2e618	00000000-0000-0000-0000-000000000000	2026-05-28 09:47:23.078379	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
15b1c346-95ec-4672-9070-04de1a5defae	00000000-0000-0000-0000-000000000000	2026-05-28 09:47:23.426279	antecedente_cumplimiento	00000000-0000-0000-0000-000000000000	UPDATE	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	{"id_historia": "550e8400-e29b-41d4-a716-446655440000", "firma_nombre": null, "motivo_dolor": null, "actitud_panico": null, "motivo_control": null, "motivo_limpieza": null, "actitud_aprensivo": null, "actitud_tranquilo": null, "desagrado_atencion": null, "id_ant_cumplimiento": "169ed627-d573-470c-aa1b-fb2084d5e65c", "fecha_consentimiento": null, "historia_elaborada_por": null, "frecuencia_control_meses": null, "frecuencia_limpieza_meses": null}	\N	\N
fed7dcb0-d068-4b5d-8cb7-ffdb29a08137	00000000-0000-0000-0000-000000000000	2026-05-30 01:09:47.591895	diagnostico	036837eb-5dd9-4cec-a1dc-9a2256b41702	INSERT	\N	{"tipo": "presuntivo", "fecha": "2026-05-30", "pronostico": null, "descripcion": "jherald se la comes ga confirmo", "id_historia": "d68ea890-c80f-4dbf-8a89-aa534006758a", "id_diagnostico": "036837eb-5dd9-4cec-a1dc-9a2256b41702", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
e9aa40db-adf9-48c2-85be-6474c66ae867	00000000-0000-0000-0000-000000000000	2026-05-28 09:47:30.673878	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
29d2d4ea-3823-4241-a514-f98cfd7d6175	00000000-0000-0000-0000-000000000000	2026-05-28 09:47:30.947898	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
0660d09b-09af-4e71-80b2-519d45176760	00000000-0000-0000-0000-000000000000	2026-05-28 09:47:31.21783	antecedente_personal	00000000-0000-0000-0000-000000000000	UPDATE	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	{"mac": null, "fuma": null, "otros": null, "rechina": null, "toma_te": null, "vacunas": null, "chupa_dedo": null, "hepatitis_b": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "psicosocial": null, "seda_dental": null, "cepillo_duro": null, "tazas_te_dia": null, "toma_alcohol": null, "muerde_labios": null, "otros_habitos": null, "cepillo_blando": null, "dolor_muscular": null, "enjuague_bucal": null, "id_antecedente": "20c7461e-d9af-43ff-8181-4195c2f52822", "muerde_objetos": null, "aprieta_dientes": null, "cepillo_mediano": null, "cigarrillos_dia": null, "esta_embarazada": null, "momento_aprieta": null, "cepillo_electrico": null, "frecuencia_alcohol": null, "id_grupo_sanguineo": null, "tipo_interproximal": null, "frecuencia_cepillado": null, "cepillo_interproximal": null, "otros_elementos_higiene": null}	\N	\N
2960f96d-f542-448a-ae90-58d66a8b9067	00000000-0000-0000-0000-000000000000	2026-05-28 09:47:34.399872	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
3f9eedbc-b113-4dc7-833f-83a3d9af01b5	00000000-0000-0000-0000-000000000000	2026-05-28 09:47:34.643883	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
7ab09778-9696-46dd-84f9-1795f3213234	00000000-0000-0000-0000-000000000000	2026-05-28 09:47:34.895803	antecedente_medico	00000000-0000-0000-0000-000000000000	UPDATE	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	{"enf_tbc": null, "alergias": null, "enf_asma": null, "enf_anemia": null, "enf_ulcera": null, "enf_corazon": null, "id_historia": "550e8400-e29b-41d4-a716-446655440000", "enf_diabetes": null, "enf_epilepsia": null, "enf_hepatitis": null, "odontologicos": null, "salud_general": null, "enf_coagulacion": null, "enf_neurologica": null, "bajo_tratamiento": null, "enf_hipertension": null, "tipo_tratamiento": null, "hospitalizaciones": null, "id_ant_patologico": "dafa8d66-4933-45c1-a520-99b99d538d21", "tipo_traumatismos": null, "tuvo_traumatismos": null, "enf_alergia_cronica": null, "enf_fiebre_reumatica": null, "otras_enf_patologicas": null, "medicamentos_contraindicados": null}	\N	\N
88723b75-7089-484f-bfbf-c6c8337ac6ce	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 14:37:41.088323	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "aebbf4c0-4f80-4976-a81a-65c9e8bd8d1c", "id_historia": "8ac0fca4-4b92-407d-ab8a-d45cea4ebe32", "estado_higiene": "Deficiente", "fecha_registro": "2026-05-28T14:37:41.088323"}	\N	\N
f63cc2c7-61fc-409b-bfa5-a630aa2bb5c3	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 14:37:49.585502	diagnostico	b00c26d6-31c4-48c2-8597-973cb68d3852	INSERT	\N	{"tipo": "presuntivo", "fecha": "2026-05-28", "pronostico": null, "descripcion": "Te la comes ga", "id_historia": "8ac0fca4-4b92-407d-ab8a-d45cea4ebe32", "id_diagnostico": "b00c26d6-31c4-48c2-8597-973cb68d3852", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
de797e84-e688-4a2e-b680-0ed08cfed345	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 14:38:00.937049	diagnostico	b00c26d6-31c4-48c2-8597-973cb68d3852	UPDATE	{"tipo": "presuntivo", "fecha": "2026-05-28", "pronostico": null, "descripcion": "Te la comes ga", "id_historia": "8ac0fca4-4b92-407d-ab8a-d45cea4ebe32", "id_diagnostico": "b00c26d6-31c4-48c2-8597-973cb68d3852", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "presuntivo", "fecha": "2026-05-28", "pronostico": null, "descripcion": "Te la comes ga ga", "id_historia": "8ac0fca4-4b92-407d-ab8a-d45cea4ebe32", "id_diagnostico": "b00c26d6-31c4-48c2-8597-973cb68d3852", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
f76e7524-643c-4b1b-ac6e-a63c7809e6b7	00000000-0000-0000-0000-000000000000	2026-05-28 14:52:12.02371	examen_regional	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_historia": "8ac0fca4-4b92-407d-ab8a-d45cea4ebe32", "id_regional": "e1a686ab-ed6c-42c8-87c0-04402ec66ce8", "nariz_forma": null, "craneo_forma": null, "cuello_otros": null, "craneo_tamano": null, "atm_aper_dolor": null, "atm_aper_ruido": null, "atm_aper_salto": null, "atm_prot_dolor": null, "atm_prot_ruido": null, "atm_prot_salto": null, "atm_trayectoria": null, "cabeza_posicion": "Deflexión", "ojos_arco_senil": null, "ojos_iris_color": null, "atm_cierre_dolor": null, "atm_cierre_ruido": null, "atm_cierre_salto": null, "cuello_simetrico": null, "laringe_alineada": null, "nariz_permeables": null, "atm_lat_der_dolor": null, "atm_lat_der_ruido": null, "atm_lat_der_salto": null, "atm_lat_izq_dolor": null, "atm_lat_izq_ruido": null, "atm_lat_izq_salto": null, "atm_observaciones": null, "cara_forma_frente": null, "cara_forma_perfil": "Convexo", "nariz_secreciones": null, "oidos_secreciones": null, "ojos_escleroticas": "Pigmentadas", "atm_musculos_dolor": null, "cabeza_movimientos": null, "oidos_anomalias_obs": null, "ojos_agudeza_visual": null, "ojos_cejas_adecuada": null, "cuello_movilidad_obs": null, "cuello_simetrico_obs": null, "laringe_alineada_obs": null, "nariz_senos_dolorosos": null, "ojos_implantacion_obs": null, "atm_apertura_maxima_mm": null, "cabeza_movimientos_obs": null, "atm_musculos_dolor_zona": null, "atm_musculos_dolor_grado": null, "atm_coordinacion_condilar": null, "oidos_audicion_conservada": null, "cuello_movilidad_conservada": null, "oidos_anomalias_morfologicas": null}	\N	\N
957e6310-730c-47ec-b403-71df1f694499	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-28 14:56:12.737317	diagnostico	28ff454d-f7e8-4208-bf61-cdfe67aa958b	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": "asdasd", "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": "asdasd", "clinica_respuesta": "asdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": "asdsad", "diagnostico_definitivo": "asdasd"}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "hola", "descripcion": null, "id_historia": "90d29073-ed9b-41d5-89ad-16f716d6c27b", "id_diagnostico": "28ff454d-f7e8-4208-bf61-cdfe67aa958b", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
6165718e-f20f-4e83-be13-994158833885	00000000-0000-0000-0000-000000000000	2026-05-30 00:58:25.725677	diagnostico	1a8e4782-08d0-410d-a25f-01638883e6e7	INSERT	\N	{"tipo": "presuntivo", "fecha": "2026-05-30", "pronostico": null, "descripcion": "Diagnóstico de prueba", "id_historia": "ec56d593-2d6e-4184-b1c6-f241e23abf73", "id_diagnostico": "1a8e4782-08d0-410d-a25f-01638883e6e7", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
d5330878-f7c9-4158-a762-d6ac1472a4d1	00000000-0000-0000-0000-000000000000	2026-05-30 01:08:21.552776	diagnostico	005f4dbd-9ec0-493f-84ed-63c7fd655b1e	INSERT	\N	{"tipo": "presuntivo", "fecha": "2026-05-30", "pronostico": null, "descripcion": "sd", "id_historia": "d68ea890-c80f-4dbf-8a89-aa534006758a", "id_diagnostico": "005f4dbd-9ec0-493f-84ed-63c7fd655b1e", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
397a15eb-8d31-488c-b098-f621efab2e73	00000000-0000-0000-0000-000000000000	2026-05-30 01:09:36.672011	diagnostico	cb7bd9fa-bbd4-497c-bd7a-2ad93e4a187f	INSERT	\N	{"tipo": "presuntivo", "fecha": "2026-05-30", "pronostico": null, "descripcion": "jherald se la comes ga", "id_historia": "d68ea890-c80f-4dbf-8a89-aa534006758a", "id_diagnostico": "cb7bd9fa-bbd4-497c-bd7a-2ad93e4a187f", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
8ad62bc7-a40d-45a7-8d10-ee016fdd2485	00000000-0000-0000-0000-000000000000	2026-05-30 18:06:30.160676	diagnostico	eff09bf6-e508-4ced-bbd0-48c3b36044ad	INSERT	\N	{"tipo": "presuntivo", "fecha": "2026-05-30", "pronostico": null, "descripcion": "asd", "id_historia": "e144b73c-e19b-4457-a1c9-7d8635488602", "id_diagnostico": "eff09bf6-e508-4ced-bbd0-48c3b36044ad", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
b4c24431-070b-45a0-989c-5b81598dcfd0	00000000-0000-0000-0000-000000000000	2026-05-30 22:28:48.62662	diagnostico	c2e01aaa-bc19-44c4-9b99-e23b3b234029	INSERT	\N	{"tipo": "presuntivo", "fecha": "2026-05-30", "pronostico": null, "descripcion": "asd prueba 1", "id_historia": "e144b73c-e19b-4457-a1c9-7d8635488602", "id_diagnostico": "c2e01aaa-bc19-44c4-9b99-e23b3b234029", "alumno_tratante": null, "clinica_respuesta": null, "examenes_auxiliares": null, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
f89cf98a-ca4c-4cdc-9421-156cd7fc15df	00000000-0000-0000-0000-000000000000	2026-05-30 22:37:01.05342	evolucion	6aaca78e-951f-4dd2-8993-327bfdd2945d	INSERT	\N	{"fecha": "2026-05-30", "alumno": "JAvier", "actividad": "Esto es una prueba", "id_historia": "e144b73c-e19b-4457-a1c9-7d8635488602", "id_evolucion": "6aaca78e-951f-4dd2-8993-327bfdd2945d", "observaciones": null}	\N	\N
09c7c963-79f3-4c54-83e2-b5c6dd52da98	00000000-0000-0000-0000-000000000000	2026-05-30 22:39:43.267961	derivacion_clinicas	00000000-0000-0000-0000-000000000000	INSERT	\N	{"docente": "XAsdasdasd", "destinos": {"periodoncia": true}, "id_historia": "e144b73c-e19b-4457-a1c9-7d8635488602", "id_derivacion": "69161784-bedd-4a62-a176-7d2d99e03f8b", "observaciones": "ADssssssssssssdas", "fecha_derivacion": "2026-05-30", "alumno_diagnostico": "asdasdasdsa"}	\N	\N
9fc71de2-e566-4fe3-b6eb-a179c948ae12	00000000-0000-0000-0000-000000000000	2026-05-30 22:40:26.743758	examen_higiene_oral	00000000-0000-0000-0000-000000000000	INSERT	\N	{"id_higiene": "71df5e18-d35f-4c43-8331-e210dac7b756", "id_historia": "e144b73c-e19b-4457-a1c9-7d8635488602", "estado_higiene": "Regular", "fecha_registro": "2026-05-30T22:40:26.743758"}	\N	\N
91f3de15-c9d6-43c9-900a-5b203a3d0f51	00000000-0000-0000-0000-000000000000	2026-05-31 06:08:14.819624	diagnostico	ae54df18-7553-4258-8498-e26e3d7653d0	INSERT	\N	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "275bf20f-a25d-4f5d-a3c2-d853c297e1ed", "id_diagnostico": "ae54df18-7553-4258-8498-e26e3d7653d0", "alumno_tratante": null, "clinica_respuesta": "asdasdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	\N	\N
f86ad252-a75d-479a-9be5-88059556f1e4	00000000-0000-0000-0000-000000000000	2026-05-31 15:20:43.595593	diagnostico	ae54df18-7553-4258-8498-e26e3d7653d0	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": null, "descripcion": null, "id_historia": "275bf20f-a25d-4f5d-a3c2-d853c297e1ed", "id_diagnostico": "ae54df18-7553-4258-8498-e26e3d7653d0", "alumno_tratante": null, "clinica_respuesta": "asdasdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": null, "clinica_interconsulta": null, "interconsulta_detalle": null, "diagnostico_definitivo": null}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "asdasda", "descripcion": "asdasdas", "id_historia": "275bf20f-a25d-4f5d-a3c2-d853c297e1ed", "id_diagnostico": "ae54df18-7553-4258-8498-e26e3d7653d0", "alumno_tratante": "dsadasda", "clinica_respuesta": "asdasdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": "asdasdsa", "clinica_interconsulta": "asdasdas", "interconsulta_detalle": "asdaasds", "diagnostico_definitivo": "asdasdas"}	\N	\N
35f2bf19-fbe5-45b9-8843-45891c98fba3	00000000-0000-0000-0000-000000000000	2026-05-31 15:39:21.874225	diagnostico	ae54df18-7553-4258-8498-e26e3d7653d0	UPDATE	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "asdasda", "descripcion": "asdasdas", "id_historia": "275bf20f-a25d-4f5d-a3c2-d853c297e1ed", "id_diagnostico": "ae54df18-7553-4258-8498-e26e3d7653d0", "alumno_tratante": "dsadasda", "clinica_respuesta": "asdasdasd", "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": "asdasdsa", "clinica_interconsulta": "asdasdas", "interconsulta_detalle": "asdaasds", "diagnostico_definitivo": "asdasdas"}	{"tipo": "definitivo_clinicas", "fecha": null, "pronostico": "asdasda", "descripcion": "adsasdas", "id_historia": "275bf20f-a25d-4f5d-a3c2-d853c297e1ed", "id_diagnostico": "ae54df18-7553-4258-8498-e26e3d7653d0", "alumno_tratante": "dasd", "clinica_respuesta": null, "examenes_auxiliares": {"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}, "fecha_interconsulta": null, "tratamiento_realizar": "asdas", "clinica_interconsulta": "asd", "interconsulta_detalle": "asdasd", "diagnostico_definitivo": "adsasdas"}	\N	\N
92d1062b-7884-4f88-91bc-e812f07f06ec	00000000-0000-0000-0000-000000000000	2026-06-02 20:31:07.406879	motivo_consulta	00000000-0000-0000-0000-000000000000	INSERT	\N	{"motivo": "Jherald se la come toda", "id_motivo": "f797d817-9480-4c75-8973-26a03c8bff3e", "id_historia": "275bf20f-a25d-4f5d-a3c2-d853c297e1ed", "fecha_registro": "2026-06-02T20:31:07.406879"}	\N	\N
\.


--
-- Data for Name: catalogo_atm_trayectoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_atm_trayectoria (id_trayectoria, descripcion) FROM stdin;
e1a3b5d1-2525-451a-8ef2-b02681e7be6d	Recta
b66d4e1b-82cf-476b-b611-a766749abeba	Deflexión
91feab9e-a9dd-4568-8322-53f433966753	Desviación
\.


--
-- Data for Name: catalogo_clinica; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_clinica (id_clinica, nombre) FROM stdin;
d5e163af-44af-4e78-ac26-c4f0d7656f81	Clínica de Odontología General
92a3f456-2eca-4f8a-b0b0-5d6edef60e76	Clínica de Ortodoncia
c90490f1-d657-46fc-8911-97cba65c99ee	Clínica de Periodoncia
e49712f1-59b8-41c0-8cf7-e23506184c1a	Clínica de Endodoncia
0cbf6ba5-b569-45ff-9845-7dda62d2f7f4	Clínica de Cirugía Oral
180e934c-ed00-43c1-b5e7-ea8f5e2a9d3c	Clínica de Prótesis
8846e14b-dea2-46eb-8eba-a79e91522c4d	Clínica de Pediatría Odontológica
e2484a6e-544d-45f9-be30-a64e3916025e	Clínica de Rehabilitación Oral
\.


--
-- Data for Name: catalogo_dolor_grado; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_dolor_grado (id_grado, descripcion) FROM stdin;
f8ca0b7b-4a25-4a83-a40f-a01cc960b97b	Sin dolor
8eb0f70f-4c78-42a0-af56-d42f4384c6ea	Leve
61073b25-61eb-4e27-87c4-d47a500f09ec	Moderado
138c07f1-31ef-4651-8da7-58bedb309808	Severo
d27cadb8-8b7d-4c54-922e-9d74b2646216	Insoportable
\.


--
-- Data for Name: catalogo_enfermedad; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_enfermedad (id_enfermedad, nombre) FROM stdin;
\.


--
-- Data for Name: catalogo_estado_civil; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_estado_civil (id_estado_civil, descripcion) FROM stdin;
96b903a0-5de4-4a19-b875-ce7a4659d7d9	Soltero
0e2572e1-74f9-4fa7-af59-4962b25ce363	Casado
795d62c0-4f2d-4562-a58e-fbe15441ca39	Conviviente
d89fc94c-042e-4dbc-adc1-b4edbbac1695	Divorciado
072a18b2-f19a-459c-bd92-f623b85f5c50	Viudo
\.


--
-- Data for Name: catalogo_estado_revision; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_estado_revision (id_estado_revision, nombre) FROM stdin;
f4091507-0ce9-40a6-8cfa-9ac7d08ab12f	Pendiente
12b1c564-373d-43e1-a16c-2d65774636f5	En revisión
e2b3b8f8-20de-4213-b80a-65a9dbf2d26d	Aprobada
7ff03fe3-fdbf-441c-ba28-ed8415f43372	Rechazada
0db2edd0-d1e8-420f-b2bb-30e447fc300c	Requiere corrección
\.


--
-- Data for Name: catalogo_examen_auxiliar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_examen_auxiliar (id_examen, descripcion) FROM stdin;
57ad9ce1-286a-494a-9f31-7f9b4d58888c	Radiografía periapical
8741aa29-405e-421f-8bb8-68da2e6eb02e	Radiografía panorámica
6de0ac2d-eb95-4c70-953e-1ed593383ada	Tomografía computarizada
728e5965-02f5-4d02-933d-6c396665d392	Modelos de estudio
373509fd-eb29-44e1-b14e-155dcdfdc183	Fotografías clínicas
4ee9e711-0d93-4093-b9fc-11b1d1eab12b	Biopsia
a6e6fd16-6202-46bf-819d-f489068def9d	Hemograma completo
464c1d98-33b9-4e48-a6d1-ca56237cd514	Pruebas de coagulación
462ce042-3703-4f64-9077-a1cbfc3f46d2	Glicemia
8f776180-79d3-494e-9a2f-917175acefa5	Otros análisis de laboratorio
\.


--
-- Data for Name: catalogo_grado_instruccion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_grado_instruccion (id_grado_instruccion, descripcion) FROM stdin;
f06bf049-3a55-4c55-92b8-7452b2c4f924	Sin estudios
1733f437-2462-4606-8985-577396da67c9	Primaria incompleta
3f44f9ef-cfb9-43a8-bf8d-ce9e13c29fde	Primaria completa
9e002377-5bf7-4fcb-83e5-6e4c40329cea	Secundaria incompleta
025c9316-f88f-4ba9-b701-5c8c6592d390	Secundaria completa
6deeb58c-ab99-4315-b072-b15e69fea6f5	Técnico incompleto
5817da7e-4bc1-49e6-b84a-920855053514	Técnico completo
895be3db-ab8d-40a9-91b1-2afbb8e48781	Universitario incompleto
2ae326ee-a4be-4666-9a46-a44ecbf25a46	Universitario completo
4de6dcba-4192-4c12-a294-81d702a27d7f	Posgrado
\.


--
-- Data for Name: catalogo_grupo_sanguineo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_grupo_sanguineo (id_grupo_sanguineo, descripcion) FROM stdin;
55bb9f0f-8315-430c-a317-a180f8d01cdc	O+
af048336-63fa-47c7-9b4f-0a9fff806282	O-
26c54b60-387c-42da-9a4b-fda784ecdfab	A+
f919fdd2-63b9-41d4-838f-a5b337846ff6	A-
5e16959d-6214-4a75-b73c-9d84b99ab148	B+
7b58cd88-e77c-4ef1-907c-a67f926c643b	B-
81a79e70-19d9-4d28-8893-9ce60ce9e964	AB+
0ac3f919-5d2d-42c5-b624-ee672c0c7aed	AB-
\.


--
-- Data for Name: catalogo_habito; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_habito (id_habito, nombre) FROM stdin;
\.


--
-- Data for Name: catalogo_medida_regional; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_medida_regional (id_medida, tipo_medida, descripcion) FROM stdin;
c9aa0525-3d5e-42f2-9355-15557e1afcbb	CRANEO_FORMA	Braquicéfalo
f59c5b6a-ed57-4996-bc73-e4e005dfbd45	CRANEO_FORMA	Dolicocéfalo
84de5291-d1d3-4043-acd5-364205547774	CRANEO_FORMA	Mesocéfalo
515180bc-49c3-4646-8822-12d46f8a595a	CARA_FORMA	Euriprosopo
0420f289-970f-4f72-b151-e54d370964ef	CARA_FORMA	Leptoprosopo
bcb2fc0d-1a5f-490c-990e-a95de571bcad	CARA_FORMA	Mesoprosopo
53dcb23b-bc47-41ac-947c-3c1980e02a49	PERFIL_AP	Recto
0c135d7c-82d8-481a-8e9e-ed52f1d95b4c	PERFIL_AP	Convexo
b4aad6e4-1904-4ac2-b94a-94667d12c244	PERFIL_AP	Cóncavo
\.


--
-- Data for Name: catalogo_movimiento_mandibular; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_movimiento_mandibular (id_movimiento, descripcion) FROM stdin;
53f7e40d-9d36-4027-b628-516b37554e2d	Lateralidad derecha
2f8e8a2f-b1cd-4f36-afd9-f48f3126b630	Lateralidad izquierda
b1fba4a4-7dfc-44f9-900f-8c8fa24ac0aa	Protrusión
3a846945-ab41-46bd-98ea-580e14a85431	Apertura
81981066-288d-4aa7-a9e4-1096695115fc	Cierre
\.


--
-- Data for Name: catalogo_ocupacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_ocupacion (id_ocupacion, descripcion) FROM stdin;
5d2a7560-a6de-4dc8-a19b-67fca5b7c8f1	Estudiante
c4935f99-d466-45d0-a509-87c4fa2c0422	Empleado/a
4afbc878-4424-457a-8912-a0ad83d9f256	Independiente
7b6cea9e-8314-412b-a49f-126491ef753d	Ama de casa
f0ddd5d6-a2b8-4dd1-96a1-28a8f17ca550	Jubilado/a
6d22960e-e294-4ce1-9c3b-b3a6f9f1a7c1	Desempleado/a
2e33364d-afed-4dfc-a627-8487d6c2f39c	Profesional
7d9a8e00-d19d-4d48-9744-5870d6ea7063	Comerciante
c30441b1-66a2-4040-a398-be84d1748e67	Agricultor/a
646e07c0-d046-4623-8275-75a942f88139	Otros
\.


--
-- Data for Name: catalogo_posicion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_posicion (id_posicion, posicion) FROM stdin;
c205ac2c-156c-4b6a-93fd-642aa5517140	Sentado
5a05f2a1-4654-435c-ab68-85570b48dfef	De pie
1d854301-d35d-417a-b7d3-f422ca6a9e0e	Decúbito dorsal
ba6360fc-5a88-4e7b-b7a5-da131e27c09d	Decúbito ventral
d13dc181-a95a-47ea-bdb6-ab59ffe530ed	Decúbito lateral
\.


--
-- Data for Name: catalogo_sexo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.catalogo_sexo (id_sexo, descripcion) FROM stdin;
ba10abaf-2440-4a01-87ea-2d7fc256379f	Masculino
0aaaa8da-6cbf-4944-a949-460ea206322b	Femenino
\.


--
-- Data for Name: cita; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cita (id_cita, id_historia, id_estudiante, fecha_hora, duracion_min, motivo, estado, id_usuario, created_at) FROM stdin;
\.


--
-- Data for Name: derivacion_clinicas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.derivacion_clinicas (id_derivacion, id_historia, destinos, observaciones, fecha_derivacion, alumno_diagnostico, docente) FROM stdin;
0eaf1839-b4b1-4d08-b21d-d4ba586134c3	ddce1c78-a0f9-4e01-942e-554dae5a9c8d	{"periodoncia": true}	ninguno	2025-12-03	f	s
adf31e31-42cb-4f19-9527-a81ab598e1af	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	{"cirugia": true, "integral_adulto": true}		2025-12-03		
d5e78616-8b4c-42b7-84c2-ae658398ee5b	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	{"periodoncia": true}	Djffh	2025-12-03		
604d2d8f-63aa-400b-bddc-9c99b9261876	4130ff39-c736-41f1-9c7f-3d0a798d404d	{"periodoncia": true, "integral_nino": true}	asd	2025-12-04		
40d13941-e26b-4081-affa-daa69851bdd7	eb3fa563-e3ee-4304-bcef-0ff390505ff7	{"cirugia": true, "periodoncia": true}	a	2025-12-04	alexis	e
98ae2377-d623-4adb-8ce3-4bde12e5419e	948b53d6-f8b4-41d6-bc70-2c475368c755	{"cirugia": false, "periodoncia": true, "estomatologia": false, "integral_adulto": true}	ninguna	2025-12-04	Alexis Condori 	H
5f70039b-a2e4-4e35-b775-a6fa4f57e6c2	b2328e31-85a7-4261-b092-9cf4b0dbeca7	{"periodoncia": true, "integral_nino": true}	prueba	2025-12-14	Erik	Ricardo
38e927d0-cd84-4dc8-82e9-dfba85c27213	95cf32b6-c707-423f-b26e-2cb4893c26c7	{"periodoncia": true, "estomatologia": true, "integral_adulto": true}	asdasd	2026-05-27		
93fd0570-aa22-4e4e-9673-44d735d76e8d	dacf98a8-099d-41a7-9b1c-f54121ab9fcd	{"integral_nino": true}	asdas	2026-05-28	\N	\N
ebffb732-9475-4eb0-9a84-dc667b335671	90d29073-ed9b-41d5-89ad-16f716d6c27b	{"cirugia": true, "periodoncia": true, "estomatologia": true, "integral_nino": true, "integral_adulto": true}	eeee	2026-05-28	asdas	asad
69161784-bedd-4a62-a176-7d2d99e03f8b	e144b73c-e19b-4457-a1c9-7d8635488602	{"periodoncia": true}	ADssssssssssssdas	2026-05-30	asdasdasdsa	XAsdasdasd
\.


--
-- Data for Name: diagnostico; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.diagnostico (id_diagnostico, id_historia, tipo, fecha, descripcion, clinica_respuesta, examenes_auxiliares, interconsulta_detalle, fecha_interconsulta, clinica_interconsulta, diagnostico_definitivo, tratamiento_realizar, pronostico, alumno_tratante) FROM stdin;
53bf8b99-d243-46ab-8bc3-7479b9dcebc2	a964ba24-1c04-4f1d-b3c3-23264e8a0530	presuntivo	2025-12-03	e	\N	\N	\N	\N	\N	\N	\N	\N	\N
0c44028a-530c-4d1f-9382-e12b27cd489f	a964ba24-1c04-4f1d-b3c3-23264e8a0530	definitivo_clinicas	2025-12-01	\N	a	{"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": true}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}	t	2025-12-03	t	t	t	t	t
0dbbb603-4629-450a-beb9-24bc363d21c4	07e6a608-09e6-4586-a387-a0d941f1a495	presuntivo	2025-12-03	hola	\N	\N	\N	\N	\N	\N	\N	\N	\N
85d02474-4c71-4639-9149-e93624e1ac10	eb3fa563-e3ee-4304-bcef-0ff390505ff7	presuntivo	2025-12-03	e	\N	\N	\N	\N	\N	\N	\N	\N	\N
28e0146d-1311-4002-9081-d143df44de33	ddce1c78-a0f9-4e01-942e-554dae5a9c8d	presuntivo	2025-12-03	a	\N	\N	\N	\N	\N	\N	\N	\N	\N
eefd0016-ae98-4f22-9519-8542d81af7d7	90d29073-ed9b-41d5-89ad-16f716d6c27b	presuntivo	2026-05-28	asdasdsad	\N	\N	\N	\N	\N	\N	\N	\N	\N
f2652b9c-a06d-4ea8-adb9-715ad7b6871f	95cf32b6-c707-423f-b26e-2cb4893c26c7	presuntivo	2026-05-27	asdasddasdasdasdasdaasdasd	\N	\N	\N	\N	\N	\N	\N	\N	\N
f5c46977-247a-49ae-bd1e-fec809898093	67db7e4c-180d-4574-b876-b9aed9b2a756	definitivo_clinicas	2025-12-01	\N	Aw	{"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": true}}	Aaa	2025-12-03	Aqa	T	A	T	T
704ce6b1-e101-49a7-9fc2-f59c6c7f31d9	ddce1c78-a0f9-4e01-942e-554dae5a9c8d	definitivo_clinicas	2025-12-01	\N	e	{"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": true}}	a	2025-12-03	e	e	e	e	e
f36a1c42-1d9b-41f6-9dc1-7f22c73c5451	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	definitivo_clinicas	2025-12-13	\N	La clínica 	{"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": true}}	Lesera ion	\N	\N	\N	holA	\N	\N
fa8baf26-b107-4cb5-8579-b313e32b25f3	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	presuntivo	2025-12-03	Jk	\N	\N	\N	\N	\N	\N	\N	\N	\N
b43cc1e0-2c69-421a-8cf5-ca69fb187a2b	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	definitivo_clinicas	\N	\N	\N	{"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": true}}	\N	\N	\N	\N	\N	\N	\N
49f2aacb-3a35-497f-ae15-5f891718d4ec	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	presuntivo	2025-12-03	Grave kdjdj	\N	\N	\N	\N	\N	\N	\N	\N	\N
b72799b4-da07-48f3-91b9-3986eae0f2ba	4a766208-4cc4-481f-94f6-2f2adb2cc655	definitivo_clinicas	2025-12-13	\N	Ududuf	{"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}	\N	\N	\N	\N	\N	\N	\N
9b040f21-1b18-45d1-96f8-da32c834d12e	99274e1f-dd4b-4364-9113-aa65f848a921	definitivo_clinicas	2025-02-02	\N	WAW	{"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "A", "checked": true}}	A	2025-12-03	A	A	A	A	A
7b4af8ae-43b0-4530-88b8-ed8ef6fe2bdb	4130ff39-c736-41f1-9c7f-3d0a798d404d	presuntivo	2025-12-04	asd	\N	\N	\N	\N	\N	\N	\N	\N	\N
c03c3bd4-6c41-4b6a-a368-dcd21af17aa7	4130ff39-c736-41f1-9c7f-3d0a798d404d	definitivo_clinicas	\N	\N	asd	{"modelos": {"texto": "", "checked": true}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}	asd	\N	asd	asd	asd	\N	asd
6bfa3622-d005-4b35-981f-4a3cf0b8bf46	252be430-3271-487d-b24d-4f57d578f225	definitivo_clinicas	2025-12-19	\N	u6u	{"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "u6", "checked": true}, "radiograficos": {"texto": "", "checked": false}}	\N	\N	\N	\N	\N	\N	\N
eb1fd5e1-c204-470b-bad4-98b5b382c509	948b53d6-f8b4-41d6-bc70-2c475368c755	definitivo_clinicas	\N	\N	u	{"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": true}}	e	\N	e	e	e	e	e
2fce26af-40b4-467e-9859-af0c56eb49a0	948b53d6-f8b4-41d6-bc70-2c475368c755	presuntivo	2025-12-04	Hola	\N	\N	\N	\N	\N	\N	\N	\N	\N
234cc0da-5bd7-4639-ac1d-1e2e99722c04	b2328e31-85a7-4261-b092-9cf4b0dbeca7	presuntivo	2025-12-14	HI?	\N	\N	\N	\N	\N	\N	\N	\N	\N
ae54df18-7553-4258-8498-e26e3d7653d0	275bf20f-a25d-4f5d-a3c2-d853c297e1ed	definitivo_clinicas	\N	adsasdas	\N	{"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": false}, "radiograficos": {"texto": "", "checked": false}}	asdasd	\N	asd	adsasdas	asdas	asdasda	dasd
4ba20335-a443-424f-be44-accaf7f7adf7	95cf32b6-c707-423f-b26e-2cb4893c26c7	definitivo_clinicas	\N	\N	asdasd	{"modelos": {"texto": "", "checked": true}, "fotografia": {"texto": "", "checked": true}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}	asdasd	\N	\N	asdasd	\N	\N	asda
7eb51fb5-22fc-4d55-8df8-7003d9d524d5	dacf98a8-099d-41a7-9b1c-f54121ab9fcd	definitivo_clinicas	\N	\N	asdasd	{"modelos": {"texto": "", "checked": true}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": true}}	asdasd	\N	\N	\N	asdad	\N	\N
75066a2d-7bda-4c68-aa16-3fa7aa5b8037	dacf98a8-099d-41a7-9b1c-f54121ab9fcd	presuntivo	2026-05-28	asdasdaasdasda	\N	\N	\N	\N	\N	\N	\N	\N	\N
b00c26d6-31c4-48c2-8597-973cb68d3852	8ac0fca4-4b92-407d-ab8a-d45cea4ebe32	presuntivo	2026-05-28	Te la comes ga ga	\N	\N	\N	\N	\N	\N	\N	\N	\N
28ff454d-f7e8-4208-bf61-cdfe67aa958b	90d29073-ed9b-41d5-89ad-16f716d6c27b	definitivo_clinicas	\N	\N	\N	{"modelos": {"texto": "", "checked": false}, "fotografia": {"texto": "", "checked": false}, "laboratorio": {"texto": "", "checked": true}, "radiograficos": {"texto": "", "checked": false}}	\N	\N	\N	\N	\N	hola	\N
1a8e4782-08d0-410d-a25f-01638883e6e7	ec56d593-2d6e-4184-b1c6-f241e23abf73	presuntivo	2026-05-30	Diagnóstico de prueba	\N	\N	\N	\N	\N	\N	\N	\N	\N
005f4dbd-9ec0-493f-84ed-63c7fd655b1e	d68ea890-c80f-4dbf-8a89-aa534006758a	presuntivo	2026-05-30	sd	\N	\N	\N	\N	\N	\N	\N	\N	\N
cb7bd9fa-bbd4-497c-bd7a-2ad93e4a187f	d68ea890-c80f-4dbf-8a89-aa534006758a	presuntivo	2026-05-30	jherald se la comes ga	\N	\N	\N	\N	\N	\N	\N	\N	\N
036837eb-5dd9-4cec-a1dc-9a2256b41702	d68ea890-c80f-4dbf-8a89-aa534006758a	presuntivo	2026-05-30	jherald se la comes ga confirmo	\N	\N	\N	\N	\N	\N	\N	\N	\N
9efb645d-a6ca-4750-aff2-2ebc96053aa7	4a766208-4cc4-481f-94f6-2f2adb2cc655	presuntivo	2026-05-30	Ga	\N	\N	\N	\N	\N	\N	\N	\N	\N
eff09bf6-e508-4ced-bbd0-48c3b36044ad	e144b73c-e19b-4457-a1c9-7d8635488602	presuntivo	2026-05-30	asd	\N	\N	\N	\N	\N	\N	\N	\N	\N
c2e01aaa-bc19-44c4-9b99-e23b3b234029	e144b73c-e19b-4457-a1c9-7d8635488602	presuntivo	2026-05-30	asd prueba 1	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: empleados; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.empleados (id_empleado, nombre, departamento, salario, fecha_ingreso) FROM stdin;
1	Ana	Ventas	2200.00	2025-10-29
2	Luis	Ventas	2700.00	2025-10-29
3	María	TI	3500.00	2025-10-29
4	Carlos	TI	4000.00	2025-10-29
5	Lucía	RRHH	2800.00	2025-10-29
6	Pedro	RRHH	2600.00	2025-10-29
\.


--
-- Data for Name: enfermedad_actual; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enfermedad_actual (id_enfermedad_actual, id_historia, sintoma_principal, tiempo_enfermedad, forma_inicio, curso, relato, tratamiento_prev) FROM stdin;
534c0e00-974f-4ff9-aa39-bf45c96a3202	8c6ef290-5b69-4b8f-ba56-8f77c37ea1ca	nose	dico	asd	asd	asd	asd
6bfef85c-e2d8-403b-b493-cd36de0c9007	2b7201a9-c69b-4ab3-be15-a3dfc2f5e0ab	adasdad					
77904539-2da9-485e-bafa-fe391f060003	\N	\N	\N	\N	\N	\N	\N
131e48d3-7f3d-4da4-89e6-3cef9b3b6628	\N	\N	\N	\N	\N	\N	\N
d257180f-b500-443f-b452-5289552d4d69	\N	\N	\N	\N	\N	\N	\N
5ecfa8c1-b553-48c5-a460-bd93e18417a6	\N	\N	\N	\N	\N	\N	\N
cf3e1750-978e-40ae-ba4b-00835b620faf	\N	\N	\N	\N	\N	\N	\N
51fd93b9-419a-4db6-8dc9-9866fc3a1f54	\N	\N	\N	\N	\N	\N	\N
1254c3e8-bfc5-4e4a-a362-29a2a1cd1d19	\N	\N	\N	\N	\N	\N	\N
c0c54aef-7c34-4afc-8859-2d6706f43232	\N	\N	\N	\N	\N	\N	\N
5a72f6ec-5f72-439e-844c-3427d77cd7fe	\N	\N	\N	\N	\N	\N	\N
c1c87901-6b4b-4533-8f6f-ceba914fad0e	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	Dokfhf					
32bb45f8-6295-4086-92d8-96efc2edcff6	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	Gripe					
15a86904-1d64-4f08-bce4-6591f161ec5e	252be430-3271-487d-b24d-4f57d578f225	Dolor	2 dias	Inicio	En curso	Malestar y dolor	Endodoncia
c966cd49-ffbe-47be-8734-cb7c1b66c38b	4130ff39-c736-41f1-9c7f-3d0a798d404d	asd	asd	asd	asd	asd	asd
76f9f635-a99e-45a4-aa96-3672e8705de8	2ff6d047-c7a1-4cf4-963c-c8558b6c572b	tengo gripe	asd	asd1q32e	asdasdas	asdaasfasdgADSA	ASDFAETGSFDGSD
d07a2eb6-0d2e-488f-81aa-3821bd12af90	b8cce2c5-c775-4074-89a7-835a35b3dd98	tengo gripe	asdasd	asdasd	asdasd	asdasd	asdasd
e515c41b-a472-4343-94f1-b211e0887380	d394fbcf-cc84-4c90-9f13-a458aec92e66					adsada	
84dabbd4-77e1-4cca-abd6-b14403f946e0	95cf32b6-c707-423f-b26e-2cb4893c26c7					a	
2dc1f18a-11aa-43e7-a2f0-0734e2cb9b34	84974bdc-0d6f-478a-a4df-1310e1a71ea0	dasda	asdasd	asdasd			
ba4b5820-a92d-46c4-9c5f-30fabe7e893b	bea73607-a9cc-462f-b14f-bedb4d503e6d	Fiebre y tos	4 días	Brusco	Progresivo	Paciente refiere fiebre alta, malestar general y tos seca.	Paracetamol y jarabe
0989bb3f-f348-4c52-9fff-f8b94802ec4d	90d29073-ed9b-41d5-89ad-16f716d6c27b	asdasd	asdasd	asdas	\N	\N	\N
\.


--
-- Data for Name: epb; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.epb (id_epb, id_historia, fecha, valores, codigo_max, id_usuario, created_at) FROM stdin;
\.


--
-- Data for Name: equipo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.equipo (id_equipo, nombre, descripcion, codigo, estado) FROM stdin;
\.


--
-- Data for Name: evolucion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evolucion (id_evolucion, id_historia, fecha, actividad, alumno, observaciones) FROM stdin;
e1b9bd11-9674-423b-8d6a-eea9309cf9a4	948b53d6-f8b4-41d6-bc70-2c475368c755	2025-12-02	prueba	Alexis	\N
88477efb-0acb-4fa3-b78c-4c3452537b20	a964ba24-1c04-4f1d-b3c3-23264e8a0530	2025-12-03	nose	Alexis	\N
cb37f526-2b11-4b7a-97c8-e16fd30d44b5	ddce1c78-a0f9-4e01-942e-554dae5a9c8d	2025-12-03	nose	Alexis	\N
4c751c95-1ab1-4dea-a510-9f314e0716eb	67db7e4c-180d-4574-b876-b9aed9b2a756	2025-12-02	gaa	Edgar Leyva	\N
c8228a0e-6b3f-420e-a864-ed28bf8fcd3e	b5ba4cd9-a25a-4345-b5bf-00323aa836f7	2025-12-03	Aea	Edgar	\N
82b47b7c-931e-4a7f-b98e-414f8f4c8642	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	2025-12-03	Limpieza 	Eduardo 	\N
577e6e7e-a35c-4f15-98d3-a73c0b247d98	6014e80b-078a-4844-91d9-060aa2824610	2025-12-04	Endodoncia	Daniel Llanos	\N
9689d87f-a26a-40b6-9943-6c502bce3105	99274e1f-dd4b-4364-9113-aa65f848a921	2025-12-04	h	jj	\N
174918ad-571c-4aca-acbe-9f5bd87af96b	948b53d6-f8b4-41d6-bc70-2c475368c755	2025-12-04	e	Erik	\N
b975a44d-191c-4e32-a781-1fdb79d9bea8	948b53d6-f8b4-41d6-bc70-2c475368c755	2025-12-04	cambios	yanfri	\N
ad0d8ee0-987c-4216-8230-16a3cdb9529c	948b53d6-f8b4-41d6-bc70-2c475368c755	2025-12-14	prueba2	Erik	\N
777945e0-4df8-41e3-a841-363a95986569	b2328e31-85a7-4261-b092-9cf4b0dbeca7	2025-12-14	Si	e	\N
202c8b66-ad88-45df-9786-2c6eebe29459	c2a65d57-c67c-4cf2-ad37-c81fa85319bc	2025-12-15	prueba	ERik	\N
a93f6ded-8497-4486-8d6d-720fc62c30c0	b5ba4cd9-a25a-4345-b5bf-00323aa836f7	2025-12-16	Limpieza	Silvia	\N
17a8fed7-853b-4b21-abb0-814eb74a5a34	95cf32b6-c707-423f-b26e-2cb4893c26c7	2026-05-27	asdasdas	asdasd	\N
5075f6e1-a831-489e-bca6-84201ea8e095	90d29073-ed9b-41d5-89ad-16f716d6c27b	2026-05-28	asdasd	asdasdasd	\N
cfe53171-0651-4b8d-a99b-1d5b1ecdb2a4	dacf98a8-099d-41a7-9b1c-f54121ab9fcd	2026-05-28	asdasdasda	asdasd	\N
0dea1329-3c7f-4ac9-9e1f-679df4f77348	90d29073-ed9b-41d5-89ad-16f716d6c27b	2026-05-28	asdasda	asdasd	\N
c50f201b-30b8-4e48-9a4a-5b76a6d83ce5	90d29073-ed9b-41d5-89ad-16f716d6c27b	2026-05-28	asdas	dasdasd	\N
6aaca78e-951f-4dd2-8993-327bfdd2945d	e144b73c-e19b-4457-a1c9-7d8635488602	2026-05-30	Esto es una prueba	JAvier	\N
\.


--
-- Data for Name: examen_auxiliar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.examen_auxiliar (id_examen_auxiliar, id_historia, id_examen, detalle, fecha_solicitud) FROM stdin;
\.


--
-- Data for Name: examen_clinico_boca; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.examen_clinico_boca (id_boca, id_historia, labios_sin_lesiones, labios_con_lesiones, vestibulo_sin_lesiones, vestibulo_con_lesiones, carrillos_retromolar_sin_lesiones, carrillos_retromolar_con_lesiones, paladar_sin_lesiones, paladar_con_lesiones, orofaringe_sin_lesiones, orofaringe_con_lesiones, piso_boca_sin_lesiones, piso_boca_con_lesiones, lengua_sin_lesiones, lengua_con_lesiones, encia_sin_lesiones, encia_con_lesiones, oclusion_molar_der, oclusion_molar_izq, oclusion_canina_der, oclusion_canina_izq, oclusion_mordida_cruzada, oclusion_vestibuloclusion, oclusion_overbite, oclusion_mordida_abierta, oclusion_sobremordida, oclusion_relacion_vertical_otros, oclusion_overjet, oclusion_protrusion, oclusion_guia_incisiva, oclusion_contacto_posterior, lat_der_guia_canina, lat_der_funcion_grupo, lat_der_contacto_balance, lat_der_describa, lat_izq_guia_canina, lat_izq_funcion_grupo, lat_izq_contacto_balance, lat_izq_describa) FROM stdin;
a26a9328-ea5d-4686-a32c-ee35c81ef264	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	Agrietados 	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Clase I	\N	Clase I	\N	Unilateral	\N	\N	Sí	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	t	\N	\N	\N
c0d83273-1699-4db4-957a-3237e6994ef6	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	Si	\N	\N	\N	\N	No	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	f	\N	\N	\N
dd15ca20-454f-4e90-babd-6cf3aa58e822	2ff6d047-c7a1-4cf4-963c-c8558b6c572b	asdasd	asdasd	asd	asdasd	asd	asdasd	asd	ad	asd	asd	asd	asd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
96ce9ccf-4dd9-435d-855f-1e0c07926f53	a964ba24-1c04-4f1d-b3c3-23264e8a0530	normal	\N	normal	\N	normal	\N	normal	\N	normal	\N	normal	\N	normal	\N	normal	\N	Clase I	Clase I	Clase I	Clase I	Sí	t	20.0	Sí	t	a	20.0	t	t	no	t	t	t	a	t	t	t	a
2cd912ae-f8e4-4492-9cb8-0097b25a5ed7	4cc2fe5c-337e-4439-b349-77e0127542f5	\N	<zx<zx	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
092cb83d-f90e-4416-92d1-6ff62175f0a7	95cf32b6-c707-423f-b26e-2cb4893c26c7	asdasd	asdasd	asda	asasd	asdasd	asdas	asd	asdasd	asdasd	asdasd	asdasd	asdasd	asdadasd	asdasd	\N	\N	Clase III	Clase I	Clase III	Clase II	\N	\N	\N	\N	\N	\N	1.0	\N	\N	asdas	\N	t	\N	\N	t	t	t	\N
b07c6dac-4662-438e-90fd-419ed7524262	90d29073-ed9b-41d5-89ad-16f716d6c27b	asasd	asdasd	\N	asdad	asdasd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	t	t	\N
\.


--
-- Data for Name: examen_general; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.examen_general (id_examen, id_historia, posicion, actitud, deambulacion, facies, facies_obs, conciencia, constitucion, estado_nutritivo, temperatura, presion_arterial, frecuencia_respiratoria, pulso, peso, talla, piel_color, piel_humedad, piel_lesiones, piel_lesiones_obs, piel_anexos, piel_anexos_obs, tcs_distribucion, tcs_distribucion_obs, tcs_cantidad, ganglios, ganglios_obs) FROM stdin;
6998810a-1a0d-4c9c-800e-fcd91a04fbc8	9258696e-35bc-4c67-92ab-551a9ea88d4c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Presentes	\N	\N	\N	\N	\N	\N	\N	\N
767bf392-4269-4ca3-9dc4-545b85ad5b29	67db7e4c-180d-4574-b876-b9aed9b2a756	De cúbito	Activa	Disbásica	No característica	\N	Burro	Asténico	Adecuado	78	\N	\N	\N	70.00	170.00	negro	Conservada	Presentes	soy kbro	Sin Alteraciones	\N	Adecuada	\N	Abundante	No palpables	\N
f2767fcb-31a2-4140-ab87-4bceac764ca5	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	Sentado	\N	Disbásica	\N	\N	G	\N	\N	18c	\N	\N	\N	\N	\N	Mestizo 	\N	Ausentes	\N	\N	\N	\N	\N	\N	\N	\N
42f43ced-4059-4a48-8701-39b07910d76e	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	\N	Activa	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Conservada	Ausentes	\N	\N	\N	\N	\N	\N	\N	\N
fe3f568d-9cf1-43ee-9fc6-0ebd8b7aeb49	4a766208-4cc4-481f-94f6-2f2adb2cc655	Pie	\N	\N	\N	\N	Hdhdhd\n	Pícnico	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
51a0046c-8834-47c6-b7a3-ba1f2aafa40b	4130ff39-c736-41f1-9c7f-3d0a798d404d	Pie	Activa	Abásica	No característica	\N	asd	Pícnico	Adecuado	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8bc35ff2-68ec-4c17-85eb-b4ee7b88bb88	2ff6d047-c7a1-4cf4-963c-c8558b6c572b	\N	\N	\N	\N	\N	asdasdasd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
de8f9c37-e24d-4fc7-8672-c4e99cb0c57c	948b53d6-f8b4-41d6-bc70-2c475368c755	Sentado	Activa	Disbásica	No característica	\N	ddasd	Pícnico	Adecuado	70	70	70	70	70.00	175.00	Marron	Conservada	Ausentes	\N	Sin Alteraciones	\N	Adecuada	\N	Regular	No palpables	\N
1724530b-316a-4c56-bc5b-24c331ffce40	4cc2fe5c-337e-4439-b349-77e0127542f5	\N	\N	\N	No característica	\N	\N	\N	No adecuado	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
ffb2abab-6c58-4df1-8873-f6b77b274c97	\N	Sentado	\N	\N	\N	\N	\N	\N	\N	fdfsdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	Alterados	asdasd	\N	\N	\N	\N	\N
046b010e-e674-4405-8d48-a433f82fddae	95cf32b6-c707-423f-b26e-2cb4893c26c7	De cúbito	Pasiva	Disbásica	No característica	\N	asdasd	Normotipo	\N	\N	\N	\N	\N	2.00	3.00	asdasd	\N	Presentes	asdasd	Alterados	asads	\N	\N	Abundante	Palpables	asdas
\.


--
-- Data for Name: examen_higiene_oral; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.examen_higiene_oral (id_higiene, id_historia, estado_higiene, fecha_registro) FROM stdin;
da8fdc3d-a1d4-4858-ba85-5d3a5520a6ec	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	Regular	2025-12-03 17:46:50.403903
d662845e-1352-4a6e-ab23-e87d56c6c70c	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	Regular	2025-12-03 17:48:15.934998
446ad1e7-464c-4695-88d6-b077bf7b3259	67db7e4c-180d-4574-b876-b9aed9b2a756	Bueno	2025-12-03 17:50:10.014733
ababb938-62a8-45a0-8349-995a3e3ad61e	ddce1c78-a0f9-4e01-942e-554dae5a9c8d	Regular	2025-12-04 00:46:34.331892
ffc3e110-e33f-48cf-ad17-e602bd1c5315	2ff6d047-c7a1-4cf4-963c-c8558b6c572b	Bueno	2025-12-04 00:58:17.798511
fdac3dfd-f403-44b0-8155-60291804abef	948b53d6-f8b4-41d6-bc70-2c475368c755	Deficiente	2025-12-04 06:38:52.096298
15aaf63f-fbc6-4a3e-9129-2990db8fa283	eb3fa563-e3ee-4304-bcef-0ff390505ff7	Regular	2025-12-04 14:35:31.845939
6e63dfe4-aacb-4631-a8d3-95b9bad848eb	b2328e31-85a7-4261-b092-9cf4b0dbeca7	Regular	2025-12-14 03:39:48.583653
b6db83c6-923f-4b25-bd24-78f873c0f165	c2a65d57-c67c-4cf2-ad37-c81fa85319bc	Regular	2025-12-15 23:52:38.014
35500f62-e84b-48b0-888c-ec76e7f6fd27	4cc2fe5c-337e-4439-b349-77e0127542f5	Regular	2026-05-26 17:45:15.894132
bb145a35-3129-4352-bc2b-25a55e0b7b75	95cf32b6-c707-423f-b26e-2cb4893c26c7	Deficiente	2026-05-27 16:55:38.664685
4e1bafcc-9c10-4835-a6b9-37bcd5aafebf	4a766208-4cc4-481f-94f6-2f2adb2cc655	Deficiente	2026-05-27 17:04:45.503313
e4fa4079-b26f-4ff1-bf99-23cd3b2c6a13	90d29073-ed9b-41d5-89ad-16f716d6c27b	Deficiente	2026-05-28 03:33:07.669572
aebbf4c0-4f80-4976-a81a-65c9e8bd8d1c	8ac0fca4-4b92-407d-ab8a-d45cea4ebe32	Deficiente	2026-05-28 14:37:41.088323
71df5e18-d35f-4c43-8331-e210dac7b756	e144b73c-e19b-4457-a1c9-7d8635488602	Regular	2026-05-30 22:40:26.743758
\.


--
-- Data for Name: examen_regional; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.examen_regional (id_regional, id_historia, cabeza_posicion, cabeza_movimientos, cabeza_movimientos_obs, craneo_tamano, craneo_forma, cara_forma_frente, cara_forma_perfil, ojos_cejas_adecuada, ojos_implantacion_obs, ojos_escleroticas, ojos_agudeza_visual, ojos_iris_color, ojos_arco_senil, nariz_forma, nariz_permeables, nariz_secreciones, nariz_senos_dolorosos, oidos_anomalias_morfologicas, oidos_anomalias_obs, oidos_secreciones, oidos_audicion_conservada, atm_trayectoria, atm_lat_izq_dolor, atm_lat_izq_ruido, atm_lat_izq_salto, atm_lat_der_dolor, atm_lat_der_ruido, atm_lat_der_salto, atm_prot_dolor, atm_prot_ruido, atm_prot_salto, atm_aper_dolor, atm_aper_ruido, atm_aper_salto, atm_cierre_dolor, atm_cierre_ruido, atm_cierre_salto, atm_coordinacion_condilar, atm_apertura_maxima_mm, atm_observaciones, atm_musculos_dolor, atm_musculos_dolor_grado, atm_musculos_dolor_zona, cuello_simetrico, cuello_simetrico_obs, cuello_movilidad_conservada, cuello_movilidad_obs, laringe_alineada, laringe_alineada_obs, cuello_otros) FROM stdin;
52435551-6199-4bbe-9c21-e798b46fdacc	9258696e-35bc-4c67-92ab-551a9ea88d4c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
bcf596a2-5c8a-4c31-a2c0-d000f53df3ab	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	Deflexión	Temblor	\N	\N	Dolicocéfalo	Mesofacial	\N	\N	\N	Limpias	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	\N	\N	\N	\N
810280ff-f293-468d-9026-d807fe00f07b	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	f	\N	\N	f	\N	\N	f	\N	\N	f	\N	\N	f	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
6b682d4f-9ac6-4383-b4c4-ac672171ebce	4130ff39-c736-41f1-9c7f-3d0a798d404d	Erecta	Tic	\N	Microcéfalo	\N	Braquifacial	Recto	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
c7e7b2d2-89b0-406e-ae1f-bcf055fdcba7	2ff6d047-c7a1-4cf4-963c-c8558b6c572b	Deflexión	\N	\N	\N	\N	Braquifacial	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
f761c9da-b80a-4b7c-b27f-dd4382f9ca74	b2328e31-85a7-4261-b092-9cf4b0dbeca7	Erecta	Tic	\N	Mesaticéfalo	Braquicéfalo	Braquifacial	Recto	t	\N	Limpias	t	a	\N	a	t	t	t	\N	\N	\N	\N	\N	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	\N	20.00	a	f	\N	\N	t	\N	t	\N	t	\N	a
d02efa22-a907-4e78-9c94-0aef025814ad	948b53d6-f8b4-41d6-bc70-2c475368c755	Erecta	Temblor	\N	Mesaticéfalo	Braquicéfalo	Braquifacial	Recto	t	\N	Limpias	t	\N	t	nose	t	t	t	f	\N	t	t	Recta	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	t	20.00	gaaaa	f	\N	\N	t	\N	t	\N	t	\N	aaaa
a337d3e4-f46e-4912-9f9d-ca776502b7d2	4cc2fe5c-337e-4439-b349-77e0127542f5	\N	Temblor	\N	\N	\N	\N	\N	\N	\N	Pigmentadas	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
54c5377c-5b5a-479d-b4c9-efecd8dd4bfc	95cf32b6-c707-423f-b26e-2cb4893c26c7	Deflexión	Temblor	\N	Microcéfalo	\N	\N	\N	t	\N	Limpias	\N	hola	\N	asdsad	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	t	\N	\N	t	\N	\N	\N	\N	\N	22.00	dasd	\N	\N	\N	\N	\N	\N	\N	\N	\N	asdasd
e1a686ab-ed6c-42c8-87c0-04402ec66ce8	8ac0fca4-4b92-407d-ab8a-d45cea4ebe32	Deflexión	\N	\N	\N	\N	\N	Convexo	\N	\N	Pigmentadas	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: ficha_evaluacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ficha_evaluacion (id_evaluacion, id_ficha, id_historia, puntaje_total, comentarios, estado, id_docente, fecha_evaluacion) FROM stdin;
79c7852a-f5a4-40f8-85ef-7b1a4edb2e2b	f796631b-7e36-44b4-b4ce-da0d34362b2e	e144b73c-e19b-4457-a1c9-7d8635488602	77.00	AAAAAAAAAAAAAAAAAAAAA	validado	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-31 12:59:31.03955+00
\.


--
-- Data for Name: ficha_operacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ficha_operacion (id_ficha, id_historia, diagnostico, procedimiento, materiales, observaciones, estado, fecha, alumno, id_usuario, created_at, updated_at) FROM stdin;
f796631b-7e36-44b4-b4ce-da0d34362b2e	e144b73c-e19b-4457-a1c9-7d8635488602	asdasdasd asdasdasd	asdasdasdasdasd asdasdas	asdasdasdsadasd	DDeqwwwdedede trtteqerdqwe sdqw we	borrador	2026-05-30	asdasdadasdasdsa	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-30 22:39:10.390003+00	2026-05-30 22:39:10.390003+00
2835f699-62de-4573-93b5-59f5cadda58a	275bf20f-a25d-4f5d-a3c2-d853c297e1ed	asdasdasd	asdasdasd	asdasdasd	asdasdasdasdasdas	borrador	2026-06-02	asdasdasdasdas	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-06-02 20:33:46.719794+00	2026-06-02 20:33:46.719794+00
\.


--
-- Data for Name: ficha_operacion_auditoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ficha_operacion_auditoria (id, id_ficha, campo, valor_anterior, valor_nuevo, id_usuario, fecha) FROM stdin;
\.


--
-- Data for Name: filiacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.filiacion (id_filiacion, id_historia, raza, fecha_nacimiento, lugar, estado_civil, nombre_conyuge, ocupacion, lugar_procedencia, tiempo_residencia_tacna, direccion, ultima_visita_dentista, motivo_visita_dentista, ultima_visita_medico, motivo_visita_medico, contacto_emergencia, telefono_emergencia, acompaniante, edad, sexo, fecha_elaboracion) FROM stdin;
09849fe1-4299-44c0-8a35-7f3352a74bf9	9258696e-35bc-4c67-92ab-551a9ea88d4c	Mestizo	1985-03-15	Lima, Perú	\N	María Luisa García Fernández	\N	Lima	5 años	Av. Bolognesi 1234, Tacna	2024-06-15	Limpieza dental y chequeo general	2024-08-20	Control anual de salud	María Luisa García - Esposa	987654321	Solo	\N	\N	\N
f2f8893c-e71d-4e2b-8fee-87ca35f3fa29	99274e1f-dd4b-4364-9113-aa65f848a921	Mestiza	1990-04-12	Arequipa, Perú	\N	\N	\N	Arequipa	2 años	Calle San Martín 567, Tacna	2023-12-10	Dolor de muela	2024-09-05	Chequeo ginecológico	Rosa García - Madre	987654346	Su madre	\N	\N	\N
4d7f7ceb-b62c-4a3d-964a-6aeb83a1ff54	64689e70-f3d0-4b10-ab9e-2889659a7617	Andino	1988-11-30	Puno, Perú	\N	Patricia Torres Silva	\N	Puno	10 años	Jr. Zela 890, Tacna	2022-03-20	Extracción de muela del juicio	2024-07-15	Dolor de espalda	Patricia Torres - Conviviente	987654323	Su conviviente	\N	\N	\N
20239e55-0415-410b-a972-d933fa79789f	e1616800-f790-4058-8c40-8c62f1b6afcd	Mestiza	1985-08-25	Cusco, Perú	\N	\N	\N	Cusco	3 años	Av. Pinto 456, Tacna	2024-01-10	Blanqueamiento dental	2024-05-12	Control de presión arterial	Luis Rodríguez - Hermano	987654322	Su hija	\N	\N	\N
ab40e1c1-3b16-449a-afa3-7b0e045e35c7	87456da2-d67b-4d1d-84a1-46bbb4f15c82	Mestizo	1992-05-18	Tacna, Perú	\N	\N	\N	Tacna	Toda la vida	Calle Apurímac 234, Tacna	2023-11-20	Caries dental	2024-02-14	Gripe común	Rosa Vargas - Madre	987654324	Solo	\N	\N	\N
351d82cb-a625-4e83-bb28-6b1400687502	a2c3e656-200a-4728-bad9-0ac090f74e6a	Andino	1995-01-12	Puno, Perú	\N	Carmen Rosa Mamani Quispe	\N	Puno	7 años	Av. Circunvalación 789, Tacna	2024-02-20	Implante dental	2024-06-10	Examen médico laboral	Carmen Mamani - Esposa	987654348	Solo	\N	\N	\N
bfd064f6-36bc-4d23-9e1e-81d5983ea4b9	2fe49c51-51a7-494b-aa90-173b0d51ac93	Mestiza	1988-06-15	Moquegua, Perú	\N	\N	\N	Moquegua	4 años	Calle Coronel Vidal 345, Tacna	2024-07-08	Endodoncia	2024-08-22	Control de diabetes	Laura Silva - Hermana	987654349	Su hijo	\N	\N	\N
2002c43c-6d60-4ef5-a043-a3eef3665daa	2097b94d-eed1-4295-8282-da35cf800f08	Andino	1989-04-08	Tacna, Perú	\N	Gabriela Apaza Nina	\N	Tacna	Toda la vida	Pasaje Los Andes 123, Tacna	2023-09-15	Prótesis dental	2024-04-30	Lesión deportiva	Gabriela Apaza - Conviviente	987654352	Su conviviente	\N	\N	\N
db960eb0-64f8-4bcd-999c-d653bb2341f6	7eef970b-7493-4fa2-b223-2f6a234c8818	Mestiza	1995-02-20	Lima, Perú	\N	\N	\N	Lima	1 año	Calle Arias Aragüez 678, Tacna	2024-05-25	Limpieza y fluorización	2024-09-10	Chequeo anual preventivo	Rosa Flores - Madre	987654325	Sola	\N	\N	\N
86a0277a-80d8-4c3b-9177-a05525001b57	f2da5079-c04d-40e7-a0a9-4dfa87950b16	Mestizo	\N	Tacna	\N		\N	Tacna		Av. Bolognesi 123	2025-11-12	Caries	\N	\N				\N	\N	\N
3b53b764-bcfa-44d5-a6a3-4dce5f407fa7	2bd3dfef-af95-450b-b6bd-3b05555d9b6e	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
fcc9eebc-d6bb-41ee-8c0b-7821e3978c2d	e222b37a-52d9-45a3-83b1-e08c3ae6d4d4	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
98552e01-b6f1-4ec5-9dd3-3389c08f4f52	07e6a608-09e6-4586-a387-a0d941f1a495	NEGRO	2025-10-30	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
25c56b22-62ff-4b29-9e5e-59125e6765e7	eb3fa563-e3ee-4304-bcef-0ff390505ff7	prubeanegro	\N	\N	\N	\N	\N	\N	5 años	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
8c2c30e8-b99c-413e-931c-2e3d952b062b	ddce1c78-a0f9-4e01-942e-554dae5a9c8d	\N	\N	\N	\N	asdgdf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
14621cd5-78c3-4b20-aad0-2fe5fc85bfee	948b53d6-f8b4-41d6-bc70-2c475368c755	Mestizo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N
cc7f4d5d-33cd-47d2-9c73-f3a2f00c68c5	74c4c00e-5751-40fa-896f-c4bf4158d7a0	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	1290	Masculino	\N
97843428-4bda-4ba6-85b1-e473ec088fcc	4fb81fb6-f288-46e4-9b2c-77c2e90c8b73	Mestizo	2005-08-01	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2039	Masculino	\N
0b8c22d3-b014-44d9-8bb7-7c430e9487a3	2311507c-c414-44c2-8d7f-73543700c763	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	Masculino	\N
3cdfa2fb-a861-4353-9438-885ef248b8a2	d6f4a75f-f634-477d-96c8-2365fd5aafad	Negro	2005-08-01	\N	\N	\N	\N	\N	5años	\N	\N	\N	\N	\N	\N	\N	\N	18	Masculino	\N
af67230d-afe9-4e0a-94be-363c3b3b08d7	11ef53c5-e6eb-4dcb-9110-6ef3717682c8	mes	2005-08-01	\N	\N	asd	\N	asd	asd3	ta	2020-02-01	noe	2020-03-20	asd	asdad	234234234	adasdad	20	Masculino	2022-03-20
b9f61d45-8d0a-41f9-bd59-e3d065696076	e03fc2a3-e8e5-4d78-9171-54f0ed673063	PASD	2005-08-01	\N	Soltero	asd	asd	sdasd	tas3	asdad	2005-02-01	nose	2005-03-20	nose	sdfsdf	23234	fdfsdfsd	18	Masculino	\N
3377064a-8061-408f-b673-0cdb23733683	e09b86b4-aefe-49d6-aa7b-25e695b798d5	\N	\N	\N	Casado	\N	Independiente	\N	5 años	martorell n°500	2025-11-05	carie	\N	\N	\N	\N	\N	35	Masculino	\N
35729490-4dab-4caf-a948-d1f73c66fcdf	89271933-09c6-4caf-8113-81cdf35279fd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21	Masculino	\N
3085e5ff-14c2-4404-91c9-9f04298d1a49	5bfed192-9e05-4352-b71b-a0cdcad0182a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	21	Femenino	\N
3728f580-a1f2-43cf-952e-9bc6230de9fe	95aaa96e-c8c0-40ff-91cf-a2d9b7f6c696	NOSE	2007-02-12	\N	\N	\N	vago	tacna	\N	\N	\N	\N	\N	\N	\N	\N	su madre	17	Masculino	2005-08-01
1baf8e50-dfac-4cfe-b282-c57965ede35b	8c6ef290-5b69-4b8f-ba56-8f77c37ea1ca	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	12	asd	\N
de99b352-5267-417a-ac45-72c9a1d40d35	072f9bb6-c482-4bc5-8928-91d35badf3d8	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	maculino	\N
0f5874d4-ef87-4e48-8130-599d3ede3db5	85a72809-1b96-4432-8a49-209890a7d701	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	maculino	\N
10fb785b-ad14-461d-bbb0-2eab6a45d3ba	4e7c9d9d-efba-4291-9527-6cf6ee9201a0	Mestizo	2005-01-01	\N	Casado	Maria	Ing	Tacna	5 anhos	Tacna	2005-08-01	a	2005-08-01	a	josea`	91892892	hola	18	Masculino	\N
a1b85457-bdcd-456b-9aa9-db6c6728e238	2b7201a9-c69b-4ab3-be15-a3dfc2f5e0ab	Mestizo	2005-08-01	\N	asd	sd	asd	asd	asd	asd	2005-03-12	asdasf	2005-03-12	asdgafas	asdasda	23121412	sfsdgsg	44	Masculino	2005-01-01
170eddb6-4f49-48f8-9cd6-0f3708b2de76	b5656cc5-4fa7-48aa-9ea3-c5915a019830	Negr	2005-08-10	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	Mas	\N
eb50b849-e365-46de-a71d-2f4a9259f655	35eab03f-228b-4cc4-a923-cdf1096acd19	Mestizo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19	Masculino	\N
b1d13b25-d58a-45b4-8a3a-27ec98618855	2f0bb31b-b64d-4678-a3da-a13a2b504168	Mestizo	2005-10-10	\N	Soltero	\N	Ingeniero	Tacna	5años	Tacna	2025-10-10	\N	0025-10-10	dentista	Jherald	994512785	Edgar	20	Masculino	2025-02-21
5850d53d-311a-4be0-bc54-1e8a11d4fbb7	e70f5647-b77c-45d6-a812-e3ced873dd62	Mestizo	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	123	Masculino	\N
52ba3941-1f1c-4a51-b20f-5cdb87b7c97f	4130ff39-c736-41f1-9c7f-3d0a798d404d	Mestizo	2004-08-01	\N	Soltero	asd	Desempleado/a	asd	asd	asd	2022-02-01	mse	2022-02-01	nose	asdasd	123123123	nose	20	Masculino	2022-02-01
0277d575-94ee-42b9-b75b-3856f14e1659	2ff6d047-c7a1-4cf4-963c-c8558b6c572b	ASDASD	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19	Masculino	\N
57e08d07-3e55-4790-9e0e-997e491d4e5c	e144b73c-e19b-4457-a1c9-7d8635488602	Mestizo	1990-01-01	Tacna	\N	\N	\N	Tacna	10 años	Av. Ejemplo 123	2023-01-01	Control	2023-06-01	Chequeo	Juan Perez	999999999	Maria Lopez	\N	\N	\N
580032b6-6af3-4143-8429-fea2017f8d90	b8cce2c5-c775-4074-89a7-835a35b3dd98	Mestizo	\N	\N	\N	ad	\N	asd	\N	\N	\N	\N	\N	\N	\N	\N	\N	123123	Femenino	\N
a981a337-5740-41da-9e82-6259f2089959	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	Tacñeño	1966-12-03	\N	Conviviente	\N	Jubilado/a	\N	5 mese	Mártir 345	\N	\N	\N	\N	\N	\N	De aqui	23	Femenino	2025-10-10
5545ad01-c92c-4918-8945-0df962d3e78f	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	37	Femenino	\N
589938e4-a226-4fc8-a680-b69d9ac9ef83	a964ba24-1c04-4f1d-b3c3-23264e8a0530	negro	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	Masculino	\N
6a2c4704-d6fc-432f-adfb-214ef4ddf316	d394fbcf-cc84-4c90-9f13-a458aec92e66	Mestizo	1990-01-01	Tacna	Casado	\N	Jubilado/a	Arequipa	5 años	Av. Ejemplo 123	2025-01-01	Control	2025-06-01	Chequeo	Juan Perez	999888777	Maria Lopez	35	Femenino	2025-12-01
f404aaa9-e197-4a61-8344-907c776dc436	252be430-3271-487d-b24d-4f57d578f225	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2025-12-03	\N	\N	\N	\N	36	Femenino	2025-12-03
aa22a608-8a27-4468-93f5-3f13be0648d1	287bb0a7-97dc-46eb-9e45-76d1a6c3dfab	\N	2025-12-14	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	Masculino	\N
429f1fed-9aaf-4f5c-a11e-a262da98a2ab	275bf20f-a25d-4f5d-a3c2-d853c297e1ed	Mestizo	1990-01-01	Tacna	\N	\N	\N	Tacna	10 años	Av. Ejemplo 123	2023-01-01	Control	2023-06-01	Chequeo	Juan Perez	999999999	Maria Lopez	\N	\N	\N
7f5616d3-5eb2-4da8-a468-907504c0b31e	b2328e31-85a7-4261-b092-9cf4b0dbeca7	\N	\N	\N	\N	sdasda	\N	apaaaas	5 años	\N	\N	\N	\N	\N	\N	\N	\N	16	Masculino	\N
927ce708-2072-4c6b-b527-dfcd5fc5730e	c2a65d57-c67c-4cf2-ad37-c81fa85319bc	mestizo	2025-12-15	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	Masculino	\N
f8718eec-0c37-44b3-9440-f0766722376b	67db7e4c-180d-4574-b876-b9aed9b2a756	Mestizo	1995-05-15	Tacna	Soltero	\N	Estudiante	\N	\N	Av. Bolognesi 123	\N	\N	\N	\N	jesus	999888777	daniel	23	Femenino	2025-12-02
65f22ba5-bc3d-49ef-a5a3-4edb18c95317	19125c29-5984-4d5b-9bc8-6ddf3c3deb53	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	Masculino	\N
42f0957d-83c5-44f4-836d-5a722a23ddb4	6014e80b-078a-4844-91d9-060aa2824610	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	22	Masculino	\N
9af79ba4-2858-42cd-9a9d-52fc833ab3e8	b5ba4cd9-a25a-4345-b5bf-00323aa836f7	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	19	Femenino	\N
778b71f8-ac9d-4120-9bb1-22f7e52701e9	3b212eec-33cd-4bb4-8147-24c062bdc42b	Mestizo	2000-12-03	\N	Soltero	\N	Empleado/a	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	20	Masculino	\N
61e234c4-2f2a-4f7f-a7f7-94a2bcecc3c2	4a766208-4cc4-481f-94f6-2f2adb2cc655	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	23	Masculino	\N
ac27b4e0-b8e2-4a17-a617-fa48791e0cd2	dacf98a8-099d-41a7-9b1c-f54121ab9fcd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2	Masculino	\N
e8414278-1824-41a5-814d-7b550d8dc0c9	4cc2fe5c-337e-4439-b349-77e0127542f5	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	18	Masculino	\N
395596ce-4ba2-4206-8984-3526ab62d944	eff908c3-ad3c-4807-8706-61988d104eb6	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	40	Femenino	\N
900b0bc0-1b6f-490c-8f31-b91fb5a1c99f	bea73607-a9cc-462f-b14f-bedb4d503e6d	Mestizo	1990-01-01	Tacna	\N	\N	\N	Tacna	10 años	Av. Ejemplo 123	2023-01-01	Control	2023-06-01	Chequeo	Juan Perez	999999999	Maria Lopez	\N	\N	\N
4963c7b3-d7f1-4e9d-b027-711be155c27c	95cf32b6-c707-423f-b26e-2cb4893c26c7	\N	2007-11-29	\N	\N	\N	\N	\N	B	\N	2025-10-08	\N	\N	\N	\N	\N	\N	32	Masculino	\N
6abc8cb6-c013-438e-a556-4bed68436963	911c4e3e-96ba-4582-8758-7317d1c50d7c	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	43	Masculino	\N
6de7eb48-1345-4379-befd-66fbab0b3c8c	90d29073-ed9b-41d5-89ad-16f716d6c27b	\N	1985-03-15	\N	\N	\N	Comerciante	\N	asdasd	\N	2025-11-27	\N	\N	\N	\N	\N	\N	2	Masculino	\N
\.


--
-- Data for Name: historia_clinica; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historia_clinica (id_historia, id_paciente, id_estudiante, fecha_elaboracion, ultima_modificacion, estado) FROM stdin;
9258696e-35bc-4c67-92ab-551a9ea88d4c	d5f53c17-5a8e-44f8-885a-de90fe04494b	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-10-28	2025-10-28 23:28:30.558598	en_proceso
99274e1f-dd4b-4364-9113-aa65f848a921	2070cd66-0a51-4f78-aa65-f23263161620	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	2025-10-28	2025-10-28 23:28:30.558598	en_proceso
64689e70-f3d0-4b10-ab9e-2889659a7617	1447103d-2745-4c04-8eaf-7252732e6510	d6f37f1a-f8ef-467a-b17f-5823603dd767	2025-10-28	2025-10-28 23:28:30.558598	en_proceso
e1616800-f790-4058-8c40-8c62f1b6afcd	b2f4bdbc-a6f2-4ab1-807f-d35169f1407b	a519fd27-825e-42dc-9ed0-95eacbdbb5e0	2025-10-28	2025-10-28 23:28:30.558598	completada
87456da2-d67b-4d1d-84a1-46bbb4f15c82	b44e8fcf-e547-484a-8cc4-e089e7b9bdc6	8fc76451-87b3-4ed6-83bb-b3db65842929	2025-10-28	2025-10-28 23:28:30.558598	en_proceso
bea73607-a9cc-462f-b14f-bedb4d503e6d	14df93a7-1abc-4530-9aad-d61121a08178	fcf4b66c-ac68-43b7-b314-f73d2555a0a5	2025-10-28	2025-10-28 23:28:30.558598	en_proceso
a2c3e656-200a-4728-bad9-0ac090f74e6a	63177808-655e-402e-9e9e-53a1e996321e	b8727ab2-4006-4a75-bf4a-bd7f9228288f	2025-10-28	2025-10-28 23:28:30.558598	completada
2fe49c51-51a7-494b-aa90-173b0d51ac93	f33a7fd5-c851-4a64-b1a4-3031b7ef6584	60edd6bc-3e3d-4873-a50b-d4a0d3195418	2025-10-28	2025-10-28 23:28:30.558598	en_proceso
2097b94d-eed1-4295-8282-da35cf800f08	a7a96307-b93b-40da-a297-f125826a5fc7	7c6b97f0-27bf-4ad2-af79-d42294e78fc9	2025-10-28	2025-10-28 23:28:30.558598	en_proceso
7eef970b-7493-4fa2-b223-2f6a234c8818	ba84bd10-a221-4cc6-bbce-107ad7f7aea0	936cb450-875a-4ca8-9807-ef4bddc2393e	2025-10-28	2025-10-28 23:28:30.558598	completada
e4ce3eef-714f-408a-afd6-9048ee802fbe	\N	49d91ec7-c505-4f00-b7c7-03f73ed50858	2025-11-04	2025-11-04 15:03:55.116902	borrador
f2da5079-c04d-40e7-a0a9-4dfa87950b16	c5b63f5f-3e63-4878-a8df-b3977202ba61	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-07	2025-11-22 07:18:28.341601	en_proceso
55ec9bfe-5644-4bdb-b0ba-3505146c3940	\N	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-22	2025-11-22 16:32:36.597898	borrador
2bd3dfef-af95-450b-b6bd-3b05555d9b6e	1d0eac31-d7cf-420a-bd37-e51c4cbc1ea2	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-10-29	2025-11-25 16:24:17.314542	en_proceso
e222b37a-52d9-45a3-83b1-e08c3ae6d4d4	5ad941c0-5847-4a1b-84cc-2b4655d8616c	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-25	2025-11-26 17:50:39.784057	en_proceso
b12e4740-4e84-41a0-b910-225b58484a24	8e17e9f4-1015-4f4d-9702-7fc2398c3234	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-26	2025-11-26 18:19:01.688616	en_proceso
fad097b8-8b44-4c2c-ac35-66fd43e62df6	\N	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-28	2025-11-28 07:35:06.459493	en_proceso
6eecb185-a562-4099-ad3e-5f6ace205f4d	\N	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-28	2025-11-28 07:39:34.480311	en_proceso
f32aad3c-f49a-40a2-940f-b2ba63041b67	\N	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-28	2025-11-28 07:39:49.317407	en_proceso
7bbc9038-fc89-4325-b87f-fcc508304a38	73633c68-8d46-41fe-90a6-d9cebd324b48	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-28	2025-11-28 07:58:19.926084	en_proceso
d457d451-89a8-4fa8-a333-358fcb086924	30f4f06e-bbc1-4e9f-88ab-a55bd1b47514	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-28	2025-11-28 08:05:38.559503	en_proceso
8498f507-711b-4d4e-89d1-96d530971519	b3a3acd0-43b4-4748-92bd-34472389f1de	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-28	2025-11-28 08:06:28.010757	en_proceso
07e6a608-09e6-4586-a387-a0d941f1a495	ea949932-b86f-422c-9620-ba5edafe7641	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-28	2025-11-28 18:38:40.192726	en_proceso
90d29073-ed9b-41d5-89ad-16f716d6c27b	452375b9-1ae1-41a0-9691-c236e23c5e3e	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-28	2025-11-28 08:13:59.477492	en_proceso
95cf32b6-c707-423f-b26e-2cb4893c26c7	ae2b376e-367e-4e99-ae89-8d1cacc204c7	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-29	2025-11-29 04:06:29.114088	en_proceso
87150c8b-be3b-4c36-a117-be03d26b94f4	\N	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-29	2025-11-29 04:58:08.761705	en_proceso
275bf20f-a25d-4f5d-a3c2-d853c297e1ed	\N	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-29	2025-11-29 04:58:27.666641	en_proceso
e144b73c-e19b-4457-a1c9-7d8635488602	\N	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-29	2025-11-29 05:32:02.047969	en_proceso
b4ec8abf-5a97-4c1f-8832-c684f4e012a9	\N	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	2025-11-29	2025-11-29 05:41:15.106076	en_proceso
65b74d6f-5910-4d47-95e3-005c40102ad4	\N	8fc76451-87b3-4ed6-83bb-b3db65842929	2025-11-29	2025-11-29 05:50:10.697522	en_proceso
a4378102-0089-46cf-b906-a1f28961b02a	\N	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-29	2025-11-29 06:18:36.747564	en_proceso
8807d591-92b2-4427-8719-5c278de2c547	\N	d6f37f1a-f8ef-467a-b17f-5823603dd767	2025-11-29	2025-11-29 06:23:08.89793	en_proceso
81737660-1d51-4f46-973f-71e2d07ae760	\N	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-29	2025-11-29 07:00:20.783036	en_proceso
87fb406e-61d9-4eee-82f0-a09a0a68cabc	\N	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-29	2025-11-29 07:53:09.73277	en_proceso
baba6703-b2aa-43b6-b25f-d9c60790e381	\N	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-29	2025-11-29 21:57:48.180366	en_proceso
2615cccb-6c4f-41a7-9aaf-6bbd6f3d6eca	\N	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-29	2025-11-29 22:04:40.004605	en_proceso
78c045ea-c929-4379-9fe9-49c709fa70ec	\N	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-29	2025-11-29 22:28:00.538835	en_proceso
c10af972-bdca-4232-b41b-a6ba5bbcaf73	\N	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-29	2025-11-29 22:30:00.539153	en_proceso
a964ba24-1c04-4f1d-b3c3-23264e8a0530	b4b9e480-8ce9-4971-be39-34d7e669a2b7	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-29	2025-11-29 22:41:01.962918	en_proceso
277fef10-27be-483d-898a-17d17b2cb180	\N	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-29	2025-11-29 23:17:52.357325	borrador
eb3fa563-e3ee-4304-bcef-0ff390505ff7	23863fa5-3f4d-4e38-9043-c6e18f2c7bf2	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-29	2025-11-29 23:19:46.047655	en_proceso
b2328e31-85a7-4261-b092-9cf4b0dbeca7	27346225-ed85-4823-9398-bd969c2da82a	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-30	2025-11-30 00:45:29.234907	en_proceso
ddce1c78-a0f9-4e01-942e-554dae5a9c8d	addbd4a0-80e2-40bb-99eb-1840f775dde2	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-30	2025-11-30 01:24:31.51431	en_proceso
948b53d6-f8b4-41d6-bc70-2c475368c755	2fd369e7-7d62-4140-9d52-c0dd302d5848	86f280cd-0629-4b17-93ab-fda897227fcf	2025-11-30	2025-11-30 01:49:11.779457	en_proceso
53d09878-e181-49a9-9eaf-394909687ce9	40d87d99-2512-4361-a491-7ab45b63b6ee	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 02:28:43.264654	en_proceso
309059b5-0cc2-4790-b6e2-a6ca127a729b	79c4c22c-f803-4f5e-adf6-e20fb4832590	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 02:44:32.089431	en_proceso
74c4c00e-5751-40fa-896f-c4bf4158d7a0	c21fd25f-7a6a-48f6-b170-3daa1739ea3f	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 02:51:07.088647	en_proceso
4fb81fb6-f288-46e4-9b2c-77c2e90c8b73	2e9ca220-6936-4319-8df5-db4ab073d05a	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 02:57:00.143285	en_proceso
812dc7c4-3450-4367-b8cc-81ef433c88c1	7a722e20-1328-4908-90cd-1d1925e21f0f	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 02:59:51.093815	en_proceso
2311507c-c414-44c2-8d7f-73543700c763	c4c21a46-81ee-45b3-b5a2-89cd5efd451f	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 03:19:32.635089	en_proceso
cc0b505e-98ca-4b2b-95dc-dbe7acbc0a7f	83089da5-791f-4335-9907-6980d2f37f98	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 03:50:32.269817	en_proceso
88f0967a-a4bf-4d56-b3be-016b3e7913d6	686b8cd7-ad45-4188-b16f-980560860fa6	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 03:54:56.225704	en_proceso
13f7972b-628b-4ce8-a24b-da5dd112b46a	63bf6a83-99e8-4207-b86d-985db2eb74be	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 03:59:01.295383	en_proceso
d6f4a75f-f634-477d-96c8-2365fd5aafad	c7f407f9-a410-432d-a68d-5594866e8437	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 04:19:00.688581	en_proceso
89271933-09c6-4caf-8113-81cdf35279fd	4a356b7e-97d7-49b4-b8f7-ca0851a44296	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 04:23:46.814052	en_proceso
11ef53c5-e6eb-4dcb-9110-6ef3717682c8	c3793754-bbef-46fd-a91c-5541c1c3ce60	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 04:26:24.545815	en_proceso
e03fc2a3-e8e5-4d78-9171-54f0ed673063	3206c59f-f863-4c6f-87f0-dbe93776d353	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 04:38:23.145061	en_proceso
95aaa96e-c8c0-40ff-91cf-a2d9b7f6c696	0fdabf9f-5c60-4e87-8071-cba829174a37	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 04:41:09.013283	en_proceso
8c6ef290-5b69-4b8f-ba56-8f77c37ea1ca	7cbb45b2-ff06-4cc0-981a-a7224c08cb35	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 04:58:24.813379	en_proceso
2b7201a9-c69b-4ab3-be15-a3dfc2f5e0ab	88135d69-e372-42e8-8e28-2bc4709d2ccc	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-11-30 05:44:04.444315	en_proceso
3f73507e-c83c-474f-be23-a56bee9a6f5b	07892680-1308-4434-b4e4-143f6c2fb1fe	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-11-30	2025-12-01 05:34:24.795855	en_proceso
b5656cc5-4fa7-48aa-9ea3-c5915a019830	39e92b4f-81d3-45af-9ab9-86302b74bcff	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-12-01	2025-12-01 05:40:38.30581	en_proceso
7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	35f97370-aee6-4a54-bb89-2d3d2125e203	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-26	2025-12-01 07:20:54.149659	en_proceso
d394fbcf-cc84-4c90-9f13-a458aec92e66	65a566f4-8f92-4dba-8374-91859c85d6ca	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-28	2025-12-01 07:01:50.957747	en_proceso
cd46136d-1d94-49dd-878c-68f18c40bb3c	\N	2850a456-d3f6-4877-8e9b-37e0fc4ddc02	2025-12-02	2025-12-02 02:12:21.122588	borrador
072f9bb6-c482-4bc5-8928-91d35badf3d8	6e1f0e90-0f5a-4862-be64-1088ea99a30f	a40a90e1-ab65-450d-bfc1-9a0f3fbf3fb6	2025-11-25	2025-12-02 03:45:17.400231	en_proceso
85a72809-1b96-4432-8a49-209890a7d701	eaf405dd-4a67-4bc7-b36b-af4449dfd5e5	a40a90e1-ab65-450d-bfc1-9a0f3fbf3fb6	2025-12-02	2025-12-02 03:45:52.996659	en_proceso
96b6db0b-caa3-476c-b4c0-f242323a5a58	\N	60edd6bc-3e3d-4873-a50b-d4a0d3195418	2025-12-02	2025-12-02 03:45:58.558834	borrador
4b64978b-7288-489e-8dcb-4ffaabccc3a3	\N	a40a90e1-ab65-450d-bfc1-9a0f3fbf3fb6	2025-12-02	2025-12-02 03:48:26.692949	borrador
4e7c9d9d-efba-4291-9527-6cf6ee9201a0	289a8ba6-f4fd-4fd9-b07d-252ab3a2e4fc	d6f37f1a-f8ef-467a-b17f-5823603dd767	2025-12-02	2025-12-02 04:02:56.579024	en_proceso
2f0bb31b-b64d-4678-a3da-a13a2b504168	00b9cb19-86b0-47a1-bfe2-eca2f0539c24	8fc76451-87b3-4ed6-83bb-b3db65842929	2025-12-02	2025-12-02 15:13:28.827288	en_proceso
67db7e4c-180d-4574-b876-b9aed9b2a756	32df98da-d89d-45e0-b972-c7b74839ede1	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	2025-11-18	2025-12-02 15:18:11.230236	en_proceso
e09b86b4-aefe-49d6-aa7b-25e695b798d5	f274c44e-fb38-4c5e-b3e7-ebe5632165a6	936cb450-875a-4ca8-9807-ef4bddc2393e	2025-12-02	2025-12-03 00:03:52.58612	en_proceso
8ac0fca4-4b92-407d-ab8a-d45cea4ebe32	3a7ceb85-001f-4336-9790-9a9b1b3baa59	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-12-03	2026-05-26 18:16:01.603245	en_proceso
eff908c3-ad3c-4807-8706-61988d104eb6	8ba88d58-e42b-4baf-a0ef-079f2c76f41d	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-30	2026-05-26 18:24:55.520464	en_proceso
911c4e3e-96ba-4582-8758-7317d1c50d7c	a7e50fac-40c0-43e5-9e47-936c6c4926be	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-26	2026-05-27 17:06:03.068341	en_proceso
5bfed192-9e05-4352-b71b-a0cdcad0182a	ed7a8a0e-9f68-4d98-80ca-2c8ee4a8acf0	7c6b97f0-27bf-4ad2-af79-d42294e78fc9	2025-12-03	2025-12-03 05:55:49.953368	en_proceso
35eab03f-228b-4cc4-a923-cdf1096acd19	b66ae5c7-9da5-4c05-a0fe-23e7cc0ce9df	e4b9154e-9d48-429b-b895-b6ca99eac0aa	2025-12-03	2025-12-03 06:06:22.073613	en_proceso
89e9d110-4eec-49dd-a67e-006b78041bdf	\N	e4b9154e-9d48-429b-b895-b6ca99eac0aa	2025-12-03	2025-12-03 06:11:09.163126	borrador
80102a3f-13df-4b98-91fd-12ae0d8c9633	\N	e4b9154e-9d48-429b-b895-b6ca99eac0aa	2025-12-03	2025-12-03 06:14:07.906907	borrador
e70f5647-b77c-45d6-a812-e3ced873dd62	2ef8818a-c56f-4073-b1bb-b0bc662b29bd	e4b9154e-9d48-429b-b895-b6ca99eac0aa	2025-12-03	2025-12-03 06:15:11.997664	en_proceso
9062121e-af29-4a05-991c-00ddbef0e425	\N	e4b9154e-9d48-429b-b895-b6ca99eac0aa	2025-12-03	2025-12-03 06:19:08.147757	borrador
3304978c-36df-4a31-94e4-2d10e8c5887f	\N	8fc76451-87b3-4ed6-83bb-b3db65842929	2025-12-03	2025-12-03 06:51:51.897608	borrador
c26f70f8-7d09-4749-bc6f-6add25661a7b	\N	da9a02e4-a0cb-4059-82d2-135d809154c0	2025-12-03	2025-12-03 16:34:02.549965	borrador
1f29d822-c8a9-4354-baa2-0dffc9b67bfc	\N	d6f37f1a-f8ef-467a-b17f-5823603dd767	2025-12-03	2025-12-03 17:42:24.265522	borrador
fedd13f3-1a2e-4e86-9959-755dd4667f17	\N	a519fd27-825e-42dc-9ed0-95eacbdbb5e0	2025-12-03	2025-12-03 17:42:36.490767	borrador
48dbc941-6699-4c69-a095-78591a3722d4	\N	8fc76451-87b3-4ed6-83bb-b3db65842929	2025-12-03	2025-12-03 17:42:47.834103	borrador
fbaa66d0-627c-4232-8151-b10b5cf8e965	\N	fcf4b66c-ac68-43b7-b314-f73d2555a0a5	2025-12-03	2025-12-03 17:43:13.758354	borrador
3b212eec-33cd-4bb4-8147-24c062bdc42b	5f9daf21-5428-4bdf-a221-2161c22ee05d	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	2025-12-03	2025-12-03 17:46:17.691471	en_proceso
47c8afcb-d55e-4b18-ac75-67f4ce028ba7	ee88dae4-cb05-4e65-95c9-791436f0750b	abcaeb82-22a9-41c4-a5d5-1254fa64b257	2025-12-03	2025-12-03 17:46:48.083139	en_proceso
252be430-3271-487d-b24d-4f57d578f225	8035b4b5-c222-4f2e-a60e-3ab960a7e8a0	936cb450-875a-4ca8-9807-ef4bddc2393e	2025-12-03	2025-12-03 17:50:43.978432	en_proceso
43a2a283-785b-46aa-8fee-75882961974f	\N	da9a02e4-a0cb-4059-82d2-135d809154c0	2025-12-04	2025-12-04 00:15:24.906492	borrador
940f814a-cb57-484c-bbd2-2262d713228b	\N	63a9f46f-9473-49b6-8c41-444ecdaa4737	2025-12-04	2025-12-04 00:16:24.920917	borrador
4130ff39-c736-41f1-9c7f-3d0a798d404d	b8ac953c-d29a-4372-9110-27ca64584d7b	e44b5d20-d75e-4673-bd55-34a753f89853	2025-12-04	2025-12-04 00:32:32.697064	en_proceso
2ff6d047-c7a1-4cf4-963c-c8558b6c572b	29da4387-a3a0-4359-b096-3481dead5948	e44b5d20-d75e-4673-bd55-34a753f89853	2025-12-04	2025-12-04 00:44:06.127189	en_proceso
b8cce2c5-c775-4074-89a7-835a35b3dd98	0fd49024-6388-4ba3-9fc4-3f3c5783f109	e44b5d20-d75e-4673-bd55-34a753f89853	2025-12-04	2025-12-04 01:04:37.566214	en_proceso
8ec65446-ec0a-4651-86c9-ccdb7d3bde74	\N	e44b5d20-d75e-4673-bd55-34a753f89853	2025-12-04	2025-12-04 02:43:45.281775	borrador
b5ba4cd9-a25a-4345-b5bf-00323aa836f7	50fabc5f-b7a6-479c-bc13-9c95a872867d	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	2025-12-03	2025-12-04 04:06:34.142273	en_proceso
6014e80b-078a-4844-91d9-060aa2824610	bd49dace-f08b-4a71-b7a7-b64a85a27d87	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	2025-12-02	2025-12-04 04:07:38.760255	en_proceso
fb116a79-3471-4b61-ae32-83299d3369ab	\N	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-13	2025-12-13 02:00:19.344233	borrador
a05118dd-f55b-4ea7-bdaf-077a1425c6ef	\N	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	2025-12-14	2025-12-14 03:44:03.096301	borrador
f51b6b8d-d9dc-401b-873f-3638b0e243ac	\N	86f280cd-0629-4b17-93ab-fda897227fcf	2025-12-14	2025-12-14 03:44:27.339732	borrador
f4747582-d5fd-4afc-869d-5edf27192f48	\N	8fc76451-87b3-4ed6-83bb-b3db65842929	2025-12-14	2025-12-14 03:44:49.70799	borrador
287bb0a7-97dc-46eb-9e45-76d1a6c3dfab	f79c5cc8-abbc-4327-8bbc-88b403dad0ad	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	2025-12-14	2025-12-14 22:48:35.560734	en_proceso
470a0868-8b1c-453e-8a48-cc172c776e05	\N	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	2025-12-14	2025-12-14 22:54:10.807942	borrador
9b76ca1d-f444-4907-b19f-d712de287b4d	\N	09ab7366-8386-49bf-a196-8d9a84751788	2025-12-15	2025-12-15 00:16:49.577417	borrador
3556b52e-a156-4d38-9f5d-ef3e7c30565c	\N	51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	2025-12-15	2025-12-15 00:17:53.370977	borrador
49ea42d6-5070-416c-9295-160fa4760b10	\N	51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	2025-12-15	2025-12-15 00:28:15.625324	borrador
90ee93d2-868b-458f-81a2-cadc931f2411	\N	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	2025-12-15	2025-12-15 01:01:08.629825	borrador
2af7eeb0-eaca-4975-836a-a141f9e64a5a	\N	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	2025-12-15	2025-12-15 01:05:09.707141	borrador
c2a65d57-c67c-4cf2-ad37-c81fa85319bc	1b4e2d3d-70c3-4642-89be-74ff0fe49cf1	c6c8d452-dce5-406e-9c29-7d59ff8ec685	2025-12-15	2025-12-15 23:51:52.81447	en_proceso
19125c29-5984-4d5b-9bc8-6ddf3c3deb53	6e524038-b488-4416-827b-88c8d13c27a6	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	2026-04-23	2026-04-23 03:46:16.166625	en_proceso
2fed96d9-ccd4-4559-a52e-6aecd85107b8	\N	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	2026-04-23	2026-04-23 03:52:00.064347	borrador
4f8eab57-5f25-4b93-843b-7b288222dfdf	\N	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	2026-04-23	2026-04-23 03:52:05.368527	borrador
84974bdc-0d6f-478a-a4df-1310e1a71ea0	\N	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	2026-04-23	2026-04-23 03:52:06.733872	borrador
4a766208-4cc4-481f-94f6-2f2adb2cc655	1a4273a1-7964-46b5-ad47-b62caf1d440b	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-12-03	2026-05-25 06:10:02.220148	en_proceso
dacf98a8-099d-41a7-9b1c-f54121ab9fcd	d847a7d2-81f2-4445-89ef-465f7be4a31e	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-12-04	2026-05-25 16:32:34.233676	en_proceso
4cc2fe5c-337e-4439-b349-77e0127542f5	25ff6391-acea-4298-8635-00291ea296f2	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-12-03	2026-05-26 17:13:10.420641	en_proceso
ec56d593-2d6e-4184-b1c6-f241e23abf73	54b133b8-145d-4487-b529-2028aa4dc624	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2025-11-30	2026-05-26 18:19:09.498872	en_proceso
d68ea890-c80f-4dbf-8a89-aa534006758a	\N	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-05-26	2026-05-26 23:54:49.154182	borrador
\.


--
-- Data for Name: iho_s; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.iho_s (id_iho, id_historia, fecha, valores, idb, icalc, ihos, clasificacion, id_usuario, created_at) FROM stdin;
\.


--
-- Data for Name: motivo_consulta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.motivo_consulta (id_motivo, id_historia, motivo, fecha_registro) FROM stdin;
d8033d32-2c62-4f0b-b8c9-2f64e9dfb825	8c6ef290-5b69-4b8f-ba56-8f77c37ea1ca	por ahora	2025-11-30 05:23:21.354552
8bc530c2-66e2-4457-a763-134b0744a20e	2b7201a9-c69b-4ab3-be15-a3dfc2f5e0ab	asdasd	2025-11-30 05:44:27.681711
187f3553-7ffe-4f54-b99d-a95acd80831b	b5656cc5-4fa7-48aa-9ea3-c5915a019830	asd	2025-12-01 05:41:24.084776
7918f2e5-5e33-41ed-804d-1ca43ad6bbf9	948b53d6-f8b4-41d6-bc70-2c475368c755	aaaa	2025-12-03 02:23:04.018641
a840c1b4-1223-4e12-8933-f8fa80e9cc09	47c8afcb-d55e-4b18-ac75-67f4ce028ba7	Si	2025-12-03 17:55:52.518128
494c446e-61b4-4012-a8e2-3ed1a2cb8156	4130ff39-c736-41f1-9c7f-3d0a798d404d	asd	2025-12-04 00:43:37.345931
3b2dff9a-52f2-4506-84b1-b3aa9ebc98c7	2ff6d047-c7a1-4cf4-963c-c8558b6c572b	hola gaaasd	2025-12-04 00:54:22.484946
e01ceec3-4455-4dc2-adf6-ab1eb94ee0b6	b8cce2c5-c775-4074-89a7-835a35b3dd98	as	2025-12-04 02:43:28.028745
495d33f4-d8c8-4e96-9226-64ad98b55ea3	252be430-3271-487d-b24d-4f57d578f225	Molestia dentalyyyyyyyyyyyy	2025-12-04 02:48:21.299747
68293d5e-68b2-447a-90b9-791ea6d6a373	d394fbcf-cc84-4c90-9f13-a458aec92e66	asdasd	2025-12-04 03:05:08.486531
11880342-1b78-459f-acfe-53f0d19ee052	4a766208-4cc4-481f-94f6-2f2adb2cc655	Idkdhfasdasd	2026-05-25 16:31:43.326283
7e340bdb-0786-4536-8c3e-1f29fdafd188	7fafb97f-4e5e-4d90-9eab-7ccb58d7a148	hlola	2026-05-25 16:36:00.147561
0a1e119d-83e7-484e-af09-d1733393d299	bea73607-a9cc-462f-b14f-bedb4d503e6d	Dolor de cabeza y mareos casi siempre	2026-05-25 16:38:12.354237
68b9f8fe-5d07-47b1-9318-d38ff9982298	90d29073-ed9b-41d5-89ad-16f716d6c27b	asdasdasdasd	2026-05-28 03:12:29.789304
f797d817-9480-4c75-8973-26a03c8bff3e	275bf20f-a25d-4f5d-a3c2-d853c297e1ed	Jherald se la come toda	2026-06-02 20:31:07.406879
\.


--
-- Data for Name: notificacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notificacion (id_notificacion, id_destinatario, titulo, mensaje, tipo, leida, id_referencia, fecha) FROM stdin;
\.


--
-- Data for Name: odontograma_entrada; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.odontograma_entrada (id_entrada, id_historia, numero_diente, superficie, diagnostico, tratamiento, fecha, alumno, id_usuario, tipo, codigo_hallazgo) FROM stdin;
6b6bbe51-1e55-4095-8f8a-97c5c95c5d20	d68ea890-c80f-4dbf-8a89-aa534006758a	12	vestibular	asd	asd	2026-05-30	123	de4cd964-3e8b-4552-b90a-1bd30cca2f21	EVOLUCION	\N
91bd8115-ec0b-4d78-83b9-ff55dc4c3c3a	d68ea890-c80f-4dbf-8a89-aa534006758a	21	\N	SEED-RF12	\N	2026-06-02	Vaquita Marina	de4cd964-3e8b-4552-b90a-1bd30cca2f21	INICIAL	C
dddc85de-b818-4742-b81f-74c2fe59068f	d68ea890-c80f-4dbf-8a89-aa534006758a	17	\N	SEED-RF12	\N	2026-06-02	Vaquita Marina	de4cd964-3e8b-4552-b90a-1bd30cca2f21	INICIAL	C
e6b0c7df-c3a5-4acb-9cab-d13d1e95a5e4	84974bdc-0d6f-478a-a4df-1310e1a71ea0	46	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	Io
777eb8f1-2517-4d25-886c-a6c53464565f	84974bdc-0d6f-478a-a4df-1310e1a71ea0	36	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	Io
af1cf98c-7e4b-4901-ac58-0f34d08c8b0b	84974bdc-0d6f-478a-a4df-1310e1a71ea0	11	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	DEX
fab2af9b-9a64-490d-8ff0-1854aa69e1df	84974bdc-0d6f-478a-a4df-1310e1a71ea0	24	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	DEX
31c0a250-a294-4e21-8fef-fce23741c898	84974bdc-0d6f-478a-a4df-1310e1a71ea0	34	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	C
6ba963a1-672b-48da-b7ee-21fc6f6088ac	2fed96d9-ccd4-4559-a52e-6aecd85107b8	37	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	R
f7fe2c30-5dee-4421-af6f-48234a71ed6d	2fed96d9-ccd4-4559-a52e-6aecd85107b8	46	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	O
8e4eac2e-1b9e-4ae0-8809-9790281bedc8	19125c29-5984-4d5b-9bc8-6ddf3c3deb53	14	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	C
f41d113d-d3f4-4028-af73-5ce56f15c71d	19125c29-5984-4d5b-9bc8-6ddf3c3deb53	28	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	C
2d21ceea-a355-480d-b36a-1bd303452ef9	19125c29-5984-4d5b-9bc8-6ddf3c3deb53	37	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	O
48847c58-9c24-429b-87ca-10d5429edd20	4f8eab57-5f25-4b93-843b-7b288222dfdf	26	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	DEX
31a7f224-440a-475f-9103-0074925991e2	4f8eab57-5f25-4b93-843b-7b288222dfdf	46	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	R
3a42d73c-0405-415a-acd4-39f0a8a94954	4f8eab57-5f25-4b93-843b-7b288222dfdf	28	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	C
8795fd4b-1c0b-4914-8440-34e5de5bd356	4f8eab57-5f25-4b93-843b-7b288222dfdf	18	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	C
2d13a456-3d35-40ef-9066-b99f870449f7	4f8eab57-5f25-4b93-843b-7b288222dfdf	31	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	C
751306fb-6ed6-4ffd-b531-ace59cd753dc	4f8eab57-5f25-4b93-843b-7b288222dfdf	11	\N	SEED-RF12	\N	2026-06-02	Juan Pérez	997c61c1-cefb-4728-ad6e-1d3eb9d86f41	INICIAL	C
1456d842-81e5-4168-8f35-ab450e296b76	9b76ca1d-f444-4907-b19f-d712de287b4d	28	\N	SEED-RF12	\N	2026-06-02	Ada Puan	09ab7366-8386-49bf-a196-8d9a84751788	INICIAL	C
6773ccd4-88af-46cf-8907-a0cca706f6ca	9b76ca1d-f444-4907-b19f-d712de287b4d	36	\N	SEED-RF12	\N	2026-06-02	Ada Puan	09ab7366-8386-49bf-a196-8d9a84751788	INICIAL	C
51ec71e7-5703-4a2b-a1af-9d21e365057e	9b76ca1d-f444-4907-b19f-d712de287b4d	37	\N	SEED-RF12	\N	2026-06-02	Ada Puan	09ab7366-8386-49bf-a196-8d9a84751788	INICIAL	C
0975b228-a47e-4e3c-b57e-dd92c1c496af	3556b52e-a156-4d38-9f5d-ef3e7c30565c	34	\N	SEED-RF12	\N	2026-06-02	Stillz Condori Rivera	51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	INICIAL	R
a5cda760-6d6d-4419-a90e-b21d67358cf5	3556b52e-a156-4d38-9f5d-ef3e7c30565c	21	\N	SEED-RF12	\N	2026-06-02	Stillz Condori Rivera	51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	INICIAL	C
389424c6-336f-4a29-9151-e6fee992a748	3556b52e-a156-4d38-9f5d-ef3e7c30565c	37	\N	SEED-RF12	\N	2026-06-02	Stillz Condori Rivera	51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	INICIAL	Io
41aa6104-c0fb-49c5-a680-ed4e338add95	3556b52e-a156-4d38-9f5d-ef3e7c30565c	41	\N	SEED-RF12	\N	2026-06-02	Stillz Condori Rivera	51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	INICIAL	C
132b474f-c2c2-49bd-8631-60fed0b3ee87	3556b52e-a156-4d38-9f5d-ef3e7c30565c	27	\N	SEED-RF12	\N	2026-06-02	Stillz Condori Rivera	51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	INICIAL	O
2b0f5c0b-22c8-40ad-87da-34dfb24bac68	3556b52e-a156-4d38-9f5d-ef3e7c30565c	46	\N	SEED-RF12	\N	2026-06-02	Stillz Condori Rivera	51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	INICIAL	C
579c5ab8-095d-408f-9ce7-7243de101147	2af7eeb0-eaca-4975-836a-a141f9e64a5a	11	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	Io
6f5c0af6-fc18-43ac-8c95-5adbb829b803	2af7eeb0-eaca-4975-836a-a141f9e64a5a	41	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	O
fd85430e-2e82-4a48-a430-f02b6320ebe3	49ea42d6-5070-416c-9295-160fa4760b10	21	\N	SEED-RF12	\N	2026-06-02	Stillz Condori Rivera	51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	INICIAL	C
6441ff46-9f8f-4ddd-8007-70b2e21005c4	49ea42d6-5070-416c-9295-160fa4760b10	16	\N	SEED-RF12	\N	2026-06-02	Stillz Condori Rivera	51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	INICIAL	O
3aebb3bc-dda5-4ae4-8052-38f6ff8396bf	49ea42d6-5070-416c-9295-160fa4760b10	36	\N	SEED-RF12	\N	2026-06-02	Stillz Condori Rivera	51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	INICIAL	DEX
eba83d30-9b06-46e6-bc43-f09d38805549	c2a65d57-c67c-4cf2-ad37-c81fa85319bc	16	\N	SEED-RF12	\N	2026-06-02	Alexis Erik Condori Rivera	c6c8d452-dce5-406e-9c29-7d59ff8ec685	INICIAL	O
2243d624-e54c-4f92-90a9-b78e49d90e58	c2a65d57-c67c-4cf2-ad37-c81fa85319bc	44	\N	SEED-RF12	\N	2026-06-02	Alexis Erik Condori Rivera	c6c8d452-dce5-406e-9c29-7d59ff8ec685	INICIAL	C
5975804b-217b-468c-abd6-9d18b231fa79	c2a65d57-c67c-4cf2-ad37-c81fa85319bc	34	\N	SEED-RF12	\N	2026-06-02	Alexis Erik Condori Rivera	c6c8d452-dce5-406e-9c29-7d59ff8ec685	INICIAL	C
e4742f88-cde7-453c-ac0e-f5348bda6305	c2a65d57-c67c-4cf2-ad37-c81fa85319bc	24	\N	SEED-RF12	\N	2026-06-02	Alexis Erik Condori Rivera	c6c8d452-dce5-406e-9c29-7d59ff8ec685	INICIAL	O
630b81a4-6205-4bee-9d8c-0d969acdc814	c2a65d57-c67c-4cf2-ad37-c81fa85319bc	46	\N	SEED-RF12	\N	2026-06-02	Alexis Erik Condori Rivera	c6c8d452-dce5-406e-9c29-7d59ff8ec685	INICIAL	DEX
cf0736e8-13cb-4171-9258-210df690ad7b	c2a65d57-c67c-4cf2-ad37-c81fa85319bc	47	\N	SEED-RF12	\N	2026-06-02	Alexis Erik Condori Rivera	c6c8d452-dce5-406e-9c29-7d59ff8ec685	INICIAL	C
c99341f0-df5c-4f93-a7a1-8523b4cbdec5	90ee93d2-868b-458f-81a2-cadc931f2411	36	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	C
a1a7f654-9ccd-47dd-9c32-8228d611a78f	90ee93d2-868b-458f-81a2-cadc931f2411	11	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	C
8c701a5e-c3d0-40a1-8ea1-7a9c47b38b5e	90ee93d2-868b-458f-81a2-cadc931f2411	46	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	O
a7a5b862-0950-4e0e-8be2-772ffc005bad	90ee93d2-868b-458f-81a2-cadc931f2411	27	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	R
90827a4d-ebeb-452f-bef9-2c4e24d1143a	90ee93d2-868b-458f-81a2-cadc931f2411	24	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	C
9c8231bf-83c0-453c-8e60-72370de7c3b3	90ee93d2-868b-458f-81a2-cadc931f2411	34	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	R
9b37f881-8597-4a66-923d-10bad56b357d	287bb0a7-97dc-46eb-9e45-76d1a6c3dfab	11	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	C
c9f371a9-9186-4027-ad9e-2150d29a4dd0	287bb0a7-97dc-46eb-9e45-76d1a6c3dfab	47	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	C
2169c0b9-94a2-4ad1-9755-63101109675b	287bb0a7-97dc-46eb-9e45-76d1a6c3dfab	41	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	O
fd582111-3fe5-4082-9b51-e5517ecfbafb	287bb0a7-97dc-46eb-9e45-76d1a6c3dfab	16	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	R
a6809932-6dc3-43b2-84ba-78a9f4e5055e	287bb0a7-97dc-46eb-9e45-76d1a6c3dfab	14	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	O
207deb38-f446-49a5-91db-3f3b449e4ad2	f51b6b8d-d9dc-401b-873f-3638b0e243ac	26	\N	SEED-RF12	\N	2026-06-02	Alexis Condori	86f280cd-0629-4b17-93ab-fda897227fcf	INICIAL	C
579d9d60-7ca5-4719-bf1c-a39271b73e42	f51b6b8d-d9dc-401b-873f-3638b0e243ac	28	\N	SEED-RF12	\N	2026-06-02	Alexis Condori	86f280cd-0629-4b17-93ab-fda897227fcf	INICIAL	C
d7da3fbf-04d1-4087-a59b-e55de5119af1	f51b6b8d-d9dc-401b-873f-3638b0e243ac	46	\N	SEED-RF12	\N	2026-06-02	Alexis Condori	86f280cd-0629-4b17-93ab-fda897227fcf	INICIAL	DEX
2c2fb936-c82b-4495-b4ce-7ba245d20815	f51b6b8d-d9dc-401b-873f-3638b0e243ac	36	\N	SEED-RF12	\N	2026-06-02	Alexis Condori	86f280cd-0629-4b17-93ab-fda897227fcf	INICIAL	C
4e2c946e-7206-4d25-a1ec-e90a19a74b51	f51b6b8d-d9dc-401b-873f-3638b0e243ac	47	\N	SEED-RF12	\N	2026-06-02	Alexis Condori	86f280cd-0629-4b17-93ab-fda897227fcf	INICIAL	Io
560f0250-3376-4b22-9849-e4f9030aa66b	470a0868-8b1c-453e-8a48-cc172c776e05	18	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	C
c379ccd9-a0ac-4e91-88df-2ddc081a1b06	470a0868-8b1c-453e-8a48-cc172c776e05	36	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	C
17464d07-8dfd-4e34-bd7d-2f05c0358f48	470a0868-8b1c-453e-8a48-cc172c776e05	34	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	C
f95bad31-4e43-44c0-b2d1-4e6babea07ab	470a0868-8b1c-453e-8a48-cc172c776e05	17	\N	SEED-RF12	\N	2026-06-02	Cristian Ricardo Condori Rivera	6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	INICIAL	O
ee465be6-bae2-4702-82c1-281873b96894	a05118dd-f55b-4ea7-bdaf-077a1425c6ef	41	\N	SEED-RF12	\N	2026-06-02	Cristhiany Lesly Conde Escobar	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	INICIAL	C
dfa82489-219b-4499-a267-faddf81165b5	a05118dd-f55b-4ea7-bdaf-077a1425c6ef	16	\N	SEED-RF12	\N	2026-06-02	Cristhiany Lesly Conde Escobar	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	INICIAL	O
36704d18-25d7-46d0-b2af-e3114c774256	a05118dd-f55b-4ea7-bdaf-077a1425c6ef	46	\N	SEED-RF12	\N	2026-06-02	Cristhiany Lesly Conde Escobar	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	INICIAL	O
19f6d3d0-d8b4-4730-b0bf-60515a24070b	a05118dd-f55b-4ea7-bdaf-077a1425c6ef	24	\N	SEED-RF12	\N	2026-06-02	Cristhiany Lesly Conde Escobar	cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	INICIAL	C
\.


--
-- Data for Name: odontograma_svg; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.odontograma_svg (id_svg, id_historia, tipo, svg, especificaciones, observaciones, fecha, id_usuario, created_at) FROM stdin;
9f9facd2-1dfe-4ba2-a9bf-b84b3a0b48e0	275bf20f-a25d-4f5d-a3c2-d853c297e1ed	INICIAL	<svg class="odo" width="100%" height="auto" viewBox="0 0 1400 1400" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="background: white; font-family: Arial, sans-serif; display: block; width: 100%; height: auto; min-width: 320px;"><style type="text/css">\n  .letra {\n    border: 1px solid #000;\n    padding: 4px;\n    border-radius: 4px;\n  }\n  .line { stroke-width: 2; }\n  .thin { stroke-width: 1 !important; }\n  .posnumber { font-size: 10px; fill: #333; }\n  .tooth-name { font-size: 10px; fill: #111; pointer-events: none; }\n  .part { cursor: pointer; stroke: black; fill: none; }\n  .tooth-group:hover .highlight rect,\n  .tooth-group:hover .highlight polygon,\n  .tooth-group:hover .highlight path { stroke: #e33; stroke-width: 2.5; }\n  input.letra, textarea.letra { font-size: 12px; } \n  .annotation { display: block; }\n</style><foreignObject x="1170" y="20" width="270" height="40"><div xmlns="http://www.w3.org/1999/xhtml"><label for="fecha" style="font-size: 12px; margin-right: 10px;">Fecha:</label><input id="fecha" class="letra" type="date" style="width: 100px;" value="" /></div></foreignObject><defs><g id="design1"><polygon id="d1_part1" class="part line" points="50,100 80,100 80,70 50,30" data-name="corona-izq"/><polygon id="d1_part2" class="part line" points="80,70 100,30 120,70 120,100 80,100" data-name="corona-centro"/><polygon id="d1_part3" class="part line" points="150,100 120,100 120,70 150,30" data-name="corona-der"/><polygon id="d1_part4" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d1_part5" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d1_part6" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d1_part7" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d1_part8" class="part thin" x="78" y="130" width="14" height="20" data-name="fosa1"/><rect id="d1_part9" class="part thin" x="93" y="130" width="12" height="20" data-name="fosa2"/><rect id="d1_part10" class="part thin" x="106" y="130" width="13" height="20" data-name="fosa3"/><rect id="d1_part11" class="part thin" x="78" y="150" width="14" height="20" data-name="surco1"/><rect id="d1_part12" class="part thin" x="93" y="150" width="12" height="20" data-name="surco2"/><rect id="d1_part13" class="part thin" x="106" y="150" width="13" height="20" data-name="surco3"/><title>Design 1 (13 partes)</title></g><g id="design2"><g transform="rotate(180,100,100)"><polygon id="d2_part1" class="part line" points="50,70 75,30 100,70 100,100 50,100" data-name="corona-izq"/><polygon id="d2_part2" class="part line" points="100,70 120,30 150,70 150,100 100,100" data-name="corona-der"/><polygon id="d2_part3" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d2_part4" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d2_part5" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d2_part6" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d2_part7" class="part thin" x="78" y="130" width="14" height="20" data-name="fosa1"/><rect id="d2_part8" class="part thin" x="93" y="130" width="12" height="20" data-name="fosa2"/><rect id="d2_part9" class="part thin" x="106" y="130" width="13" height="20" data-name="fosa3"/><rect id="d2_part10" class="part thin" x="78" y="150" width="14" height="20" data-name="surco1"/><rect id="d2_part11" class="part thin" x="93" y="150" width="12" height="20" data-name="surco2"/><rect id="d2_part12" class="part thin" x="106" y="150" width="13" height="20" data-name="surco3"/><title>Design 2 (12 partes) - girado</title></g></g><g id="design3"><polygon id="d3_part1" class="part line" points="100,30 70,100 130,100" data-name="corona-tri"/><polygon id="d3_part2" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d3_part3" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d3_part4" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d3_part5" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d3_part6" class="part thin" x="78" y="130" width="42" height="20" data-name="fosas"/><rect id="d3_part7" class="part thin" x="78" y="150" width="42" height="20" data-name="surcos"/><title>Design 3 (7 partes)</title></g><g id="design4"><g transform="rotate(180,100,120)"><polygon id="d4_part1" class="part line" points="100,30 70,100 130,100" data-name="corona-tri"/><polygon id="d4_part2" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d4_part3" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d4_part4" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d4_part5" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d4_part6" class="part thin" x="78" y="130" width="42" height="20" data-name="fosas"/><rect id="d4_part7" class="part thin" x="78" y="150" width="42" height="20" data-name="surcos"/><title>Design 4 (7 partes) - girado</title></g></g><g id="design5"><polygon id="d5_part1" class="part line" points="80,30 60,100 100,100" data-name="corona-l1"/><polygon id="d5_part2" class="part line" points="120,30 100,100 140,100" data-name="corona-l2"/><polygon id="d5_part3" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d5_part4" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d5_part5" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d5_part6" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><title>Design 5 (1.4)</title></g><g id="design6"><polygon id="d6_part1" class="part line" points="80,30 60,100 100,100" data-name="corona-l1"/><polygon id="d6_part2" class="part line" points="120,30 100,100 140,100" data-name="corona-l2"/><polygon id="d6_part3" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d6_part4" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d6_part5" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d6_part6" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d6_part7" class="part thin" x="78" y="130" width="42" height="20" data-name="fosas"/><rect id="d6_part8" class="part thin" x="78" y="150" width="42" height="20" data-name="surcos"/><title>Design 6 (8 partes)</title></g><g id="design7"><polygon id="d7_part1" class="part line" points="100,30 50,100 150,100" data-name="corona"/><polygon id="d7_part2" class="part line" points="50,100 80,150 120,150 150,100" data-name="paredes"/><polygon id="d7_part3" class="part line" points="150,200 120,150 80,150 50,200" data-name="base"/><polygon id="d7_part4" class="part line" points="50,100 50,200 80,150" data-name="lado-izq"/><polygon id="d7_part5" class="part line" points="150,100 150,200 120,150" data-name="lado-der"/><title>Design 7 (5 partes)</title></g><g id="design8"><g transform="rotate(180,100,120)"><polygon id="d8_part1" class="part line" points="100,30 50,100 150,100" data-name="corona"/><polygon id="d8_part2" class="part line" points="50,100 80,150 120,150 150,100" data-name="paredes"/><polygon id="d8_part3" class="part line" points="150,200 120,150 80,150 50,200" data-name="base"/><polygon id="d8_part4" class="part line" points="50,100 50,200 80,150" data-name="lado-izq"/><polygon id="d8_part5" class="part line" points="150,100 150,200 120,150" data-name="lado-der"/><title>Design 8 (5 partes) - girado</title></g></g></defs><foreignObject x="570" y="20" width="600" height="30"><div xmlns="http://www.w3.org/1999/xhtml"><label for="odontograma-title" style="font-size: 25px; margin-right: 10px; -webkit-text-stroke-width: 2px;">Odontograma</label><span id="odontograma-title" style="display: none;"></span></div></foreignObject><g id="fila1" transform="translate(20,110)"><g id="tooth_1_8" class="tooth-group" data-name="1.8" transform="translate(0,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="55" y="-2" class="tooth-name">1.8</text><foreignObject x="25" y="-45" width="68" height="30" id="input1"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_7" class="tooth-group" data-name="1.7" transform="translate(80,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="135" y="-2" class="tooth-name">1.7</text><foreignObject x="105" y="-45" width="68" height="30" id="input2"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_6" class="tooth-group" data-name="1.6" transform="translate(160,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="215" y="-2" class="tooth-name">1.6</text><foreignObject x="185" y="-45" width="68" height="30" id="input3"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_5" class="tooth-group" data-name="1.5" transform="translate(240,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design3"/></g><text x="295" y="-2" class="tooth-name">1.5</text><foreignObject x="265" y="-45" width="68" height="30" id="input4"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_4" class="tooth-group" data-name="1.4" transform="translate(320,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design5"/></g><text x="375" y="-2" class="tooth-name">1.4</text><foreignObject x="345" y="-45" width="68" height="30" id="input5"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_3" class="tooth-group" data-name="1.3" transform="translate(400,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="455" y="-2" class="tooth-name">1.3</text><foreignObject x="430" y="-45" width="60" height="30" id="input6"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_2" class="tooth-group" data-name="1.2" transform="translate(480,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="530" y="-2" class="tooth-name">1.2</text><foreignObject x="506" y="-45" width="60" height="30" id="input7"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_1" class="tooth-group" data-name="1.1" transform="translate(560,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="603" y="-2" class="tooth-name">1.1</text><foreignObject x="583" y="-45" width="60" height="30" id="input8"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_1" class="tooth-group" data-name="2.1" transform="translate(640,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="685" y="-2" class="tooth-name">2.1</text><foreignObject x="660" y="-45" width="60" height="30" id="input9"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_2" class="tooth-group" data-name="2.2" transform="translate(720,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="765" y="-3" class="tooth-name">2.2</text><foreignObject x="740" y="-45" width="60" height="30" id="input10"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_3" class="tooth-group" data-name="2.3" transform="translate(800,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="845" y="-3" class="tooth-name" style="fill: rgb(37, 99, 235); font-weight: 700; font-size: 13px;">2.3</text><foreignObject x="820" y="-45" width="60" height="30" id="input11"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" style="border: 2px solid red; color: red;" value="CF" /></div></foreignObject><g id="tooth_2_4" class="tooth-group" data-name="2.4" transform="translate(880,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design6"/></g><text x="930" y="-3" class="tooth-name" style="">2.4</text><foreignObject x="900" y="-45" width="68" height="30" id="input12"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_5" class="tooth-group" data-name="2.5" transform="translate(960,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design3"/></g><text x="1015" y="-3" class="tooth-name" style="">2.5</text><foreignObject x="985" y="-45" width="68" height="30" id="input13"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_6" class="tooth-group" data-name="2.6" transform="translate(1040,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="1090" y="-3" class="tooth-name" style="">2.6</text><foreignObject x="1060" y="-45" width="68" height="30" id="input14"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_7" class="tooth-group" data-name="2.7" transform="translate(1120,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="1175" y="-3" class="tooth-name" style="">2.7</text><foreignObject x="1145" y="-45" width="68" height="30" id="input15"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_8" class="tooth-group" data-name="2.8" transform="translate(1200,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="1250" y="-3" class="tooth-name" style="">2.8</text><foreignObject x="1220" y="-45" width="68" height="30" id="input16"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject></g><g id="fila2" transform="translate(261,320)"><g id="tooth_5_1" class="tooth-group" data-name="5.5" transform="translate(0,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="55" y="1" class="tooth-name">5.5</text><foreignObject x="20" y="-45" width="68" height="30" id="input17"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_2" class="tooth-group" data-name="5.4" transform="translate(80,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="135" y="1" class="tooth-name">5.4</text><foreignObject x="100" y="-45" width="68" height="30" id="input18"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_3" class="tooth-group" data-name="5.3" transform="translate(160,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="210" y="1" class="tooth-name">5.3</text><foreignObject x="180" y="-45" width="60" height="30" id="input19"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_4" class="tooth-group" data-name="5.2" transform="translate(240,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="285" y="1" class="tooth-name">5.2</text><foreignObject x="255" y="-45" width="60" height="30" id="input20"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_5" class="tooth-group" data-name="5.1" transform="translate(320,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="365" y="1" class="tooth-name">5.1</text><foreignObject x="335" y="-45" width="60" height="30" id="input21"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_1" class="tooth-group" data-name="6.1" transform="translate(400,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="445" y="1" class="tooth-name">6.1</text><foreignObject x="415" y="-45" width="60" height="30" id="input22"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_2" class="tooth-group" data-name="6.2" transform="translate(480,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="525" y="1" class="tooth-name">6.2</text><foreignObject x="495" y="-45" width="60" height="30" id="input23"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_3" class="tooth-group" data-name="6.3" transform="translate(560,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="605" y="1" class="tooth-name">6.3</text><foreignObject x="575" y="-45" width="60" height="30" id="input24"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_4" class="tooth-group" data-name="6.4" transform="translate(640,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="700" y="1" class="tooth-name">6.4</text><foreignObject x="670" y="-45" width="68" height="30" id="input25"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_5" class="tooth-group" data-name="6.5" transform="translate(720,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="780" y="1" class="tooth-name" style="">6.5</text><foreignObject x="750" y="-45" width="68" height="30" id="input26"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" style="border: 2px solid blue; color: blue;" value="MAC" /></div></foreignObject></g><g id="fila3" transform="translate(261,570)"><g id="tooth_8_5" class="tooth-group" data-name="8.5" transform="translate(0,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="55" y="50" class="tooth-name">8.5</text><foreignObject x="25" y="70" width="68" height="30" id="input27"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_4" class="tooth-group" data-name="8.4" transform="translate(80,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="140" y="50" class="tooth-name">8.4</text><foreignObject x="105" y="70" width="68" height="30" id="input28"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_3" class="tooth-group" data-name="8.3" transform="translate(160,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="205" y="50" class="tooth-name">8.3</text><foreignObject x="185" y="70" width="55" height="30" id="input29"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_2" class="tooth-group" data-name="8.2" transform="translate(240,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="285" y="50" class="tooth-name">8.2</text><foreignObject x="260" y="70" width="60" height="30" id="input30"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_1" class="tooth-group" data-name="8.1" transform="translate(320,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="365" y="50" class="tooth-name">8.1</text><foreignObject x="340" y="70" width="60" height="30" id="input31"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_1" class="tooth-group" data-name="7.1" transform="translate(400,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="440" y="50" class="tooth-name">7.1</text><foreignObject x="420" y="70" width="65" height="30" id="input32"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_2" class="tooth-group" data-name="7.2" transform="translate(480,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="525" y="50" class="tooth-name">7.2</text><foreignObject x="500" y="70" width="60" height="30" id="input33"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_3" class="tooth-group" data-name="7.3" transform="translate(560,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="605" y="50" class="tooth-name">7.3</text><foreignObject x="575" y="70" width="65" height="30" id="input34"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_4" class="tooth-group" data-name="7.4" transform="translate(640,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="700" y="50" class="tooth-name">7.4</text><foreignObject x="665" y="70" width="68" height="30" id="input35"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_5" class="tooth-group" data-name="7.5" transform="translate(720,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="780" y="50" class="tooth-name">7.5</text><foreignObject x="750" y="70" width="68" height="30" id="input36"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject></g><g id="fila4" transform="translate(20,795)"><g id="tooth_4_8" class="tooth-group" data-name="4.8" transform="translate(0,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="55" y="50" class="tooth-name">4.8</text><foreignObject x="30" y="60" width="60" height="30" id="input37"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_7" class="tooth-group" data-name="4.7" transform="translate(80,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="135" y="50" class="tooth-name">4.7</text><foreignObject x="110" y="60" width="60" height="30" id="input38"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_6" class="tooth-group" data-name="4.6" transform="translate(160,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="215" y="50" class="tooth-name">4.6</text><foreignObject x="190" y="60" width="60" height="30" id="input39"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_5" class="tooth-group" data-name="4.5" transform="translate(240,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="290" y="50" class="tooth-name">4.5</text><foreignObject x="265" y="60" width="60" height="30" id="input40"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_4" class="tooth-group" data-name="4.4" transform="translate(320,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="375" y="50" class="tooth-name">4.4</text><foreignObject x="350" y="60" width="60" height="30" id="input41"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_3" class="tooth-group" data-name="4.3" transform="translate(400,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="445" y="50" class="tooth-name">4.3</text><foreignObject x="430" y="60" width="60" height="30" id="input42"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_2" class="tooth-group" data-name="4.2" transform="translate(480,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="525" y="50" class="tooth-name">4.2</text><foreignObject x="505" y="60" width="60" height="30" id="input43"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_1" class="tooth-group" data-name="4.1" transform="translate(560,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="605" y="50" class="tooth-name">4.1</text><foreignObject x="580" y="60" width="60" height="30" id="input44"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_1" class="tooth-group" data-name="3.1" transform="translate(640,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="685" y="50" class="tooth-name">3.1</text><foreignObject x="662" y="60" width="55" height="30" id="input45"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_2" class="tooth-group" data-name="3.2" transform="translate(720,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="765" y="50" class="tooth-name">3.2</text><foreignObject x="740" y="60" width="60" height="30" id="input46"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_3" class="tooth-group" data-name="3.3" transform="translate(800,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="845" y="50" class="tooth-name">3.3</text><foreignObject x="820" y="60" width="60" height="30" id="input47"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_4" class="tooth-group" data-name="3.4" transform="translate(880,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="935" y="50" class="tooth-name">3.4</text><foreignObject x="910" y="60" width="60" height="30" id="input48"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_5" class="tooth-group" data-name="3.5" transform="translate(960,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="1010" y="50" class="tooth-name">3.5</text><foreignObject x="990" y="60" width="60" height="30" id="input49"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_6" class="tooth-group" data-name="3.6" transform="translate(1040,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="1095" y="50" class="tooth-name">3.6</text><foreignObject x="1070" y="60" width="60" height="30" id="input50"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_7" class="tooth-group" data-name="3.7" transform="translate(1120,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="1175" y="50" class="tooth-name">3.7</text><foreignObject x="1150" y="60" width="60" height="30" id="input51"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_8" class="tooth-group" data-name="3.8" transform="translate(1200,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="1255" y="50" class="tooth-name">3.8</text><foreignObject x="1230" y="60" width="65" height="30" id="input52"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject></g><foreignObject x="50" y="900" width="1270" height="160"><div xmlns="http://www.w3.org/1999/xhtml"><label for="inputEspecificaciones" style="font-size: 14px; font-weight: bold;">Especificaciones:</label><textarea id="inputEspecificaciones" class="letra" rows="2" style="width: 100%; resize: none;"></textarea></div></foreignObject><foreignObject x="50" y="1000" width="1270" height="60"><div xmlns="http://www.w3.org/1999/xhtml"><label for="inputObservaciones" style="font-size: 14px; font-weight: bold;">Observaciones:</label><textarea id="inputObservaciones" class="letra" rows="2" style="width: 100%; resize: none;"></textarea></div></foreignObject><g id="odontograma-overlay"><circle cx="1120" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.6-1780354187009" data-tooth="2.6" data-rec="tx-1780354187009-06f4v"/><ellipse cx="1120" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.6-1780354194242" data-tooth="2.6" data-rec="tx-1780354194242-uykm1"/><ellipse cx="1040" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.6-1780354194242" data-tooth="2.5" data-rec="tx-1780354194242-uykm1"/><ellipse cx="1200" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.7-1780354198303" data-tooth="2.7" data-rec="tx-1780354198304-o2m9u"/><ellipse cx="1280" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.7-1780354198304" data-tooth="2.8" data-rec="tx-1780354198304-o2m9u"/><circle cx="1280" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.8-1780354252419" data-tooth="2.8" data-rec="tx-1780354252419-olvrq"/><circle cx="1040" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.5-1780354255624" data-tooth="2.5" data-rec="tx-1780354255624-diez7"/><circle cx="1200" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.7-1780354258409" data-tooth="2.7" data-rec="tx-1780354258409-90t01"/><rect x="850.96" y="171.56" width="60.480000000000004" height="60.78" fill="none" stroke="red" stroke-width="3" class="annotation crown-border fallback" data-id="crown-border-2.3-1780354276981" data-rec="tx-1780354276981-7mn3f"/></g></svg>	\N	\N	2026-06-01	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-06-01 22:52:46.84102
6eeaf189-1297-46e7-b78b-39b44bfa81ae	275bf20f-a25d-4f5d-a3c2-d853c297e1ed	INICIAL	<svg class="odo" width="100%" height="auto" viewBox="0 0 1400 1400" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="background: white; font-family: Arial, sans-serif; display: block; width: 100%; height: auto; min-width: 320px;"><style type="text/css">\n  .letra {\n    border: 1px solid #000;\n    padding: 4px;\n    border-radius: 4px;\n  }\n  .line { stroke-width: 2; }\n  .thin { stroke-width: 1 !important; }\n  .posnumber { font-size: 10px; fill: #333; }\n  .tooth-name { font-size: 10px; fill: #111; pointer-events: none; }\n  .part { cursor: pointer; stroke: black; fill: none; }\n  .tooth-group:hover .highlight rect,\n  .tooth-group:hover .highlight polygon,\n  .tooth-group:hover .highlight path { stroke: #e33; stroke-width: 2.5; }\n  input.letra, textarea.letra { font-size: 12px; } \n  .annotation { display: block; }\n</style><foreignObject x="1170" y="20" width="270" height="40"><div xmlns="http://www.w3.org/1999/xhtml"><label for="fecha" style="font-size: 12px; margin-right: 10px;">Fecha:</label><input id="fecha" class="letra" type="date" style="width: 100px;" value="" /></div></foreignObject><defs><g id="design1"><polygon id="d1_part1" class="part line" points="50,100 80,100 80,70 50,30" data-name="corona-izq"/><polygon id="d1_part2" class="part line" points="80,70 100,30 120,70 120,100 80,100" data-name="corona-centro"/><polygon id="d1_part3" class="part line" points="150,100 120,100 120,70 150,30" data-name="corona-der"/><polygon id="d1_part4" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d1_part5" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d1_part6" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d1_part7" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d1_part8" class="part thin" x="78" y="130" width="14" height="20" data-name="fosa1"/><rect id="d1_part9" class="part thin" x="93" y="130" width="12" height="20" data-name="fosa2"/><rect id="d1_part10" class="part thin" x="106" y="130" width="13" height="20" data-name="fosa3"/><rect id="d1_part11" class="part thin" x="78" y="150" width="14" height="20" data-name="surco1"/><rect id="d1_part12" class="part thin" x="93" y="150" width="12" height="20" data-name="surco2"/><rect id="d1_part13" class="part thin" x="106" y="150" width="13" height="20" data-name="surco3"/><title>Design 1 (13 partes)</title></g><g id="design2"><g transform="rotate(180,100,100)"><polygon id="d2_part1" class="part line" points="50,70 75,30 100,70 100,100 50,100" data-name="corona-izq"/><polygon id="d2_part2" class="part line" points="100,70 120,30 150,70 150,100 100,100" data-name="corona-der"/><polygon id="d2_part3" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d2_part4" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d2_part5" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d2_part6" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d2_part7" class="part thin" x="78" y="130" width="14" height="20" data-name="fosa1"/><rect id="d2_part8" class="part thin" x="93" y="130" width="12" height="20" data-name="fosa2"/><rect id="d2_part9" class="part thin" x="106" y="130" width="13" height="20" data-name="fosa3"/><rect id="d2_part10" class="part thin" x="78" y="150" width="14" height="20" data-name="surco1"/><rect id="d2_part11" class="part thin" x="93" y="150" width="12" height="20" data-name="surco2"/><rect id="d2_part12" class="part thin" x="106" y="150" width="13" height="20" data-name="surco3"/><title>Design 2 (12 partes) - girado</title></g></g><g id="design3"><polygon id="d3_part1" class="part line" points="100,30 70,100 130,100" data-name="corona-tri"/><polygon id="d3_part2" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d3_part3" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d3_part4" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d3_part5" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d3_part6" class="part thin" x="78" y="130" width="42" height="20" data-name="fosas"/><rect id="d3_part7" class="part thin" x="78" y="150" width="42" height="20" data-name="surcos"/><title>Design 3 (7 partes)</title></g><g id="design4"><g transform="rotate(180,100,120)"><polygon id="d4_part1" class="part line" points="100,30 70,100 130,100" data-name="corona-tri"/><polygon id="d4_part2" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d4_part3" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d4_part4" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d4_part5" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d4_part6" class="part thin" x="78" y="130" width="42" height="20" data-name="fosas"/><rect id="d4_part7" class="part thin" x="78" y="150" width="42" height="20" data-name="surcos"/><title>Design 4 (7 partes) - girado</title></g></g><g id="design5"><polygon id="d5_part1" class="part line" points="80,30 60,100 100,100" data-name="corona-l1"/><polygon id="d5_part2" class="part line" points="120,30 100,100 140,100" data-name="corona-l2"/><polygon id="d5_part3" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d5_part4" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d5_part5" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d5_part6" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><title>Design 5 (1.4)</title></g><g id="design6"><polygon id="d6_part1" class="part line" points="80,30 60,100 100,100" data-name="corona-l1"/><polygon id="d6_part2" class="part line" points="120,30 100,100 140,100" data-name="corona-l2"/><polygon id="d6_part3" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d6_part4" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d6_part5" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d6_part6" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d6_part7" class="part thin" x="78" y="130" width="42" height="20" data-name="fosas"/><rect id="d6_part8" class="part thin" x="78" y="150" width="42" height="20" data-name="surcos"/><title>Design 6 (8 partes)</title></g><g id="design7"><polygon id="d7_part1" class="part line" points="100,30 50,100 150,100" data-name="corona"/><polygon id="d7_part2" class="part line" points="50,100 80,150 120,150 150,100" data-name="paredes"/><polygon id="d7_part3" class="part line" points="150,200 120,150 80,150 50,200" data-name="base"/><polygon id="d7_part4" class="part line" points="50,100 50,200 80,150" data-name="lado-izq"/><polygon id="d7_part5" class="part line" points="150,100 150,200 120,150" data-name="lado-der"/><title>Design 7 (5 partes)</title></g><g id="design8"><g transform="rotate(180,100,120)"><polygon id="d8_part1" class="part line" points="100,30 50,100 150,100" data-name="corona"/><polygon id="d8_part2" class="part line" points="50,100 80,150 120,150 150,100" data-name="paredes"/><polygon id="d8_part3" class="part line" points="150,200 120,150 80,150 50,200" data-name="base"/><polygon id="d8_part4" class="part line" points="50,100 50,200 80,150" data-name="lado-izq"/><polygon id="d8_part5" class="part line" points="150,100 150,200 120,150" data-name="lado-der"/><title>Design 8 (5 partes) - girado</title></g></g></defs><foreignObject x="570" y="20" width="600" height="30"><div xmlns="http://www.w3.org/1999/xhtml"><label for="odontograma-title" style="font-size: 25px; margin-right: 10px; -webkit-text-stroke-width: 2px;">Odontograma</label><span id="odontograma-title" style="display: none;"></span></div></foreignObject><g id="fila1" transform="translate(20,110)"><g id="tooth_1_8" class="tooth-group" data-name="1.8" transform="translate(0,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="55" y="-2" class="tooth-name">1.8</text><foreignObject x="25" y="-45" width="68" height="30" id="input1"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_7" class="tooth-group" data-name="1.7" transform="translate(80,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="135" y="-2" class="tooth-name">1.7</text><foreignObject x="105" y="-45" width="68" height="30" id="input2"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_6" class="tooth-group" data-name="1.6" transform="translate(160,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="215" y="-2" class="tooth-name">1.6</text><foreignObject x="185" y="-45" width="68" height="30" id="input3"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_5" class="tooth-group" data-name="1.5" transform="translate(240,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design3"/></g><text x="295" y="-2" class="tooth-name">1.5</text><foreignObject x="265" y="-45" width="68" height="30" id="input4"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_4" class="tooth-group" data-name="1.4" transform="translate(320,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design5"/></g><text x="375" y="-2" class="tooth-name">1.4</text><foreignObject x="345" y="-45" width="68" height="30" id="input5"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_3" class="tooth-group" data-name="1.3" transform="translate(400,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="455" y="-2" class="tooth-name">1.3</text><foreignObject x="430" y="-45" width="60" height="30" id="input6"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_2" class="tooth-group" data-name="1.2" transform="translate(480,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="530" y="-2" class="tooth-name">1.2</text><foreignObject x="506" y="-45" width="60" height="30" id="input7"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_1" class="tooth-group" data-name="1.1" transform="translate(560,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="603" y="-2" class="tooth-name">1.1</text><foreignObject x="583" y="-45" width="60" height="30" id="input8"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_1" class="tooth-group" data-name="2.1" transform="translate(640,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="685" y="-2" class="tooth-name">2.1</text><foreignObject x="660" y="-45" width="60" height="30" id="input9"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_2" class="tooth-group" data-name="2.2" transform="translate(720,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="765" y="-3" class="tooth-name">2.2</text><foreignObject x="740" y="-45" width="60" height="30" id="input10"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_3" class="tooth-group" data-name="2.3" transform="translate(800,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="845" y="-3" class="tooth-name" style="fill: rgb(37, 99, 235); font-weight: 700; font-size: 13px;">2.3</text><foreignObject x="820" y="-45" width="60" height="30" id="input11"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" style="border: 2px solid red; color: red;" value="CF" /></div></foreignObject><g id="tooth_2_4" class="tooth-group" data-name="2.4" transform="translate(880,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design6"/></g><text x="930" y="-3" class="tooth-name" style="">2.4</text><foreignObject x="900" y="-45" width="68" height="30" id="input12"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_5" class="tooth-group" data-name="2.5" transform="translate(960,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design3"/></g><text x="1015" y="-3" class="tooth-name" style="">2.5</text><foreignObject x="985" y="-45" width="68" height="30" id="input13"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_6" class="tooth-group" data-name="2.6" transform="translate(1040,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="1090" y="-3" class="tooth-name" style="">2.6</text><foreignObject x="1060" y="-45" width="68" height="30" id="input14"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_7" class="tooth-group" data-name="2.7" transform="translate(1120,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="1175" y="-3" class="tooth-name" style="">2.7</text><foreignObject x="1145" y="-45" width="68" height="30" id="input15"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_8" class="tooth-group" data-name="2.8" transform="translate(1200,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="1250" y="-3" class="tooth-name" style="">2.8</text><foreignObject x="1220" y="-45" width="68" height="30" id="input16"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject></g><g id="fila2" transform="translate(261,320)"><g id="tooth_5_1" class="tooth-group" data-name="5.5" transform="translate(0,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="55" y="1" class="tooth-name">5.5</text><foreignObject x="20" y="-45" width="68" height="30" id="input17"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_2" class="tooth-group" data-name="5.4" transform="translate(80,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="135" y="1" class="tooth-name">5.4</text><foreignObject x="100" y="-45" width="68" height="30" id="input18"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_3" class="tooth-group" data-name="5.3" transform="translate(160,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="210" y="1" class="tooth-name">5.3</text><foreignObject x="180" y="-45" width="60" height="30" id="input19"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_4" class="tooth-group" data-name="5.2" transform="translate(240,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="285" y="1" class="tooth-name">5.2</text><foreignObject x="255" y="-45" width="60" height="30" id="input20"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_5" class="tooth-group" data-name="5.1" transform="translate(320,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="365" y="1" class="tooth-name">5.1</text><foreignObject x="335" y="-45" width="60" height="30" id="input21"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_1" class="tooth-group" data-name="6.1" transform="translate(400,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="445" y="1" class="tooth-name">6.1</text><foreignObject x="415" y="-45" width="60" height="30" id="input22"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_2" class="tooth-group" data-name="6.2" transform="translate(480,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="525" y="1" class="tooth-name">6.2</text><foreignObject x="495" y="-45" width="60" height="30" id="input23"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_3" class="tooth-group" data-name="6.3" transform="translate(560,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="605" y="1" class="tooth-name">6.3</text><foreignObject x="575" y="-45" width="60" height="30" id="input24"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_4" class="tooth-group" data-name="6.4" transform="translate(640,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="700" y="1" class="tooth-name">6.4</text><foreignObject x="670" y="-45" width="68" height="30" id="input25"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_5" class="tooth-group" data-name="6.5" transform="translate(720,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="780" y="1" class="tooth-name" style="">6.5</text><foreignObject x="750" y="-45" width="68" height="30" id="input26"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" style="border: 2px solid blue; color: blue;" value="MAC" /></div></foreignObject></g><g id="fila3" transform="translate(261,570)"><g id="tooth_8_5" class="tooth-group" data-name="8.5" transform="translate(0,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="55" y="50" class="tooth-name">8.5</text><foreignObject x="25" y="70" width="68" height="30" id="input27"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_4" class="tooth-group" data-name="8.4" transform="translate(80,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="140" y="50" class="tooth-name">8.4</text><foreignObject x="105" y="70" width="68" height="30" id="input28"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_3" class="tooth-group" data-name="8.3" transform="translate(160,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="205" y="50" class="tooth-name">8.3</text><foreignObject x="185" y="70" width="55" height="30" id="input29"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_2" class="tooth-group" data-name="8.2" transform="translate(240,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="285" y="50" class="tooth-name">8.2</text><foreignObject x="260" y="70" width="60" height="30" id="input30"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_1" class="tooth-group" data-name="8.1" transform="translate(320,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="365" y="50" class="tooth-name">8.1</text><foreignObject x="340" y="70" width="60" height="30" id="input31"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_1" class="tooth-group" data-name="7.1" transform="translate(400,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="440" y="50" class="tooth-name">7.1</text><foreignObject x="420" y="70" width="65" height="30" id="input32"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_2" class="tooth-group" data-name="7.2" transform="translate(480,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="525" y="50" class="tooth-name">7.2</text><foreignObject x="500" y="70" width="60" height="30" id="input33"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_3" class="tooth-group" data-name="7.3" transform="translate(560,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="605" y="50" class="tooth-name">7.3</text><foreignObject x="575" y="70" width="65" height="30" id="input34"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_4" class="tooth-group" data-name="7.4" transform="translate(640,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="700" y="50" class="tooth-name">7.4</text><foreignObject x="665" y="70" width="68" height="30" id="input35"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_5" class="tooth-group" data-name="7.5" transform="translate(720,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="780" y="50" class="tooth-name">7.5</text><foreignObject x="750" y="70" width="68" height="30" id="input36"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject></g><g id="fila4" transform="translate(20,795)"><g id="tooth_4_8" class="tooth-group" data-name="4.8" transform="translate(0,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="55" y="50" class="tooth-name">4.8</text><foreignObject x="30" y="60" width="60" height="30" id="input37"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_7" class="tooth-group" data-name="4.7" transform="translate(80,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="135" y="50" class="tooth-name">4.7</text><foreignObject x="110" y="60" width="60" height="30" id="input38"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_6" class="tooth-group" data-name="4.6" transform="translate(160,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="215" y="50" class="tooth-name">4.6</text><foreignObject x="190" y="60" width="60" height="30" id="input39"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_5" class="tooth-group" data-name="4.5" transform="translate(240,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="290" y="50" class="tooth-name">4.5</text><foreignObject x="265" y="60" width="60" height="30" id="input40"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_4" class="tooth-group" data-name="4.4" transform="translate(320,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="375" y="50" class="tooth-name">4.4</text><foreignObject x="350" y="60" width="60" height="30" id="input41"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_3" class="tooth-group" data-name="4.3" transform="translate(400,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="445" y="50" class="tooth-name">4.3</text><foreignObject x="430" y="60" width="60" height="30" id="input42"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_2" class="tooth-group" data-name="4.2" transform="translate(480,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="525" y="50" class="tooth-name">4.2</text><foreignObject x="505" y="60" width="60" height="30" id="input43"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_1" class="tooth-group" data-name="4.1" transform="translate(560,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="605" y="50" class="tooth-name">4.1</text><foreignObject x="580" y="60" width="60" height="30" id="input44"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_1" class="tooth-group" data-name="3.1" transform="translate(640,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="685" y="50" class="tooth-name">3.1</text><foreignObject x="662" y="60" width="55" height="30" id="input45"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_2" class="tooth-group" data-name="3.2" transform="translate(720,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="765" y="50" class="tooth-name">3.2</text><foreignObject x="740" y="60" width="60" height="30" id="input46"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_3" class="tooth-group" data-name="3.3" transform="translate(800,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="845" y="50" class="tooth-name">3.3</text><foreignObject x="820" y="60" width="60" height="30" id="input47"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_4" class="tooth-group" data-name="3.4" transform="translate(880,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="935" y="50" class="tooth-name">3.4</text><foreignObject x="910" y="60" width="60" height="30" id="input48"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_5" class="tooth-group" data-name="3.5" transform="translate(960,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="1010" y="50" class="tooth-name">3.5</text><foreignObject x="990" y="60" width="60" height="30" id="input49"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_6" class="tooth-group" data-name="3.6" transform="translate(1040,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="1095" y="50" class="tooth-name">3.6</text><foreignObject x="1070" y="60" width="60" height="30" id="input50"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_7" class="tooth-group" data-name="3.7" transform="translate(1120,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="1175" y="50" class="tooth-name">3.7</text><foreignObject x="1150" y="60" width="60" height="30" id="input51"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_8" class="tooth-group" data-name="3.8" transform="translate(1200,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="1255" y="50" class="tooth-name">3.8</text><foreignObject x="1230" y="60" width="65" height="30" id="input52"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject></g><foreignObject x="50" y="900" width="1270" height="160"><div xmlns="http://www.w3.org/1999/xhtml"><label for="inputEspecificaciones" style="font-size: 14px; font-weight: bold;">Especificaciones:</label><textarea id="inputEspecificaciones" class="letra" rows="2" style="width: 100%; resize: none;"></textarea></div></foreignObject><foreignObject x="50" y="1000" width="1270" height="60"><div xmlns="http://www.w3.org/1999/xhtml"><label for="inputObservaciones" style="font-size: 14px; font-weight: bold;">Observaciones:</label><textarea id="inputObservaciones" class="letra" rows="2" style="width: 100%; resize: none;"></textarea></div></foreignObject><g id="odontograma-overlay"><circle cx="1120" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.6-1780354187009" data-tooth="2.6" data-rec="tx-1780354187009-06f4v"/><ellipse cx="1120" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.6-1780354194242" data-tooth="2.6" data-rec="tx-1780354194242-uykm1"/><ellipse cx="1040" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.6-1780354194242" data-tooth="2.5" data-rec="tx-1780354194242-uykm1"/><ellipse cx="1200" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.7-1780354198303" data-tooth="2.7" data-rec="tx-1780354198304-o2m9u"/><ellipse cx="1280" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.7-1780354198304" data-tooth="2.8" data-rec="tx-1780354198304-o2m9u"/><circle cx="1280" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.8-1780354252419" data-tooth="2.8" data-rec="tx-1780354252419-olvrq"/><circle cx="1040" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.5-1780354255624" data-tooth="2.5" data-rec="tx-1780354255624-diez7"/><circle cx="1200" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.7-1780354258409" data-tooth="2.7" data-rec="tx-1780354258409-90t01"/><rect x="850.96" y="171.56" width="60.480000000000004" height="60.78" fill="none" stroke="red" stroke-width="3" class="annotation crown-border fallback" data-id="crown-border-2.3-1780354276981" data-rec="tx-1780354276981-7mn3f"/></g></svg>	\N	\N	2026-06-01	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-06-01 22:52:48.431391
edefc9e2-293f-488d-a733-19e72c1ee91d	275bf20f-a25d-4f5d-a3c2-d853c297e1ed	EVOLUCION	<svg class="odo" width="100%" height="auto" viewBox="0 0 1400 1400" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="background: white; font-family: Arial, sans-serif; display: block; width: 100%; height: auto; min-width: 320px;"><style type="text/css">\n  .letra {\n    border: 1px solid #000;\n    padding: 4px;\n    border-radius: 4px;\n  }\n  .line { stroke-width: 2; }\n  .thin { stroke-width: 1 !important; }\n  .posnumber { font-size: 10px; fill: #333; }\n  .tooth-name { font-size: 10px; fill: #111; pointer-events: none; }\n  .part { cursor: pointer; stroke: black; fill: none; }\n  .tooth-group:hover .highlight rect,\n  .tooth-group:hover .highlight polygon,\n  .tooth-group:hover .highlight path { stroke: #e33; stroke-width: 2.5; }\n  input.letra, textarea.letra { font-size: 12px; } \n  .annotation { display: block; }\n</style><foreignObject x="1170" y="20" width="270" height="40"><div xmlns="http://www.w3.org/1999/xhtml"><label for="fecha" style="font-size: 12px; margin-right: 10px;">Fecha:</label><input id="fecha" class="letra" type="date" style="width: 100px;" value="" /></div></foreignObject><defs><g id="design1"><polygon id="d1_part1" class="part line" points="50,100 80,100 80,70 50,30" data-name="corona-izq"/><polygon id="d1_part2" class="part line" points="80,70 100,30 120,70 120,100 80,100" data-name="corona-centro"/><polygon id="d1_part3" class="part line" points="150,100 120,100 120,70 150,30" data-name="corona-der"/><polygon id="d1_part4" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d1_part5" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d1_part6" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d1_part7" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d1_part8" class="part thin" x="78" y="130" width="14" height="20" data-name="fosa1"/><rect id="d1_part9" class="part thin" x="93" y="130" width="12" height="20" data-name="fosa2"/><rect id="d1_part10" class="part thin" x="106" y="130" width="13" height="20" data-name="fosa3"/><rect id="d1_part11" class="part thin" x="78" y="150" width="14" height="20" data-name="surco1"/><rect id="d1_part12" class="part thin" x="93" y="150" width="12" height="20" data-name="surco2"/><rect id="d1_part13" class="part thin" x="106" y="150" width="13" height="20" data-name="surco3"/><title>Design 1 (13 partes)</title></g><g id="design2"><g transform="rotate(180,100,100)"><polygon id="d2_part1" class="part line" points="50,70 75,30 100,70 100,100 50,100" data-name="corona-izq"/><polygon id="d2_part2" class="part line" points="100,70 120,30 150,70 150,100 100,100" data-name="corona-der"/><polygon id="d2_part3" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d2_part4" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d2_part5" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d2_part6" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d2_part7" class="part thin" x="78" y="130" width="14" height="20" data-name="fosa1"/><rect id="d2_part8" class="part thin" x="93" y="130" width="12" height="20" data-name="fosa2"/><rect id="d2_part9" class="part thin" x="106" y="130" width="13" height="20" data-name="fosa3"/><rect id="d2_part10" class="part thin" x="78" y="150" width="14" height="20" data-name="surco1"/><rect id="d2_part11" class="part thin" x="93" y="150" width="12" height="20" data-name="surco2"/><rect id="d2_part12" class="part thin" x="106" y="150" width="13" height="20" data-name="surco3"/><title>Design 2 (12 partes) - girado</title></g></g><g id="design3"><polygon id="d3_part1" class="part line" points="100,30 70,100 130,100" data-name="corona-tri"/><polygon id="d3_part2" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d3_part3" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d3_part4" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d3_part5" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d3_part6" class="part thin" x="78" y="130" width="42" height="20" data-name="fosas"/><rect id="d3_part7" class="part thin" x="78" y="150" width="42" height="20" data-name="surcos"/><title>Design 3 (7 partes)</title></g><g id="design4"><g transform="rotate(180,100,120)"><polygon id="d4_part1" class="part line" points="100,30 70,100 130,100" data-name="corona-tri"/><polygon id="d4_part2" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d4_part3" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d4_part4" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d4_part5" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d4_part6" class="part thin" x="78" y="130" width="42" height="20" data-name="fosas"/><rect id="d4_part7" class="part thin" x="78" y="150" width="42" height="20" data-name="surcos"/><title>Design 4 (7 partes) - girado</title></g></g><g id="design5"><polygon id="d5_part1" class="part line" points="80,30 60,100 100,100" data-name="corona-l1"/><polygon id="d5_part2" class="part line" points="120,30 100,100 140,100" data-name="corona-l2"/><polygon id="d5_part3" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d5_part4" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d5_part5" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d5_part6" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><title>Design 5 (1.4)</title></g><g id="design6"><polygon id="d6_part1" class="part line" points="80,30 60,100 100,100" data-name="corona-l1"/><polygon id="d6_part2" class="part line" points="120,30 100,100 140,100" data-name="corona-l2"/><polygon id="d6_part3" class="part line" points="50,200 78,170 78,130 50,100" data-name="raiz-izq"/><polygon id="d6_part4" class="part line" points="150,200 120,170 120,130 150,100" data-name="raiz-der"/><polygon id="d6_part5" class="part line" points="150,200 120,170 80,170 50,200" data-name="base"/><polygon id="d6_part6" class="part line" points="50,100 80,130 120,130 150,100" data-name="cingulo"/><rect id="d6_part7" class="part thin" x="78" y="130" width="42" height="20" data-name="fosas"/><rect id="d6_part8" class="part thin" x="78" y="150" width="42" height="20" data-name="surcos"/><title>Design 6 (8 partes)</title></g><g id="design7"><polygon id="d7_part1" class="part line" points="100,30 50,100 150,100" data-name="corona"/><polygon id="d7_part2" class="part line" points="50,100 80,150 120,150 150,100" data-name="paredes"/><polygon id="d7_part3" class="part line" points="150,200 120,150 80,150 50,200" data-name="base"/><polygon id="d7_part4" class="part line" points="50,100 50,200 80,150" data-name="lado-izq"/><polygon id="d7_part5" class="part line" points="150,100 150,200 120,150" data-name="lado-der"/><title>Design 7 (5 partes)</title></g><g id="design8"><g transform="rotate(180,100,120)"><polygon id="d8_part1" class="part line" points="100,30 50,100 150,100" data-name="corona"/><polygon id="d8_part2" class="part line" points="50,100 80,150 120,150 150,100" data-name="paredes"/><polygon id="d8_part3" class="part line" points="150,200 120,150 80,150 50,200" data-name="base"/><polygon id="d8_part4" class="part line" points="50,100 50,200 80,150" data-name="lado-izq"/><polygon id="d8_part5" class="part line" points="150,100 150,200 120,150" data-name="lado-der"/><title>Design 8 (5 partes) - girado</title></g></g></defs><foreignObject x="570" y="20" width="600" height="30"><div xmlns="http://www.w3.org/1999/xhtml"><label for="odontograma-title" style="font-size: 25px; margin-right: 10px; -webkit-text-stroke-width: 2px;">Odontograma</label><span id="odontograma-title" style="display: none;"></span></div></foreignObject><g id="fila1" transform="translate(20,110)"><g id="tooth_1_8" class="tooth-group" data-name="1.8" transform="translate(0,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="55" y="-2" class="tooth-name">1.8</text><foreignObject x="25" y="-45" width="68" height="30" id="input1"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_7" class="tooth-group" data-name="1.7" transform="translate(80,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="135" y="-2" class="tooth-name">1.7</text><foreignObject x="105" y="-45" width="68" height="30" id="input2"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_6" class="tooth-group" data-name="1.6" transform="translate(160,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="215" y="-2" class="tooth-name">1.6</text><foreignObject x="185" y="-45" width="68" height="30" id="input3"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_5" class="tooth-group" data-name="1.5" transform="translate(240,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design3"/></g><text x="295" y="-2" class="tooth-name">1.5</text><foreignObject x="265" y="-45" width="68" height="30" id="input4"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_4" class="tooth-group" data-name="1.4" transform="translate(320,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design5"/></g><text x="375" y="-2" class="tooth-name">1.4</text><foreignObject x="345" y="-45" width="68" height="30" id="input5"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_3" class="tooth-group" data-name="1.3" transform="translate(400,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="455" y="-2" class="tooth-name">1.3</text><foreignObject x="430" y="-45" width="60" height="30" id="input6"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_1_2" class="tooth-group" data-name="1.2" transform="translate(480,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="530" y="-2" class="tooth-name" style="fill: rgb(37, 99, 235); font-weight: 700; font-size: 13px;">1.2</text><foreignObject x="506" y="-45" width="60" height="30" id="input7"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" style="border: 2px solid red; color: red;" value="CF" /></div></foreignObject><g id="tooth_1_1" class="tooth-group" data-name="1.1" transform="translate(560,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="603" y="-2" class="tooth-name" style="">1.1</text><foreignObject x="583" y="-45" width="60" height="30" id="input8"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" style="border: 2px solid red; color: red;" value="CV" /></div></foreignObject><g id="tooth_2_1" class="tooth-group" data-name="2.1" transform="translate(640,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="685" y="-2" class="tooth-name" style="">2.1</text><foreignObject x="660" y="-45" width="60" height="30" id="input9"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" style="border: 2px solid red; color: red;" value="CLM" /></div></foreignObject><g id="tooth_2_2" class="tooth-group" data-name="2.2" transform="translate(720,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="765" y="-3" class="tooth-name" style="">2.2</text><foreignObject x="740" y="-45" width="60" height="30" id="input10"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" style="border: 2px solid blue; color: blue;" value="CF" /></div></foreignObject><g id="tooth_2_3" class="tooth-group" data-name="2.3" transform="translate(800,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="845" y="-3" class="tooth-name">2.3</text><foreignObject x="820" y="-45" width="60" height="30" id="input11"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="CF" /></div></foreignObject><g id="tooth_2_4" class="tooth-group" data-name="2.4" transform="translate(880,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design6"/></g><text x="930" y="-3" class="tooth-name">2.4</text><foreignObject x="900" y="-45" width="68" height="30" id="input12"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_5" class="tooth-group" data-name="2.5" transform="translate(960,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design3"/></g><text x="1015" y="-3" class="tooth-name">2.5</text><foreignObject x="985" y="-45" width="68" height="30" id="input13"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_6" class="tooth-group" data-name="2.6" transform="translate(1040,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="1090" y="-3" class="tooth-name">2.6</text><foreignObject x="1060" y="-45" width="68" height="30" id="input14"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_7" class="tooth-group" data-name="2.7" transform="translate(1120,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="1175" y="-3" class="tooth-name">2.7</text><foreignObject x="1145" y="-45" width="68" height="30" id="input15"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_2_8" class="tooth-group" data-name="2.8" transform="translate(1200,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="1250" y="-3" class="tooth-name">2.8</text><foreignObject x="1220" y="-45" width="68" height="30" id="input16"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject></g><g id="fila2" transform="translate(261,320)"><g id="tooth_5_1" class="tooth-group" data-name="5.5" transform="translate(0,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="55" y="1" class="tooth-name">5.5</text><foreignObject x="20" y="-45" width="68" height="30" id="input17"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_2" class="tooth-group" data-name="5.4" transform="translate(80,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="135" y="1" class="tooth-name">5.4</text><foreignObject x="100" y="-45" width="68" height="30" id="input18"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_3" class="tooth-group" data-name="5.3" transform="translate(160,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="210" y="1" class="tooth-name">5.3</text><foreignObject x="180" y="-45" width="60" height="30" id="input19"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_4" class="tooth-group" data-name="5.2" transform="translate(240,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="285" y="1" class="tooth-name">5.2</text><foreignObject x="255" y="-45" width="60" height="30" id="input20"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_5_5" class="tooth-group" data-name="5.1" transform="translate(320,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="365" y="1" class="tooth-name">5.1</text><foreignObject x="335" y="-45" width="60" height="30" id="input21"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_1" class="tooth-group" data-name="6.1" transform="translate(400,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="445" y="1" class="tooth-name">6.1</text><foreignObject x="415" y="-45" width="60" height="30" id="input22"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_2" class="tooth-group" data-name="6.2" transform="translate(480,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="525" y="1" class="tooth-name">6.2</text><foreignObject x="495" y="-45" width="60" height="30" id="input23"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_3" class="tooth-group" data-name="6.3" transform="translate(560,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design7"/></g><text x="605" y="1" class="tooth-name">6.3</text><foreignObject x="575" y="-45" width="60" height="30" id="input24"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_4" class="tooth-group" data-name="6.4" transform="translate(640,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="700" y="1" class="tooth-name">6.4</text><foreignObject x="670" y="-45" width="68" height="30" id="input25"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_6_5" class="tooth-group" data-name="6.5" transform="translate(720,0) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design1"/></g><text x="780" y="1" class="tooth-name">6.5</text><foreignObject x="750" y="-45" width="68" height="30" id="input26"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="MAC" /></div></foreignObject></g><g id="fila3" transform="translate(261,570)"><g id="tooth_8_5" class="tooth-group" data-name="8.5" transform="translate(0,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="55" y="50" class="tooth-name">8.5</text><foreignObject x="25" y="70" width="68" height="30" id="input27"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_4" class="tooth-group" data-name="8.4" transform="translate(80,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="140" y="50" class="tooth-name">8.4</text><foreignObject x="105" y="70" width="68" height="30" id="input28"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_3" class="tooth-group" data-name="8.3" transform="translate(160,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="205" y="50" class="tooth-name">8.3</text><foreignObject x="185" y="70" width="55" height="30" id="input29"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_2" class="tooth-group" data-name="8.2" transform="translate(240,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="285" y="50" class="tooth-name">8.2</text><foreignObject x="260" y="70" width="60" height="30" id="input30"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_8_1" class="tooth-group" data-name="8.1" transform="translate(320,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="365" y="50" class="tooth-name">8.1</text><foreignObject x="340" y="70" width="60" height="30" id="input31"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_1" class="tooth-group" data-name="7.1" transform="translate(400,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="440" y="50" class="tooth-name">7.1</text><foreignObject x="420" y="70" width="65" height="30" id="input32"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_2" class="tooth-group" data-name="7.2" transform="translate(480,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="525" y="50" class="tooth-name">7.2</text><foreignObject x="500" y="70" width="60" height="30" id="input33"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_3" class="tooth-group" data-name="7.3" transform="translate(560,-95) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="605" y="50" class="tooth-name">7.3</text><foreignObject x="575" y="70" width="65" height="30" id="input34"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_4" class="tooth-group" data-name="7.4" transform="translate(640,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="700" y="50" class="tooth-name">7.4</text><foreignObject x="665" y="70" width="68" height="30" id="input35"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_7_5" class="tooth-group" data-name="7.5" transform="translate(720,-70) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="780" y="50" class="tooth-name">7.5</text><foreignObject x="750" y="70" width="68" height="30" id="input36"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject></g><g id="fila4" transform="translate(20,795)"><g id="tooth_4_8" class="tooth-group" data-name="4.8" transform="translate(0,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="55" y="50" class="tooth-name">4.8</text><foreignObject x="30" y="60" width="60" height="30" id="input37"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_7" class="tooth-group" data-name="4.7" transform="translate(80,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="135" y="50" class="tooth-name">4.7</text><foreignObject x="110" y="60" width="60" height="30" id="input38"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_6" class="tooth-group" data-name="4.6" transform="translate(160,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="215" y="50" class="tooth-name">4.6</text><foreignObject x="190" y="60" width="60" height="30" id="input39"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_5" class="tooth-group" data-name="4.5" transform="translate(240,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="290" y="50" class="tooth-name">4.5</text><foreignObject x="265" y="60" width="60" height="30" id="input40"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_4" class="tooth-group" data-name="4.4" transform="translate(320,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="375" y="50" class="tooth-name">4.4</text><foreignObject x="350" y="60" width="60" height="30" id="input41"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_3" class="tooth-group" data-name="4.3" transform="translate(400,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="445" y="50" class="tooth-name">4.3</text><foreignObject x="430" y="60" width="60" height="30" id="input42"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_2" class="tooth-group" data-name="4.2" transform="translate(480,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="525" y="50" class="tooth-name">4.2</text><foreignObject x="505" y="60" width="60" height="30" id="input43"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_4_1" class="tooth-group" data-name="4.1" transform="translate(560,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="605" y="50" class="tooth-name">4.1</text><foreignObject x="580" y="60" width="60" height="30" id="input44"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_1" class="tooth-group" data-name="3.1" transform="translate(640,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="685" y="50" class="tooth-name">3.1</text><foreignObject x="662" y="60" width="55" height="30" id="input45"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_2" class="tooth-group" data-name="3.2" transform="translate(720,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="765" y="50" class="tooth-name">3.2</text><foreignObject x="740" y="60" width="60" height="30" id="input46"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_3" class="tooth-group" data-name="3.3" transform="translate(800,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design8"/></g><text x="845" y="50" class="tooth-name">3.3</text><foreignObject x="820" y="60" width="60" height="30" id="input47"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_4" class="tooth-group" data-name="3.4" transform="translate(880,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="935" y="50" class="tooth-name">3.4</text><foreignObject x="910" y="60" width="60" height="30" id="input48"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_5" class="tooth-group" data-name="3.5" transform="translate(960,-105) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design4"/></g><text x="1010" y="50" class="tooth-name">3.5</text><foreignObject x="990" y="60" width="60" height="30" id="input49"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_6" class="tooth-group" data-name="3.6" transform="translate(1040,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="1095" y="50" class="tooth-name">3.6</text><foreignObject x="1070" y="60" width="60" height="30" id="input50"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_7" class="tooth-group" data-name="3.7" transform="translate(1120,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="1175" y="50" class="tooth-name">3.7</text><foreignObject x="1150" y="60" width="60" height="30" id="input51"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject><g id="tooth_3_8" class="tooth-group" data-name="3.8" transform="translate(1200,-80) scale(0.6)"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#design2"/></g><text x="1255" y="50" class="tooth-name">3.8</text><foreignObject x="1230" y="60" width="65" height="30" id="input52"><div xmlns="http://www.w3.org/1999/xhtml"><input class="letra" type="text" value="" /></div></foreignObject></g><foreignObject x="50" y="900" width="1270" height="160"><div xmlns="http://www.w3.org/1999/xhtml"><label for="inputEspecificaciones" style="font-size: 14px; font-weight: bold;">Especificaciones:</label><textarea id="inputEspecificaciones" class="letra" rows="2" style="width: 100%; resize: none;"></textarea></div></foreignObject><foreignObject x="50" y="1000" width="1270" height="60"><div xmlns="http://www.w3.org/1999/xhtml"><label for="inputObservaciones" style="font-size: 14px; font-weight: bold;">Observaciones:</label><textarea id="inputObservaciones" class="letra" rows="2" style="width: 100%; resize: none;"></textarea></div></foreignObject><g id="odontograma-overlay"><circle cx="1120" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.6-1780354187009" data-tooth="2.6" data-rec="tx-1780354187009-06f4v"/><ellipse cx="1120" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.6-1780354194242" data-tooth="2.6" data-rec="tx-1780354194242-uykm1"/><ellipse cx="1040" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.6-1780354194242" data-tooth="2.5" data-rec="tx-1780354194242-uykm1"/><ellipse cx="1200" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.7-1780354198303" data-tooth="2.7" data-rec="tx-1780354198304-o2m9u"/><ellipse cx="1280" cy="179" rx="40" ry="15" fill="none" stroke="blue" stroke-width="2" class="annotation fusion-circle" data-id="fusion-2.7-1780354198304" data-tooth="2.8" data-rec="tx-1780354198304-o2m9u"/><circle cx="1280" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.8-1780354252419" data-tooth="2.8" data-rec="tx-1780354252419-olvrq"/><circle cx="1040" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.5-1780354255624" data-tooth="2.5" data-rec="tx-1780354255624-diez7"/><circle cx="1200" cy="179" r="21" fill="none" stroke="blue" stroke-width="2" opacity="1" class="annotation germination-circle" data-id="germin-2.7-1780354258409" data-tooth="2.7" data-rec="tx-1780354258409-90t01"/><rect x="850.96" y="171.56" width="60.480000000000004" height="60.78" fill="none" stroke="red" stroke-width="3" class="annotation crown-border fallback" data-id="crown-border-2.3-1780354276981" data-rec="tx-1780354276981-7mn3f"/><rect x="610.96" y="171.56" width="60.480000000000004" height="60.78" fill="none" stroke="red" stroke-width="3" class="annotation crown-border fallback" data-id="crown-border-1.1-1780363833005" data-rec="tx-1780363833005-zvpfg"/><rect x="690.96" y="171.56" width="60.480000000000004" height="60.78" fill="none" stroke="red" stroke-width="3" class="annotation crown-border fallback" data-id="crown-border-2.1-1780363836591" data-rec="tx-1780363836592-tzw94"/><rect x="770.96" y="171.56" width="60.480000000000004" height="60.78" fill="none" stroke="blue" stroke-width="3" class="annotation crown-border fallback" data-id="crown-border-2.2-1780363839314" data-rec="tx-1780363839314-2qi4u"/><rect x="530.96" y="171.56" width="60.480000000000004" height="60.78" fill="none" stroke="red" stroke-width="3" class="annotation crown-border fallback" data-id="crown-border-1.2-1780363842174" data-rec="tx-1780363842174-frooc"/></g></svg>	\N	\N	2026-06-02	de4cd964-3e8b-4552-b90a-1bd30cca2f21	2026-06-02 01:30:47.738654
\.


--
-- Data for Name: paciente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.paciente (id_paciente, nombre, apellido, dni, fecha_nacimiento, telefono, email, fecha_registro, activo, sexo) FROM stdin;
b3a3acd0-43b4-4748-92bd-34472389f1de	Sin definir	Sin definir	\N	2025-11-28	\N	\N	2025-11-28 08:06:28.010757	t	\N
f760ae35-ebab-4b0a-a2fe-ed0ab4697c1a	Sin definir	Sin definir	\N	2007-11-28	\N	\N	2025-11-28 08:13:59.477492	t	\N
ea949932-b86f-422c-9620-ba5edafe7641	Sin definir	Sin definir	\N	2007-11-28	\N	\N	2025-11-28 18:38:40.192726	t	\N
896aba0f-4441-47c2-a6b9-6c969c6c21c8	Jheral	Awa	\N	\N	\N	\N	2025-12-03 17:46:13.502894	t	\N
74f577d9-83d7-474b-88ea-0ed0badab086	jheral	maquera	12345678	1999-03-12	12345678	\N	2025-11-29 04:26:35.715112	t	\N
675753b0-a488-4812-b2a4-01ff6fcce9a6	quiero	dota	\N	\N	\N	\N	2025-11-29 22:05:14.935422	t	\N
d8fc54cf-7557-4d3c-8fe5-72e0327d84f8	ASDASD	ASDASDASDASDSDSDSD	\N	\N	\N	\N	2025-11-29 22:13:29.908153	t	\N
c0771b15-39c5-488a-afb0-64eb015d58dc	paciente	cero	\N	\N	\N	\N	2025-11-29 22:28:55.141224	t	\N
259a2816-e744-4468-ad4b-cce35f76fba2	Jherald	Broka	\N	\N	\N	\N	2025-11-29 22:04:15.369119	t	\N
f21bf228-2521-460f-9009-84d94ea4bf72	maria	mendoza	\N	\N	\N	\N	2025-12-02 22:09:40.623994	t	\N
fabdb0bf-bfc6-414a-9ab1-2b17c7afba56	maria	mendoza	\N	\N	\N	\N	2025-12-02 22:10:03.044449	t	\N
ee88dae4-cb05-4e65-95c9-791436f0750b	Alicia	Poma	\N	\N	\N	\N	2025-12-03 17:46:47.320971	t	\N
5f9daf21-5428-4bdf-a221-2161c22ee05d	Jheral	Maquera	\N	\N	\N	\N	2025-12-03 17:46:16.306883	t	\N
d5999e8e-ebe2-4e48-b55c-f9a3b2e1344b	Ttt	Tt	\N	\N	\N	\N	2025-12-03 17:47:30.11923	t	\N
452375b9-1ae1-41a0-9691-c236e23c5e3e	Juan	Pérez García	98765432	1985-03-15	999888777	juan.perez@email.com	2025-11-29 03:40:39.670735	t	\N
6e1f0e90-0f5a-4862-be64-1088ea99a30f	Juan	Mamani Quispe	\N	\N	\N	\N	2025-12-02 03:45:16.934238	t	\N
eaf405dd-4a67-4bc7-b36b-af4449dfd5e5	Mario	Flores Mamani	\N	\N	\N	\N	2025-12-02 03:45:52.536864	t	\N
289a8ba6-f4fd-4fd9-b07d-252ab3a2e4fc	Jose	Pedro	\N	\N	\N	\N	2025-12-02 04:02:56.111374	t	\N
4422c38b-5ce6-4d45-a343-d42b9cff442b	hola	hola	\N	\N	\N	\N	2025-12-02 04:21:52.116024	t	\N
27f76a07-22e3-43a4-bb87-91a37e901227	Noemi	Quicaño	\N	\N	\N	\N	2025-12-03 05:54:24.489007	t	\N
00b9cb19-86b0-47a1-bfe2-eca2f0539c24	Edu	Puma	\N	\N	\N	\N	2025-12-02 15:13:28.187043	t	\N
be948f70-3ced-49a5-aa07-7f96c382695a	aaaa	aaaaaaa	\N	\N	\N	\N	2025-12-02 15:18:11.672111	t	\N
5c9b4c93-3113-47fa-a7d8-62af5d2afca0	A	Aa	\N	\N	\N	\N	2025-12-03 17:50:30.232895	t	\N
28c5cee3-ba53-49e2-913a-26b500987ab2	Edu	Quispe	\N	\N	\N	\N	2025-12-01 07:19:10.0066	t	\N
4e10bac3-8905-4d4d-9ce7-4fb7b1bd45e3	Fer	Mamani	\N	\N	\N	\N	2025-12-04 04:05:43.681546	t	\N
8035b4b5-c222-4f2e-a60e-3ab960a7e8a0	Luz	Flores	\N	\N	\N	\N	2025-12-03 17:50:43.285192	t	\N
b8ac953c-d29a-4372-9110-27ca64584d7b	suares	quispe	\N	\N	\N	\N	2025-12-04 00:32:32.567739	t	\N
32df98da-d89d-45e0-b972-c7b74839ede1	Carla	Arana	\N	\N	\N	\N	2025-12-02 15:18:10.737741	t	\N
a11be5fc-468b-4d25-b2cc-de7d70a21e7f	lucas	mamani123	\N	\N	\N	\N	2025-12-01 07:00:40.95454	t	\N
0fd49024-6388-4ba3-9fc4-3f3c5783f109	Pedro	Jimenez	\N	\N	\N	\N	2025-12-04 01:04:37.423695	t	\N
f274c44e-fb38-4c5e-b3e7-ebe5632165a6	maria	mendoza	\N	\N	\N	\N	2025-12-03 00:03:52.102703	t	\N
4506038f-df98-44d3-8e72-ba01a7cec46c	noemi	quecaño	\N	\N	\N	\N	2025-12-03 05:54:23.665071	t	\N
ed7a8a0e-9f68-4d98-80ca-2c8ee4a8acf0	noemi	quecaño	\N	\N	\N	\N	2025-12-03 05:55:49.416763	t	\N
d0f0812e-a63a-4d5c-ad61-68ece32c97d8	noemi	quecaño	\N	\N	\N	\N	2025-12-03 05:55:50.044518	t	\N
b66ae5c7-9da5-4c05-a0fe-23e7cc0ce9df	JOse	ara	\N	\N	\N	\N	2025-12-03 06:06:21.925882	t	\N
65a566f4-8f92-4dba-8374-91859c85d6ca	lucas	mamani123	\N	\N	\N	\N	2025-12-01 07:01:50.832512	t	\N
142c5047-c60e-495e-8fa9-e2d1f39e3f10	Jose	Maritenz	\N	\N	\N	\N	2025-12-02 02:14:14.08773	t	\N
bd49dace-f08b-4a71-b7a7-b64a85a27d87	Pepe	Mejia	\N	\N	\N	\N	2025-12-04 04:07:38.617054	t	\N
78e7e870-0297-4496-a425-40e3b09eb52e	Luz	Flores	\N	\N	\N	\N	2025-12-03 17:43:08.907237	t	\N
e20fa079-33a6-470a-bba1-eee759fe2449	Luz	Flores	\N	\N	\N	\N	2025-12-03 17:43:27.966022	t	\N
57b0f39f-3885-4cd8-9bc3-c690a90675e8	Luz	Flores	\N	\N	\N	\N	2025-12-03 17:43:41.892642	t	\N
de85c32f-1d24-489f-9857-48053f2ea898	Luz	Flores	\N	\N	\N	\N	2025-12-03 17:43:52.152642	t	\N
c9abbb13-174d-4f1f-b9d1-66bd868577a3	Luza	Flores	\N	\N	\N	\N	2025-12-03 17:44:16.018724	t	\N
33611049-daf4-4876-a20d-c2d5c88e2490	Aaaa	Eeee	\N	\N	\N	\N	2025-12-03 17:45:13.659207	t	\N
23a30fd3-cd97-4fc2-83f1-257d66db950b	Maria	Mendoza	\N	\N	\N	\N	2025-12-02 22:09:28.169649	t	\N
29da4387-a3a0-4359-b096-3481dead5948	Pedro	Suares	\N	\N	\N	\N	2025-12-04 00:44:06.006074	t	\N
2ef8818a-c56f-4073-b1bb-b0bc662b29bd	Jose	Puma	\N	\N	\N	\N	2025-12-03 06:15:11.865318	t	\N
50fabc5f-b7a6-479c-bc13-9c95a872867d	Fabiana	Mamani	\N	\N	\N	\N	2025-12-04 04:06:33.983784	t	\N
30f4f06e-bbc1-4e9f-88ab-a55bd1b47514	Lucho	Quispe	\N	2025-11-28	\N	\N	2025-11-28 08:05:38.559503	t	\N
23863fa5-3f4d-4e38-9043-c6e18f2c7bf2	Eduardo	Soto	\N	\N	\N	\N	2025-11-29 23:19:45.915352	t	\N
27346225-ed85-4823-9398-bd969c2da82a	Alexis	Flores	\N	\N	\N	\N	2025-11-30 00:45:29.10361	t	\N
addbd4a0-80e2-40bb-99eb-1840f775dde2	Patricia	López	\N	\N	\N	\N	2025-11-30 01:24:31.384362	t	\N
2fd369e7-7d62-4140-9d52-c0dd302d5848	Edgar	Candia	\N	\N	\N	\N	2025-11-30 01:49:11.642326	t	\N
40d87d99-2512-4361-a491-7ab45b63b6ee	Eduardo	Pumacahua	\N	\N	\N	\N	2025-11-30 02:28:43.119096	t	\N
35f97370-aee6-4a54-bb89-2d3d2125e203	Edu	Quispe	\N	\N	\N	\N	2025-12-01 07:20:54.02344	t	\N
ae2b376e-367e-4e99-ae89-8d1cacc204c7	Juann	Sin definir	\N	2007-11-29	\N	\N	2025-11-29 04:06:29.114088	t	\N
b4b9e480-8ce9-4971-be39-34d7e669a2b7	Alberto	Condori	\N	\N	\N	\N	2025-11-29 22:41:01.836331	t	\N
79c4c22c-f803-4f5e-adf6-e20fb4832590	Roberto	Sánchez	\N	\N	\N	\N	2025-11-30 02:44:31.950614	t	\N
7dd96816-e619-4815-a90c-d3aafecf908f	Andrea	Silva	\N	\N	\N	\N	2025-11-30 02:49:52.687789	t	\N
c21fd25f-7a6a-48f6-b170-3daa1739ea3f	Pedro	Morales	\N	\N	\N	\N	2025-11-30 02:51:06.966062	t	\N
2e9ca220-6936-4319-8df5-db4ab073d05a	Jeanpiero	Rivera	\N	\N	\N	\N	2025-11-30 02:57:00.005017	t	\N
7a722e20-1328-4908-90cd-1d1925e21f0f	Pablo	Chávez	\N	\N	\N	\N	2025-11-30 02:59:50.964497	t	\N
c4c21a46-81ee-45b3-b5a2-89cd5efd451f	Carlos	Mendoza	\N	\N	\N	\N	2025-11-30 03:19:32.495722	t	\N
83089da5-791f-4335-9907-6980d2f37f98	María	González	\N	\N	\N	\N	2025-11-30 03:50:32.135321	t	\N
686b8cd7-ad45-4188-b16f-980560860fa6	Luis	Rodríguez	\N	\N	\N	\N	2025-11-30 03:54:56.08986	t	\N
63bf6a83-99e8-4207-b86d-985db2eb74be	Ana	Torres	\N	\N	\N	\N	2025-11-30 03:59:01.171315	t	\N
c7f407f9-a410-432d-a68d-5594866e8437	Jorge	Ramírez	\N	\N	\N	\N	2025-11-30 04:19:00.546238	t	\N
4a356b7e-97d7-49b4-b8f7-ca0851a44296	Antonio	Zapata	\N	\N	\N	\N	2025-11-30 04:23:46.680951	t	\N
c3793754-bbef-46fd-a91c-5541c1c3ce60	Mónica	Martínez	\N	\N	\N	\N	2025-11-30 04:26:24.404297	t	\N
3206c59f-f863-4c6f-87f0-dbe93776d353	Kiara	García	\N	\N	\N	\N	2025-11-30 04:38:23.012658	t	\N
0fdabf9f-5c60-4e87-8071-cba829174a37	María	Peña	\N	\N	\N	\N	2025-11-30 04:41:08.88719	t	\N
4b482626-6101-4a81-82f2-b917deef90cd	Andrés	Díaz	\N	\N	\N	\N	2025-11-30 04:56:06.99591	t	\N
7cbb45b2-ff06-4cc0-981a-a7224c08cb35	Sofía	Herrera	\N	\N	\N	\N	2025-11-30 04:58:24.68366	t	\N
88135d69-e372-42e8-8e28-2bc4709d2ccc	Valeria	Castro	\N	\N	\N	\N	2025-11-30 05:44:04.306383	t	\N
07892680-1308-4434-b4e4-143f6c2fb1fe	Rodrigo	Puma	\N	\N	\N	\N	2025-12-01 05:34:24.656869	t	\N
39e92b4f-81d3-45af-9ab9-86302b74bcff	Miguel	Huaman	\N	\N	\N	\N	2025-12-01 05:40:38.15472	t	\N
c7e34b83-a345-4d5f-8ddb-92d1b11c0df0	Lucas	Mamani	\N	\N	\N	\N	2025-12-01 06:59:28.683715	t	\N
102fb8e3-2030-4ae8-a4ba-42ef289404c6	Pablo	Loza	\N	\N	\N	\N	2025-12-04 14:34:50.736973	t	\N
fa98851e-99cc-4350-adfb-c170899f0fbe	Pablo	Loza	\N	\N	\N	\N	2025-12-04 14:34:55.562241	t	\N
f79c5cc8-abbc-4327-8bbc-88b403dad0ad	Ricardo	Condori Rivera	\N	\N	\N	\N	2025-12-14 22:48:35.415741	t	\N
1b4e2d3d-70c3-4642-89be-74ff0fe49cf1	alexis	condori	\N	\N	\N	\N	2025-12-15 23:51:52.419594	t	\N
6e524038-b488-4416-827b-88c8d13c27a6	Jheral	Maquera	\N	\N	\N	\N	2026-04-23 03:46:16.024691	t	\N
ce900b37-9647-4a6d-b10f-27fcd5dff71b	lucas	2312	\N	\N	\N	\N	2026-05-25 06:09:06.23616	t	\N
04b37a96-f355-400e-ba45-39522f52b925	lucas	2312	\N	\N	\N	\N	2026-05-25 06:09:13.978881	t	\N
1a4273a1-7964-46b5-ad47-b62caf1d440b	fg	fgf	\N	\N	\N	\N	2026-05-25 06:10:02.088142	t	\N
d847a7d2-81f2-4445-89ef-465f7be4a31e	asdasd	asdasd	\N	\N	\N	\N	2026-05-25 16:32:34.047246	t	\N
25ff6391-acea-4298-8635-00291ea296f2	lucas	Quispe	\N	\N	\N	\N	2026-05-26 17:13:10.273633	t	\N
3a7ceb85-001f-4336-9790-9a9b1b3baa59	Edu	Quispe	\N	\N	\N	\N	2026-05-26 18:16:01.42628	t	\N
54b133b8-145d-4487-b529-2028aa4dc624	Jheral	quispe	\N	\N	\N	\N	2026-05-26 18:19:09.334903	t	\N
8ba88d58-e42b-4baf-a0ef-079f2c76f41d	juan	prez	\N	\N	\N	\N	2026-05-26 18:24:55.346498	t	\N
6da0f9b0-e824-4077-93e0-74dc4de6378a	asdasd	asdasd	\N	\N	\N	\N	2026-05-27 16:55:57.8733	t	\N
b0cb5e24-88bc-4dd9-9e65-d34d1a0b98fd	asdasd	asdasd	\N	\N	\N	\N	2026-05-27 16:56:07.865297	t	\N
45c68765-d5cc-45f6-a48e-2d7b1bf7f708	asdasd	asdasd	\N	\N	\N	\N	2026-05-27 16:56:09.812877	t	\N
c1843544-3bcd-4b32-aa6a-0b11b18a9ab5	juancito	pres	\N	\N	\N	\N	2026-05-27 16:56:30.190911	t	\N
d39effc2-90be-40e8-8d1a-9d6e246fa24b	Jheral	Maquera	\N	\N	\N	\N	2026-05-27 17:00:33.082582	t	\N
2de51aed-c36e-4e3f-9f4f-0bb6c1ee5881	Jheral	MAquera	\N	\N	\N	\N	2026-05-27 17:00:57.969867	t	\N
1fd51720-d764-4303-877c-1fddfa431f53	Jheral	MAquera	\N	\N	\N	\N	2026-05-27 17:01:34.42513	t	\N
a7e50fac-40c0-43e5-9e47-936c6c4926be	asdasd	asdasasda	\N	\N	\N	\N	2026-05-27 17:06:02.815799	t	\N
35243c08-cc0c-4c86-aa4f-68861598e9cb	jheral	maquera	\N	\N	\N	\N	2026-05-27 17:07:16.479049	t	\N
0ef492ea-aaf9-4016-86d5-dfc8cd510a42	jheral	maquera	\N	\N	\N	\N	2026-05-27 17:07:20.129188	t	\N
5b562bf4-73a6-4fcb-8dd6-42b246115df0	jheral	maquera	\N	\N	\N	\N	2026-05-27 17:07:29.245579	t	\N
d531d703-4dd1-46dd-9ea7-69723971b38e	jheral	maquera	\N	\N	\N	\N	2026-05-27 17:07:36.514655	t	\N
18909b4b-e2a4-40ba-9228-af043a3e8511	jheral	maquera	\N	\N	\N	\N	2026-05-27 17:08:00.169012	t	\N
220952ee-271f-4751-ac8a-0faa7263ff17	jheral	maquera	\N	\N	\N	\N	2026-05-27 17:08:08.57212	t	\N
4c14eb96-e6a2-4542-9012-0271be0cda8a	jheral	maquera	\N	\N	\N	\N	2026-05-27 17:08:12.865516	t	\N
0307d6df-14bd-4202-b210-b560556e7bb8	Jheral	MAquera	\N	\N	\N	\N	2026-05-27 17:10:47.392388	t	\N
f1ca5536-2eed-47ab-a8d5-e745691d00cc	Jheral	MAquera	\N	\N	\N	\N	2026-05-27 17:10:53.637723	t	\N
75fbd424-a08a-409a-8506-6676bf7b2276	asdasd	asdasd	\N	\N	\N	\N	2026-05-27 17:12:09.119152	t	\N
13caee1b-8bae-4e41-9f21-2d27c740e4c7	asdasd	asdasd	\N	\N	\N	\N	2026-05-27 17:12:15.046954	t	\N
724de46e-d8ba-4548-b1bf-83b3f95eb541	asdasd	asdasd	\N	\N	\N	\N	2026-05-27 17:12:16.582508	t	\N
d146d991-a30e-47de-8c78-3aedb3d0d8fd	123123	123123	\N	\N	\N	\N	2026-05-27 17:13:14.170591	t	\N
f1195bf2-439a-4d4f-aae2-10c3cea8aa66	Jaja	jeje	\N	\N	\N	\N	2026-05-30 22:33:13.050919	t	\N
7b0f2ea7-65a5-4373-b4f9-13c587aaf9b2	Jaja	jeje	\N	\N	\N	\N	2026-05-30 22:33:18.219912	t	\N
ea08a8f5-45c8-4de9-9093-9cfb956b8ff2	Jaja	jeje	\N	\N	\N	\N	2026-05-30 22:33:30.371886	t	\N
def358f1-4d26-4f76-85c5-f31cb3776bf9	Jaja	jeje	\N	\N	\N	\N	2026-05-30 22:33:41.391373	t	\N
\.


--
-- Data for Name: pago_hc; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pago_hc (id_pago, id_historia, monto, fecha_pago, id_admin) FROM stdin;
\.


--
-- Data for Name: prescripcion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prescripcion (id_prescripcion, id_historia, medicamento, dosis, duracion, fecha, prescriptor, id_usuario) FROM stdin;
555d656b-5d53-41b3-9870-3f08ec2fe0c6	e144b73c-e19b-4457-a1c9-7d8635488602	asdasdasd	400mg cada 8h	7 dias	2026-05-30	Raul/Medico	de4cd964-3e8b-4552-b90a-1bd30cca2f21
\.


--
-- Data for Name: prestamo_equipo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prestamo_equipo (id_prestamo, id_equipo, id_estudiante, fecha_prestamo, fecha_devolucion_prevista, fecha_devolucion_real, estado, id_admin) FROM stdin;
\.


--
-- Data for Name: referencia_clinica; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referencia_clinica (id_ref, id_historia, id_clinica, observaciones, fecha, estado) FROM stdin;
\.


--
-- Data for Name: refresh_token; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_token (jti, id_usuario, revocado, reemplazado_por, expira_en, created_at) FROM stdin;
afcf7ed5-7807-46fd-a8c1-2911029e616e	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	5cccf415-eaf6-4424-8f95-e619171d7aa6	2026-06-08 15:09:38.222	2026-06-01 20:09:37.461336
5cccf415-eaf6-4424-8f95-e619171d7aa6	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	d37ebfca-17b0-4e02-8c1c-1b972ee0bbca	2026-06-08 15:32:21.314	2026-06-01 20:32:20.560332
4a379afd-460e-4f16-9b93-b23268f566ca	de4cd964-3e8b-4552-b90a-1bd30cca2f21	f	\N	2026-06-08 16:19:30.439	2026-06-01 21:19:30.149644
d37ebfca-17b0-4e02-8c1c-1b972ee0bbca	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	4a379afd-460e-4f16-9b93-b23268f566ca	2026-06-08 15:47:34.253	2026-06-01 20:47:33.492623
39acc7b5-f785-4c51-accb-898c3a8285d0	de4cd964-3e8b-4552-b90a-1bd30cca2f21	f	\N	2026-06-08 16:19:41.184	2026-06-01 21:19:40.900004
1e263e59-d0ec-431d-be28-94a4baeb198e	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	0d74fe2c-2c28-48aa-8a26-dc9baebb5fc0	2026-06-08 16:26:38.313	2026-06-01 21:26:38.024789
0d74fe2c-2c28-48aa-8a26-dc9baebb5fc0	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	\N	2026-06-08 16:27:29.95	2026-06-01 21:27:29.660859
d483dbc1-c6ad-4959-9d00-8fcd13bf8d8f	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	dbd9917f-37fe-4492-8c0b-1ebbb24acba1	2026-06-08 16:28:20.71	2026-06-01 21:28:20.422047
dbd9917f-37fe-4492-8c0b-1ebbb24acba1	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	d9927a3f-53be-4d99-81a7-2f5539185670	2026-06-08 17:49:04.976	2026-06-01 22:49:04.664128
d9927a3f-53be-4d99-81a7-2f5539185670	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	3b710c51-3ded-4441-9a98-71ebf2b28ded	2026-06-08 18:47:35.79	2026-06-01 23:47:35.475329
c02c324c-3787-4c71-a67e-fbfff2580908	de4cd964-3e8b-4552-b90a-1bd30cca2f21	f	\N	2026-06-08 20:09:16.605	2026-06-02 01:09:16.287976
b1127602-c458-4e3c-b160-051608c30349	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	495bc623-1fd9-4fdc-bdf8-06cd357ffd0d	2026-06-11 08:29:07.531	2026-06-04 13:29:05.82701
3b710c51-3ded-4441-9a98-71ebf2b28ded	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	164a635b-05ef-46f8-9af1-473bce8c46a9	2026-06-08 19:32:57.04	2026-06-02 00:32:56.760503
164a635b-05ef-46f8-9af1-473bce8c46a9	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	ff0326c7-4101-415f-813c-d5061d56d710	2026-06-08 20:09:16.605	2026-06-02 01:09:16.288808
ff0326c7-4101-415f-813c-d5061d56d710	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	\N	2026-06-08 20:24:35.116	2026-06-02 01:24:34.797846
a0739fa8-05a8-47b7-bb5d-c6e04f81a117	de3de424-02cb-40fa-980c-43fb185b2721	t	\N	2026-06-08 20:25:33.562	2026-06-02 01:25:33.251407
3ab099d1-3832-4766-bbc8-38b66dbb8d70	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	\N	2026-06-08 20:29:42.228	2026-06-02 01:29:41.918865
d310fbf5-470c-4747-baad-50ee978c6c22	de3de424-02cb-40fa-980c-43fb185b2721	t	f7628b24-2dea-41e7-9d61-e56ab62beddd	2026-06-08 20:30:59.063	2026-06-02 01:30:58.748153
f7628b24-2dea-41e7-9d61-e56ab62beddd	de3de424-02cb-40fa-980c-43fb185b2721	t	\N	2026-06-08 20:50:21.647	2026-06-02 01:50:21.333419
54f251b7-8ea4-44c2-8f25-dc221bebe299	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	d264a1e2-5684-4632-9090-5b293a9d2dcc	2026-06-08 21:00:09.34	2026-06-02 02:00:09.025516
d264a1e2-5684-4632-9090-5b293a9d2dcc	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	cb50b460-437c-4e44-9e81-b90b3a5538cd	2026-06-08 21:17:55.187	2026-06-02 02:17:54.894355
cb50b460-437c-4e44-9e81-b90b3a5538cd	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	74ed2a4f-76fc-4e29-a727-13c636ed5d33	2026-06-08 21:33:16.38	2026-06-02 02:33:16.074143
74ed2a4f-76fc-4e29-a727-13c636ed5d33	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	e518d44d-9118-48d5-ae97-f8d196843654	2026-06-08 21:48:20.595	2026-06-02 02:48:20.288122
e518d44d-9118-48d5-ae97-f8d196843654	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	686a1c79-1238-4b90-8ca9-982772738015	2026-06-08 22:06:56.245	2026-06-02 03:06:55.934308
686a1c79-1238-4b90-8ca9-982772738015	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	9b22023d-0fcf-4e86-ba4a-201adec77491	2026-06-08 22:37:20.432	2026-06-02 03:37:20.124037
9b22023d-0fcf-4e86-ba4a-201adec77491	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	7b131540-73c8-41f4-8247-d0737b411e64	2026-06-08 23:17:08.118	2026-06-02 04:17:07.805392
7b131540-73c8-41f4-8247-d0737b411e64	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	0e66db77-842d-489d-85fc-15bb07e9119f	2026-06-08 23:32:08.556	2026-06-02 04:32:08.252145
0e66db77-842d-489d-85fc-15bb07e9119f	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	a19715b4-06b1-4385-81ff-38db84f542e1	2026-06-08 23:48:48.727	2026-06-02 04:48:48.413096
00294fd2-3f78-44fe-ae83-6381d7834296	de3de424-02cb-40fa-980c-43fb185b2721	f	\N	2026-06-09 00:15:39.319	2026-06-02 05:15:39.00724
c3212ad2-93f8-4066-800a-885982b9ba8d	de3de424-02cb-40fa-980c-43fb185b2721	f	\N	2026-06-09 00:31:23.673	2026-06-02 05:31:23.361197
327c537a-a25b-4f34-af23-84384690ad9c	de3de424-02cb-40fa-980c-43fb185b2721	t	c3212ad2-93f8-4066-800a-885982b9ba8d	2026-06-09 00:15:56.928	2026-06-02 05:15:56.615203
ade71987-2794-42b7-bf4c-1815584de21d	de4cd964-3e8b-4552-b90a-1bd30cca2f21	f	\N	2026-06-09 00:34:49.413	2026-06-02 05:34:49.121681
05f2caf5-b608-4e6c-a670-00643ca2cf20	de4cd964-3e8b-4552-b90a-1bd30cca2f21	f	\N	2026-06-09 00:34:49.414	2026-06-02 05:34:49.122137
a19715b4-06b1-4385-81ff-38db84f542e1	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	05f2caf5-b608-4e6c-a670-00643ca2cf20	2026-06-09 00:10:55.544	2026-06-02 05:10:55.233582
6477cc65-6be5-4ab0-9795-031c85506d42	de4cd964-3e8b-4552-b90a-1bd30cca2f21	f	\N	2026-06-09 15:22:35.497	2026-06-02 20:22:35.08876
8f9fc544-a5ec-4ec1-93aa-31bd8b13d141	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	6477cc65-6be5-4ab0-9795-031c85506d42	2026-06-08 16:19:42.955	2026-06-01 21:19:42.681869
921af88e-5de8-4c81-b80b-5bc7672491de	de3de424-02cb-40fa-980c-43fb185b2721	f	\N	2026-06-09 15:22:42.836	2026-06-02 20:22:42.42724
9eb004c2-0508-44b0-be6c-9b462ea0472f	de3de424-02cb-40fa-980c-43fb185b2721	t	\N	2026-06-09 15:22:44.271	2026-06-02 20:22:43.866024
e5d6884d-9b9b-43d0-b9d5-75727f3a96ef	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	\N	2026-06-09 15:28:09.679	2026-06-02 20:28:09.26407
be3f91a7-3713-4522-b1f7-d5dec9f22115	de3de424-02cb-40fa-980c-43fb185b2721	f	\N	2026-06-10 01:35:45.872	2026-06-03 06:35:45.388387
6c95f038-9df7-419a-88bb-85b83a275541	de3de424-02cb-40fa-980c-43fb185b2721	t	be3f91a7-3713-4522-b1f7-d5dec9f22115	2026-06-10 01:20:37.859	2026-06-03 06:20:37.386257
e453a380-95f3-4e2c-ba2d-64047759f1b6	de4cd964-3e8b-4552-b90a-1bd30cca2f21	f	\N	2026-06-10 01:37:15.712	2026-06-03 06:37:15.244984
59008ea3-6354-42e9-aaa3-d403e50883a6	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	e453a380-95f3-4e2c-ba2d-64047759f1b6	2026-06-10 01:05:12.302	2026-06-03 06:05:11.8163
0a21b8d2-1427-4df0-903a-3ded4024ef0a	5ff69267-0b9c-41be-a692-abed4d53af7e	f	\N	2026-06-10 01:53:45.45	2026-06-03 06:53:44.971417
5dc95ef5-6b41-44f5-9f92-efd51362c3b3	b17ecf92-edb3-4546-8462-b4ddd39a032f	f	\N	2026-06-10 01:55:40.771	2026-06-03 06:55:40.297685
23482bee-55d6-4ec9-96a8-1f5485315a06	de4cd964-3e8b-4552-b90a-1bd30cca2f21	f	\N	2026-06-11 08:29:07.482	2026-06-04 13:29:05.777806
947dc84c-4f1f-4593-9eb8-1664ac54c7d3	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	b1127602-c458-4e3c-b160-051608c30349	2026-06-10 01:37:22.073	2026-06-03 06:37:21.599643
495bc623-1fd9-4fdc-bdf8-06cd357ffd0d	de4cd964-3e8b-4552-b90a-1bd30cca2f21	f	\N	2026-06-11 13:47:37.6	2026-06-04 18:47:35.759555
945d468c-2d8f-41af-ac28-106edd2702d8	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	634229c1-f3d4-43b3-b35e-c220f6edeb62	2026-06-11 13:47:50.381	2026-06-04 18:47:48.54043
634229c1-f3d4-43b3-b35e-c220f6edeb62	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	b5043a8f-e621-4956-8d73-7001a841a41c	2026-06-11 14:04:44.287	2026-06-04 19:04:42.438452
b5043a8f-e621-4956-8d73-7001a841a41c	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	\N	2026-06-11 14:39:00.943	2026-06-04 19:38:59.091695
e96e58bd-1f99-4919-80d9-17e98805dc06	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	\N	2026-06-11 14:41:11.316	2026-06-04 19:41:10.12918
300413bc-32f4-4343-90ef-f1e66da41b5e	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	e5153a31-33a7-477c-8393-fb530bd72e82	2026-06-12 12:09:25.662	2026-06-05 17:09:23.605217
e5153a31-33a7-477c-8393-fb530bd72e82	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	6a0102ed-bbf7-4e94-bc30-25728c7acee0	2026-06-12 12:24:36.351	2026-06-05 17:24:34.293686
6a0102ed-bbf7-4e94-bc30-25728c7acee0	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	9ead5574-01cf-4174-b767-ddaf5bbe752d	2026-06-12 12:39:41.661	2026-06-05 17:39:39.611394
9ead5574-01cf-4174-b767-ddaf5bbe752d	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	6bb10f5a-6b8f-4d7b-94c4-e6751e12ad15	2026-06-13 21:32:30.175	2026-06-07 02:32:26.55612
6bb10f5a-6b8f-4d7b-94c4-e6751e12ad15	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	15b65751-abe6-4d99-84ae-dbceb1278f28	2026-06-13 23:48:53.439	2026-06-07 04:48:49.819193
15b65751-abe6-4d99-84ae-dbceb1278f28	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	855d043b-8f37-47c2-aeb0-ebbb6a17b687	2026-06-14 00:06:19.88	2026-06-07 05:06:16.267859
01b45204-b4f8-4aed-b214-c6c44f173471	de4cd964-3e8b-4552-b90a-1bd30cca2f21	f	\N	2026-06-18 14:47:49.844	2026-06-11 19:47:47.168685
855d043b-8f37-47c2-aeb0-ebbb6a17b687	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	01b45204-b4f8-4aed-b214-c6c44f173471	2026-06-14 10:47:36.074	2026-06-07 15:47:32.681319
a81b472e-bb00-4374-b32b-5f446fc9c7df	de4cd964-3e8b-4552-b90a-1bd30cca2f21	t	\N	2026-06-18 14:47:58.154	2026-06-11 19:47:55.479382
8ec0aaf7-ce25-4199-b949-187ddf091215	de3de424-02cb-40fa-980c-43fb185b2721	t	\N	2026-06-18 14:49:47.893	2026-06-11 19:49:45.219886
d542b5d0-fb1d-4af9-a561-18524b5497ad	de4cd964-3e8b-4552-b90a-1bd30cca2f21	f	\N	2026-06-28 21:23:42.489	2026-06-22 02:23:37.420823
\.


--
-- Data for Name: revision_historia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.revision_historia (id_revision, id_historia, id_docente, fecha, id_estado_revision, observaciones) FROM stdin;
da322922-c1ec-43f7-8c08-5623383bb069	911c4e3e-96ba-4582-8758-7317d1c50d7c	5ff69267-0b9c-41be-a692-abed4d53af7e	2026-06-03	e2b3b8f8-20de-4213-b80a-65a9dbf2d26d	Revision de prueba docente1 (mejora validacion)
\.


--
-- Data for Name: usuario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuario (id_usuario, codigo_usuario, nombre, apellido, dni, email, rol, contrasena_hash, activo) FROM stdin;
00000000-0000-0000-0000-000000000000	SYSTEM	Sistema	Automatico	00000000	system@historiaclinica.local	admin	$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$hash	t
de4cd964-3e8b-4552-b90a-1bd30cca2f21	2023-119018	Vaquita	Marina	70801433	caflores@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$3LpAgbt2Q9nZCzKdMj/WIQ$J3Dq4u3K7/4+NrCduPhE1omYlROTFXrlNIjUTznZVkQ	t
cc3d2b62-cd07-41f7-a3de-43ebf5be8eda	2022-124008	Cristhiany	Lesly Conde Escobar	72154839	ccondeesc@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$i0PGfENF8tOgdU4xyUAGGQ$838o27Nzh3sCZBikUrHhMcFL5oezq/aiS6ObL3jTGI8	t
d6f37f1a-f8ef-467a-b17f-5823603dd767	2024-124031	Alicia	Danitza Vera Cohaila	85694712	averac@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$bB5qzQSpVs4gaaVfvPAk6g$XwSuoA69JC4fy9cz2yc3mgIK4aucvXrolqKM13X++m0	t
a519fd27-825e-42dc-9ed0-95eacbdbb5e0	2022-124009	Ariana	Ninel Condori Vilcape	79516342	ariana200381@gmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$BSR99cdO2Y8jbl4Ehq2mqg$I1eZok/RbAEP6SBa8aekg2MDXiqM/tm6GK5oUKEli70	t
8fc76451-87b3-4ed6-83bb-b3db65842929	2022-124010	Yusbel	Clever Mayta Chipana	70325641	ymaytachi@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$2YJnzDRzWbM4pJcDdxSwvg$uISvQqua2WPC9ncNsclfxY4Lbi/4dbc8/p6opXXSH2o	t
fcf4b66c-ac68-43b7-b314-f73d2555a0a5	2021-124021	Nicolett	Agnes Cahuana Tacuri	89564723	nacahuanat@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$90Suo61evqMGBBr9cJgA8g$R9G4bC8gGm79YVJS6XKfEAd1mrUBmd47t2Z5978kj50	t
b8727ab2-4006-4a75-bf4a-bd7f9228288f	2022-124003	Rodrigo	Fernando Laura Guadalupe	78154296	rlauragua@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$PEz0EjezOvwZGlOY0KmdFg$zLktLDXKGYyaTZR0VmYltuK123Oyt5cc7XJVh6J/2Z0	t
60edd6bc-3e3d-4873-a50b-d4a0d3195418	2021-124030	Mariela	Castro Quispe	86971253	mcastroq@gmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$SimYNWFyL2pFgtG2P77vSA$9P65Y6v8ocfpK5S7MnM/i4FTGAp1bNhLdbJtcF6+j1U	t
7c6b97f0-27bf-4ad2-af79-d42294e78fc9	2021-124035	Joselyn	Cori Ticona	79125684	jgfcorit@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$Q2pFh/ui0/lKKAN3FhFA8A$C/mY7zZrggeWf5LVpAvMtddIt1h2Qa5QOSYa4zTl4Hc	t
936cb450-875a-4ca8-9807-ef4bddc2393e	2022-124005	Nilo	Javier Sinticala Mamani	71859462	nsinticalamam@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$bu2mIefG7gIhuHkq8ygVEw$zLQMqd9dEUCI3nPFGmmDK6TwRigBB30U1czNom2LuX0	t
abcaeb82-22a9-41c4-a5d5-1254fa64b257	2022-124018	Kendra	Saraí Vilca Cabrera	84516792	kvilcaca@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$xkXSNW1bXfni8TdNA+4a0Q$3D68TxhGVR5rCzx4G6SylCyI+34CS6yIWgU1CoGYYIw	t
c2ed22f0-60b2-4217-a069-f36f81d02b5a	2021-124043	Henry	Romario Ortega Luque	75483169	ho23416@gmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$z//foB8YWxo8bDKTbtxrXA$3gFO5AFm8aK+gLuMln7OWc3NwfcmSLT7wvJ+PtByEQ0	t
fee06968-22a2-4469-b23e-ed1ecac91ca8	2022-124013	Mirian	Gabriela Mamani Mamani	80231564	mmamanimam@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$TUa/ub/n7MeFomu7dv2r2w$GZnF3gIBNvsRViib4By5/vppLLPeyXnDWcZ2NERkYvM	t
d4d1f1bc-f542-4e66-a588-30c14f1fde02	2011124008	Samuel	Rojas Cutipa	76254198	Evangeli_wor_22@hotmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$CrGLFgi83KsWIyrjyohb5Q$6itY9PIG98kFVS6uMocHwgNmtGWp8qIjmtQZB5lbnAc	t
a40a90e1-ab65-450d-bfc1-9a0f3fbf3fb6	2021-124024	Veronica	Gianella Garcia Montufar	71425983	Vggarciam@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$L8fFyGVYGscIHYvU+s/3Dg$n1DVYO+m7gDfQkBMRWkmIpfBg2sIroRrT/bMYvqtRGI	t
8a9bfde5-f699-45ce-8a97-0f813c8c3d12	2025-999999	Test	Usuario	99999999	test@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$CkUuKaMtXTqFsPX3HEHxBQ$eVdeiDv9/12aX7usLD3K8jNotji9JHT7mMUSHW2XKXs	t
49d91ec7-c505-4f00-b7c7-03f73ed50858	2025-119037	Tesat	Usuarido	99299999	tesdt@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$zUyRaWjb9i4v3tBhPN6i+w$dYjPT6UHGcvO9Tcl+6mYoGjxfr1R+Au2DwiNDeFNxqA	t
86f280cd-0629-4b17-93ab-fda897227fcf	2023-119015	Alexis	Condori	12345678	aecondorir@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$ndDhLV0s6itIaFVVkCv1EA$5Z2DRaD8M48D/i67dDI5HWAH0EJlq0B4uQNwR9yU1M8	t
5255fbc5-6216-4dd9-97c7-2d005ffc3e59	admin1	Admin	Principal	45362718	admin@email.com	admin	$argon2id$v=19$m=65536,t=3,p=4$sEnuFAKRLvGL+t/GqHxX5g$QHmVjuas9hUFlZ56Sobt3N9KGkV+YgR0/PfbpMegplk	t
72cf682f-5efb-483b-a8dc-334c4c7c8199	user123	Juan	Pérez	99999991	juan.perez@email.com	admin	$argon2id$v=19$m=65536,t=3,p=4$t3+E1CKhNUzVCU1+Zk0Abg$srK5Dm5h4Hikaq/Z4Hvsfim/osgdqmO/25cM3iVYIto	t
c307c998-bddc-4bb8-a030-a394a3ede6df	user124	Juan	Pérez	99919981	jan.perez@email.com	admin	$argon2id$v=19$m=65536,t=3,p=4$MfV0prV/GQ/R5q1IaEK4Lg$oXqwQz1siA0Z//g/9dySeL+kFDsCAutTc1o2EtX1sak	t
1a853221-41bd-4882-8069-04f15af776aa	1234	Juan	Pérez	11119981	jacn.perez@email.com	admin	$argon2id$v=19$m=65536,t=3,p=4$R1AQMSTeLQ84r5dban3kKw$cB+8l52xtRauKmGfd1EZ8n1cucfSCtdmzO8hbrB6iCc	t
2850a456-d3f6-4877-8e9b-37e0fc4ddc02	12345	Juan	Pérez	11119081	jaacn.perez@email.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$lC0xIGyMoZDaUowqnF19dQ$RfNTqugLdfrAa11QvFrDT6XzPLdrJW8ADNnh0WQaNfw	t
5f5e4e61-5d2d-45f9-be85-556b0e0e23df	U20250041	Juana	Péreza	91919191	juanasd.perez@example.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$bHWQmYbavD68uxUMparGYQ$FbQVNMGLDQk0Cw6nXI1zmpHx6XVQ8XzanzdttzEYwhU	t
75de7e06-9103-4cd2-b6c8-32e09abd4bef	2023-119053	Edu Puma 	Pua	92390193	poasd123@gmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$804gC4snQuha0YW+dWvl4Q$uT5ChWQW/YulVqtOQfg4T/hofvZIC9DVlYOpL1hKDdE	t
e4b9154e-9d48-429b-b895-b6ca99eac0aa	2023-119090	Rosa Ara	Quispe  Mamani	71289102	raquispem@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$M+KR/zyInZzE35jwlzidNg$8S54VXJ9ujoRwaqGrPWrBNHqAAoxjZd+w/sXE6IrHQY	t
da9a02e4-a0cb-4059-82d2-135d809154c0	2023119044	david	montoya	71470262	davidmontoya210204@gmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$D55Dz6t/lg8udkngdEVIBw$o/V54B2PYYuNQi5SlzhMFthAO0CyI0iDxBlWT3V07Fo	t
09ab7366-8386-49bf-a196-8d9a84751788	2023-119076	Ada	Puan	82829483	ad2sd@gmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$39D4Ml4aa1896pkYG57JKw$7yGsFfMcFHSQa4izPmXtuXusO1aql/BYwPkyC7UyPtY	t
63a9f46f-9473-49b6-8c41-444ecdaa4737	2022-154210	Juan	Perez	12523654	juan@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$Y47uxTg1ZWE6MOGnbue+gw$oVvPW560UpbSoCasFbqQO4gjENpNyRFVkgFZK0uq8/0	t
e44b5d20-d75e-4673-bd55-34a753f89853	2023-119045	Messi	Ronaldo	81928372	messi1@gmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$SGR7MAq8jyiMRJN9QdtL8g$n+ifsQKEcRLd0dLiYOefiXqhX/LRfaWocKbs2go+tEo	t
d4ae88aa-c0e4-4060-94e4-4e32e7f53090	2022-114026	Ana	Gomez	11111111	ana1@gmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$rQHxZq7akGucWF5ilGyguw$sJK7foUoxA3kWLJKSIFBMzat7p+mkAbbFnuOrUjivgU	t
6404bbdf-1e44-4562-9c01-2c2ff7b6e6ca	2023-119001	Cristian Ricardo	Condori Rivera	71711106	erik@gmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$6WvWITU1tsZRzFpX7VDWzg$M2welXQzuHWSV3uI8qT0PG++SZLB0DCBqU7nMyOiTX0	t
51e1e07e-76fc-49ff-b4ab-3d19366cfd3d	123	Stillz	Condori Rivera	74741404	ae@gmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$YhRU/1NfsF/P/E22hIO4WQ$JnHjeCxQH+Z03PZ9svZjLpxxBHUyk0KApX6SpNOPXN8	t
c6c8d452-dce5-406e-9c29-7d59ff8ec685	2024-119015	Alexis Erik	Condori Rivera	71717173	condoririveraalexis@gmail.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$GNvJNR4Z4wSWSYhIfCzzyA$dkwrNTFqLy1njXjFmvdedfAfuJvCLxvPqnTr2TB/3lw	t
997c61c1-cefb-4728-ad6e-1d3eb9d86f41	43215	Juan	Pérez	11119089	edgaperez@email.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$p5I+VF/FT0rZgrJeCfih1w$tIsG5zb9YTslXssJI74HL/7sCdy8EVP63gG0w2CaM+0	t
d5dc58ba-178d-48f3-b9d4-1e135d5bc0a7	U001	Edu	Puma	12345628	edu123@example.com	admin	$argon2id$v=19$m=65536,t=3,p=4$XrV//gXAWHJvW7DIycpRRg$cDl4oWt8m8T+aW8/CuG/JUzbY68cR8y1uARTgcuDsRA	t
6fb9ee68-a7fa-4b4d-a734-ca6bc7259ba1	88888	Juan	Pérez	11119059	edgdaperez@email.com	admin	$argon2id$v=19$m=65536,t=3,p=4$RtbcAtuEvUqrJEWkyHI6HQ$4DzrEXDvi0YEYdVOSbquW2fobWsqC4vJv2HgZ6zq0tQ	t
7e68d09f-77b2-4cf3-8096-53287094a703	2023-119052	Edu	Puma	71571783	ed12u@example.com	estudiante	$argon2id$v=19$m=65536,t=3,p=4$y1VhpiNzh43YWjgFs0IvZA$iq7CHUxRy4lP5s807b29h+TifqfHKnmp5dOkSXGAN0Q	t
de3de424-02cb-40fa-980c-43fb185b2721	2023-119013	Administrador	Pruebas	23119013	2023119013@unjbg.edu.pe	admin	$argon2id$v=19$m=65536,t=3,p=4$eGnadiLblpZ1rsDyx2UllA$N2l1MnKtuJbbYwz+7xm2HRl2v5VYZj/VgWaTzPz3ggU	t
5ff69267-0b9c-41be-a692-abed4d53af7e	docente1	Docente	Pruebas	00000001	docente1@unjbg.edu.pe	docente	$argon2id$v=19$m=65536,t=3,p=4$PFkVpRHqExyZXC2hHg+odQ$YcnV3sEkPtd4P8XwMXMxfACr4pYgwxoub5o747ScRHo	t
b17ecf92-edb3-4546-8462-b4ddd39a032f	2099-000001	Alumno	Prueba	99000001	2099000001@unjbg.edu.pe	estudiante	$argon2id$v=19$m=65536,t=3,p=4$yLD0iqWjO5QaxT5zpr3mTQ$Fams4SGRG77GDF7rpLrQNDsqTGx8Oz9RxDnUoTpIoWo	t
\.


--
-- Name: empleados_id_empleado_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.empleados_id_empleado_seq', 6, true);


--
-- Name: adjunto adjunto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjunto
    ADD CONSTRAINT adjunto_pkey PRIMARY KEY (id_adjunto);


--
-- Name: antecedente_cumplimiento antecedente_cumplimiento_id_historia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.antecedente_cumplimiento
    ADD CONSTRAINT antecedente_cumplimiento_id_historia_key UNIQUE (id_historia);


--
-- Name: antecedente_cumplimiento antecedente_cumplimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.antecedente_cumplimiento
    ADD CONSTRAINT antecedente_cumplimiento_pkey PRIMARY KEY (id_ant_cumplimiento);


--
-- Name: antecedente_familiar antecedente_familiar_id_historia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.antecedente_familiar
    ADD CONSTRAINT antecedente_familiar_id_historia_key UNIQUE (id_historia);


--
-- Name: antecedente_familiar antecedente_familiar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.antecedente_familiar
    ADD CONSTRAINT antecedente_familiar_pkey PRIMARY KEY (id_ant_fam);


--
-- Name: antecedente_medico antecedente_medico_id_historia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.antecedente_medico
    ADD CONSTRAINT antecedente_medico_id_historia_key UNIQUE (id_historia);


--
-- Name: antecedente_medico antecedente_medico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.antecedente_medico
    ADD CONSTRAINT antecedente_medico_pkey PRIMARY KEY (id_ant_patologico);


--
-- Name: antecedente_personal antecedente_personal_id_historia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.antecedente_personal
    ADD CONSTRAINT antecedente_personal_id_historia_key UNIQUE (id_historia);


--
-- Name: antecedente_personal antecedente_personal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.antecedente_personal
    ADD CONSTRAINT antecedente_personal_pkey PRIMARY KEY (id_antecedente);


--
-- Name: auditoria auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id_auditoria);


--
-- Name: catalogo_atm_trayectoria catalogo_atm_trayectoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_atm_trayectoria
    ADD CONSTRAINT catalogo_atm_trayectoria_pkey PRIMARY KEY (id_trayectoria);


--
-- Name: catalogo_clinica catalogo_clinica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_clinica
    ADD CONSTRAINT catalogo_clinica_pkey PRIMARY KEY (id_clinica);


--
-- Name: catalogo_dolor_grado catalogo_dolor_grado_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_dolor_grado
    ADD CONSTRAINT catalogo_dolor_grado_pkey PRIMARY KEY (id_grado);


--
-- Name: catalogo_enfermedad catalogo_enfermedad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_enfermedad
    ADD CONSTRAINT catalogo_enfermedad_pkey PRIMARY KEY (id_enfermedad);


--
-- Name: catalogo_estado_civil catalogo_estado_civil_descripcion_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_estado_civil
    ADD CONSTRAINT catalogo_estado_civil_descripcion_key UNIQUE (descripcion);


--
-- Name: catalogo_estado_civil catalogo_estado_civil_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_estado_civil
    ADD CONSTRAINT catalogo_estado_civil_pkey PRIMARY KEY (id_estado_civil);


--
-- Name: catalogo_estado_revision catalogo_estado_revision_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_estado_revision
    ADD CONSTRAINT catalogo_estado_revision_pkey PRIMARY KEY (id_estado_revision);


--
-- Name: catalogo_examen_auxiliar catalogo_examen_auxiliar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_examen_auxiliar
    ADD CONSTRAINT catalogo_examen_auxiliar_pkey PRIMARY KEY (id_examen);


--
-- Name: catalogo_grado_instruccion catalogo_grado_instruccion_descripcion_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_grado_instruccion
    ADD CONSTRAINT catalogo_grado_instruccion_descripcion_key UNIQUE (descripcion);


--
-- Name: catalogo_grado_instruccion catalogo_grado_instruccion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_grado_instruccion
    ADD CONSTRAINT catalogo_grado_instruccion_pkey PRIMARY KEY (id_grado_instruccion);


--
-- Name: catalogo_grupo_sanguineo catalogo_grupo_sanguineo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_grupo_sanguineo
    ADD CONSTRAINT catalogo_grupo_sanguineo_pkey PRIMARY KEY (id_grupo_sanguineo);


--
-- Name: catalogo_habito catalogo_habito_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_habito
    ADD CONSTRAINT catalogo_habito_pkey PRIMARY KEY (id_habito);


--
-- Name: catalogo_medida_regional catalogo_medida_regional_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_medida_regional
    ADD CONSTRAINT catalogo_medida_regional_pkey PRIMARY KEY (id_medida);


--
-- Name: catalogo_movimiento_mandibular catalogo_movimiento_mandibular_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_movimiento_mandibular
    ADD CONSTRAINT catalogo_movimiento_mandibular_pkey PRIMARY KEY (id_movimiento);


--
-- Name: catalogo_ocupacion catalogo_ocupacion_descripcion_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_ocupacion
    ADD CONSTRAINT catalogo_ocupacion_descripcion_key UNIQUE (descripcion);


--
-- Name: catalogo_ocupacion catalogo_ocupacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_ocupacion
    ADD CONSTRAINT catalogo_ocupacion_pkey PRIMARY KEY (id_ocupacion);


--
-- Name: catalogo_posicion catalogo_posicion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_posicion
    ADD CONSTRAINT catalogo_posicion_pkey PRIMARY KEY (id_posicion);


--
-- Name: catalogo_sexo catalogo_sexo_descripcion_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_sexo
    ADD CONSTRAINT catalogo_sexo_descripcion_key UNIQUE (descripcion);


--
-- Name: catalogo_sexo catalogo_sexo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogo_sexo
    ADD CONSTRAINT catalogo_sexo_pkey PRIMARY KEY (id_sexo);


--
-- Name: cita cita_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_pkey PRIMARY KEY (id_cita);


--
-- Name: derivacion_clinicas derivacion_clinicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.derivacion_clinicas
    ADD CONSTRAINT derivacion_clinicas_pkey PRIMARY KEY (id_derivacion);


--
-- Name: diagnostico diagnostico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostico
    ADD CONSTRAINT diagnostico_pkey PRIMARY KEY (id_diagnostico);


--
-- Name: empleados empleados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empleados
    ADD CONSTRAINT empleados_pkey PRIMARY KEY (id_empleado);


--
-- Name: enfermedad_actual enfermedad_actual_id_historia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enfermedad_actual
    ADD CONSTRAINT enfermedad_actual_id_historia_key UNIQUE (id_historia);


--
-- Name: enfermedad_actual enfermedad_actual_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enfermedad_actual
    ADD CONSTRAINT enfermedad_actual_pkey PRIMARY KEY (id_enfermedad_actual);


--
-- Name: epb epb_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.epb
    ADD CONSTRAINT epb_pkey PRIMARY KEY (id_epb);


--
-- Name: equipo equipo_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_codigo_key UNIQUE (codigo);


--
-- Name: equipo equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.equipo
    ADD CONSTRAINT equipo_pkey PRIMARY KEY (id_equipo);


--
-- Name: evolucion evolucion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolucion
    ADD CONSTRAINT evolucion_pkey PRIMARY KEY (id_evolucion);


--
-- Name: examen_auxiliar examen_auxiliar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_auxiliar
    ADD CONSTRAINT examen_auxiliar_pkey PRIMARY KEY (id_examen_auxiliar);


--
-- Name: examen_clinico_boca examen_clinico_boca_id_historia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_clinico_boca
    ADD CONSTRAINT examen_clinico_boca_id_historia_key UNIQUE (id_historia);


--
-- Name: examen_clinico_boca examen_clinico_boca_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_clinico_boca
    ADD CONSTRAINT examen_clinico_boca_pkey PRIMARY KEY (id_boca);


--
-- Name: examen_general examen_general_id_historia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_general
    ADD CONSTRAINT examen_general_id_historia_key UNIQUE (id_historia);


--
-- Name: examen_general examen_general_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_general
    ADD CONSTRAINT examen_general_pkey PRIMARY KEY (id_examen);


--
-- Name: examen_higiene_oral examen_higiene_oral_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_higiene_oral
    ADD CONSTRAINT examen_higiene_oral_pkey PRIMARY KEY (id_higiene);


--
-- Name: examen_regional examen_regional_id_historia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_regional
    ADD CONSTRAINT examen_regional_id_historia_key UNIQUE (id_historia);


--
-- Name: examen_regional examen_regional_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_regional
    ADD CONSTRAINT examen_regional_pkey PRIMARY KEY (id_regional);


--
-- Name: ficha_evaluacion ficha_evaluacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ficha_evaluacion
    ADD CONSTRAINT ficha_evaluacion_pkey PRIMARY KEY (id_evaluacion);


--
-- Name: ficha_operacion_auditoria ficha_operacion_auditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ficha_operacion_auditoria
    ADD CONSTRAINT ficha_operacion_auditoria_pkey PRIMARY KEY (id);


--
-- Name: ficha_operacion ficha_operacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ficha_operacion
    ADD CONSTRAINT ficha_operacion_pkey PRIMARY KEY (id_ficha);


--
-- Name: filiacion filiacion_id_historia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filiacion
    ADD CONSTRAINT filiacion_id_historia_key UNIQUE (id_historia);


--
-- Name: filiacion filiacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filiacion
    ADD CONSTRAINT filiacion_pkey PRIMARY KEY (id_filiacion);


--
-- Name: historia_clinica historia_clinica_id_paciente_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historia_clinica
    ADD CONSTRAINT historia_clinica_id_paciente_key UNIQUE (id_paciente);


--
-- Name: historia_clinica historia_clinica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historia_clinica
    ADD CONSTRAINT historia_clinica_pkey PRIMARY KEY (id_historia);


--
-- Name: iho_s iho_s_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iho_s
    ADD CONSTRAINT iho_s_pkey PRIMARY KEY (id_iho);


--
-- Name: motivo_consulta motivo_consulta_id_historia_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivo_consulta
    ADD CONSTRAINT motivo_consulta_id_historia_key UNIQUE (id_historia);


--
-- Name: motivo_consulta motivo_consulta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.motivo_consulta
    ADD CONSTRAINT motivo_consulta_pkey PRIMARY KEY (id_motivo);


--
-- Name: notificacion notificacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_pkey PRIMARY KEY (id_notificacion);


--
-- Name: odontograma_entrada odontograma_entrada_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontograma_entrada
    ADD CONSTRAINT odontograma_entrada_pkey PRIMARY KEY (id_entrada);


--
-- Name: odontograma_svg odontograma_svg_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontograma_svg
    ADD CONSTRAINT odontograma_svg_pkey PRIMARY KEY (id_svg);


--
-- Name: paciente paciente_dni_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT paciente_dni_key UNIQUE (dni);


--
-- Name: paciente paciente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paciente
    ADD CONSTRAINT paciente_pkey PRIMARY KEY (id_paciente);


--
-- Name: pago_hc pago_hc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago_hc
    ADD CONSTRAINT pago_hc_pkey PRIMARY KEY (id_pago);


--
-- Name: prescripcion prescripcion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescripcion
    ADD CONSTRAINT prescripcion_pkey PRIMARY KEY (id_prescripcion);


--
-- Name: prestamo_equipo prestamo_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prestamo_equipo
    ADD CONSTRAINT prestamo_equipo_pkey PRIMARY KEY (id_prestamo);


--
-- Name: referencia_clinica referencia_clinica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referencia_clinica
    ADD CONSTRAINT referencia_clinica_pkey PRIMARY KEY (id_ref);


--
-- Name: refresh_token refresh_token_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT refresh_token_pkey PRIMARY KEY (jti);


--
-- Name: revision_historia revision_historia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_historia
    ADD CONSTRAINT revision_historia_pkey PRIMARY KEY (id_revision);


--
-- Name: usuario usuario_codigo_usuario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_codigo_usuario_key UNIQUE (codigo_usuario);


--
-- Name: usuario usuario_dni_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_dni_key UNIQUE (dni);


--
-- Name: usuario usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_email_key UNIQUE (email);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id_usuario);


--
-- Name: idx_epb_historia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_epb_historia ON public.epb USING btree (id_historia, created_at);


--
-- Name: idx_ihos_historia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ihos_historia ON public.iho_s USING btree (id_historia, created_at);


--
-- Name: idx_odonto_hallazgo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_odonto_hallazgo ON public.odontograma_entrada USING btree (codigo_hallazgo);


--
-- Name: idx_odonto_svg_historia; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_odonto_svg_historia ON public.odontograma_svg USING btree (id_historia, tipo, created_at);


--
-- Name: idx_refresh_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_refresh_usuario ON public.refresh_token USING btree (id_usuario);


--
-- Name: antecedente_cumplimiento tr_auditoria_antecedente_cumplimiento; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_antecedente_cumplimiento AFTER INSERT OR DELETE OR UPDATE ON public.antecedente_cumplimiento FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: antecedente_familiar tr_auditoria_antecedente_familiar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_antecedente_familiar AFTER INSERT OR DELETE OR UPDATE ON public.antecedente_familiar FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: antecedente_medico tr_auditoria_antecedente_medico; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_antecedente_medico AFTER INSERT OR DELETE OR UPDATE ON public.antecedente_medico FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: antecedente_personal tr_auditoria_antecedente_personal; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_antecedente_personal AFTER INSERT OR DELETE OR UPDATE ON public.antecedente_personal FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: diagnostico tr_auditoria_diagnostico; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_diagnostico AFTER INSERT OR DELETE OR UPDATE ON public.diagnostico FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: enfermedad_actual tr_auditoria_enfermedad_actual; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_enfermedad_actual AFTER INSERT OR DELETE OR UPDATE ON public.enfermedad_actual FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: evolucion tr_auditoria_evolucion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_evolucion AFTER INSERT OR DELETE OR UPDATE ON public.evolucion FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: examen_clinico_boca tr_auditoria_examen_clinico_boca; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_examen_clinico_boca AFTER INSERT OR DELETE OR UPDATE ON public.examen_clinico_boca FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: examen_general tr_auditoria_examen_general; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_examen_general AFTER INSERT OR DELETE OR UPDATE ON public.examen_general FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: examen_regional tr_auditoria_examen_regional; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_examen_regional AFTER INSERT OR DELETE OR UPDATE ON public.examen_regional FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: filiacion tr_auditoria_filiacion; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_filiacion AFTER INSERT OR DELETE OR UPDATE ON public.filiacion FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: examen_higiene_oral tr_auditoria_higiene; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_higiene AFTER INSERT OR DELETE OR UPDATE ON public.examen_higiene_oral FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: motivo_consulta tr_auditoria_motivo_consulta; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_auditoria_motivo_consulta AFTER INSERT OR DELETE OR UPDATE ON public.motivo_consulta FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: derivacion_clinicas tr_derivacion_clinicas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tr_derivacion_clinicas AFTER INSERT OR DELETE OR UPDATE ON public.derivacion_clinicas FOR EACH ROW EXECUTE FUNCTION public.fn_auditoria_automatica();


--
-- Name: adjunto adjunto_id_historia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjunto
    ADD CONSTRAINT adjunto_id_historia_fkey FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia) ON DELETE CASCADE;


--
-- Name: adjunto adjunto_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjunto
    ADD CONSTRAINT adjunto_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: cita cita_id_estudiante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_id_estudiante_fkey FOREIGN KEY (id_estudiante) REFERENCES public.usuario(id_usuario);


--
-- Name: cita cita_id_historia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_id_historia_fkey FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia) ON DELETE CASCADE;


--
-- Name: cita cita_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cita
    ADD CONSTRAINT cita_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: epb epb_id_historia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.epb
    ADD CONSTRAINT epb_id_historia_fkey FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia) ON DELETE CASCADE;


--
-- Name: epb epb_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.epb
    ADD CONSTRAINT epb_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE SET NULL;


--
-- Name: ficha_evaluacion ficha_evaluacion_id_docente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ficha_evaluacion
    ADD CONSTRAINT ficha_evaluacion_id_docente_fkey FOREIGN KEY (id_docente) REFERENCES public.usuario(id_usuario);


--
-- Name: ficha_evaluacion ficha_evaluacion_id_ficha_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ficha_evaluacion
    ADD CONSTRAINT ficha_evaluacion_id_ficha_fkey FOREIGN KEY (id_ficha) REFERENCES public.ficha_operacion(id_ficha) ON DELETE CASCADE;


--
-- Name: ficha_evaluacion ficha_evaluacion_id_historia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ficha_evaluacion
    ADD CONSTRAINT ficha_evaluacion_id_historia_fkey FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia) ON DELETE CASCADE;


--
-- Name: ficha_operacion_auditoria ficha_operacion_auditoria_id_ficha_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ficha_operacion_auditoria
    ADD CONSTRAINT ficha_operacion_auditoria_id_ficha_fkey FOREIGN KEY (id_ficha) REFERENCES public.ficha_operacion(id_ficha) ON DELETE CASCADE;


--
-- Name: ficha_operacion_auditoria ficha_operacion_auditoria_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ficha_operacion_auditoria
    ADD CONSTRAINT ficha_operacion_auditoria_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: ficha_operacion ficha_operacion_id_historia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ficha_operacion
    ADD CONSTRAINT ficha_operacion_id_historia_fkey FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia) ON DELETE CASCADE;


--
-- Name: ficha_operacion ficha_operacion_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ficha_operacion
    ADD CONSTRAINT ficha_operacion_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: antecedente_familiar fk_antecedente_familiar_historia_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.antecedente_familiar
    ADD CONSTRAINT fk_antecedente_familiar_historia_clinica FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: auditoria fk_auditoria_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auditoria
    ADD CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: derivacion_clinicas fk_derivacion_historia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.derivacion_clinicas
    ADD CONSTRAINT fk_derivacion_historia FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: diagnostico fk_diagnostico_historia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostico
    ADD CONSTRAINT fk_diagnostico_historia FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: enfermedad_actual fk_enfermedad_actual_historia_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enfermedad_actual
    ADD CONSTRAINT fk_enfermedad_actual_historia_clinica FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: evolucion fk_evolucion_historia_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evolucion
    ADD CONSTRAINT fk_evolucion_historia_clinica FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: examen_auxiliar fk_examen_auxiliar_catalogo_examen_auxiliar; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_auxiliar
    ADD CONSTRAINT fk_examen_auxiliar_catalogo_examen_auxiliar FOREIGN KEY (id_examen) REFERENCES public.catalogo_examen_auxiliar(id_examen);


--
-- Name: examen_auxiliar fk_examen_auxiliar_historia_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_auxiliar
    ADD CONSTRAINT fk_examen_auxiliar_historia_clinica FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: examen_clinico_boca fk_examen_boca_historia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_clinico_boca
    ADD CONSTRAINT fk_examen_boca_historia FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: examen_general fk_examen_general_historia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_general
    ADD CONSTRAINT fk_examen_general_historia FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: examen_regional fk_examen_regional_historia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_regional
    ADD CONSTRAINT fk_examen_regional_historia FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: filiacion fk_filiacion_historia_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.filiacion
    ADD CONSTRAINT fk_filiacion_historia_clinica FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: examen_higiene_oral fk_higiene_historia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examen_higiene_oral
    ADD CONSTRAINT fk_higiene_historia FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: historia_clinica fk_historia_clinica_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historia_clinica
    ADD CONSTRAINT fk_historia_clinica_usuario FOREIGN KEY (id_estudiante) REFERENCES public.usuario(id_usuario);


--
-- Name: referencia_clinica fk_referencia_clinica_catalogo_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referencia_clinica
    ADD CONSTRAINT fk_referencia_clinica_catalogo_clinica FOREIGN KEY (id_clinica) REFERENCES public.catalogo_clinica(id_clinica);


--
-- Name: referencia_clinica fk_referencia_clinica_historia_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referencia_clinica
    ADD CONSTRAINT fk_referencia_clinica_historia_clinica FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: revision_historia fk_revision_historia_catalogo_estado_revision; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_historia
    ADD CONSTRAINT fk_revision_historia_catalogo_estado_revision FOREIGN KEY (id_estado_revision) REFERENCES public.catalogo_estado_revision(id_estado_revision);


--
-- Name: revision_historia fk_revision_historia_historia_clinica; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_historia
    ADD CONSTRAINT fk_revision_historia_historia_clinica FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia);


--
-- Name: revision_historia fk_revision_historia_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.revision_historia
    ADD CONSTRAINT fk_revision_historia_usuario FOREIGN KEY (id_docente) REFERENCES public.usuario(id_usuario);


--
-- Name: iho_s iho_s_id_historia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iho_s
    ADD CONSTRAINT iho_s_id_historia_fkey FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia) ON DELETE CASCADE;


--
-- Name: iho_s iho_s_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.iho_s
    ADD CONSTRAINT iho_s_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE SET NULL;


--
-- Name: notificacion notificacion_id_destinatario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacion
    ADD CONSTRAINT notificacion_id_destinatario_fkey FOREIGN KEY (id_destinatario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- Name: odontograma_entrada odontograma_entrada_id_historia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontograma_entrada
    ADD CONSTRAINT odontograma_entrada_id_historia_fkey FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia) ON DELETE CASCADE;


--
-- Name: odontograma_entrada odontograma_entrada_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontograma_entrada
    ADD CONSTRAINT odontograma_entrada_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: odontograma_svg odontograma_svg_id_historia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontograma_svg
    ADD CONSTRAINT odontograma_svg_id_historia_fkey FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia) ON DELETE CASCADE;


--
-- Name: odontograma_svg odontograma_svg_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.odontograma_svg
    ADD CONSTRAINT odontograma_svg_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE SET NULL;


--
-- Name: pago_hc pago_hc_id_admin_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago_hc
    ADD CONSTRAINT pago_hc_id_admin_fkey FOREIGN KEY (id_admin) REFERENCES public.usuario(id_usuario);


--
-- Name: pago_hc pago_hc_id_historia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pago_hc
    ADD CONSTRAINT pago_hc_id_historia_fkey FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia) ON DELETE CASCADE;


--
-- Name: prescripcion prescripcion_id_historia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescripcion
    ADD CONSTRAINT prescripcion_id_historia_fkey FOREIGN KEY (id_historia) REFERENCES public.historia_clinica(id_historia) ON DELETE CASCADE;


--
-- Name: prescripcion prescripcion_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prescripcion
    ADD CONSTRAINT prescripcion_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario);


--
-- Name: prestamo_equipo prestamo_equipo_id_admin_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prestamo_equipo
    ADD CONSTRAINT prestamo_equipo_id_admin_fkey FOREIGN KEY (id_admin) REFERENCES public.usuario(id_usuario);


--
-- Name: prestamo_equipo prestamo_equipo_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prestamo_equipo
    ADD CONSTRAINT prestamo_equipo_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.equipo(id_equipo) ON DELETE RESTRICT;


--
-- Name: prestamo_equipo prestamo_equipo_id_estudiante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prestamo_equipo
    ADD CONSTRAINT prestamo_equipo_id_estudiante_fkey FOREIGN KEY (id_estudiante) REFERENCES public.usuario(id_usuario);


--
-- Name: refresh_token refresh_token_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_token
    ADD CONSTRAINT refresh_token_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuario(id_usuario) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 056XbcYKUG9dgF7uLjuUsfVeaol1759B8Vgff3N2Jwibdbv7tL6mcDqnRBRBfmU

