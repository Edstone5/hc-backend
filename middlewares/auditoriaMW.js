/**
 * Middleware de auditoría: registra automáticamente en la tabla `auditoria`
 * cada mutación (POST, PUT, PATCH, DELETE) realizada por un usuario autenticado.
 *
 * Diseño: no lanza errores — si el logging falla, la petición continúa.
 * Esto es intencional: la auditoría es observabilidad, no control de acceso.
 */
import { randomUUID } from 'crypto';
import pool from '../db/db.js';

// Tablas que se derivan de la ruta para registrar el contexto
function inferirNombreTabla(path) {
  const segmentos = path.split('/').filter(Boolean);
  // Eliminar UUIDs y parámetros numéricos para quedarnos con el recurso
  const recursos = segmentos.filter(
    (s) => !/^[0-9a-f-]{36}$/i.test(s) && !/^\d+$/.test(s)
  );
  return recursos[recursos.length - 1] || 'desconocido';
}

// Extraer UUID de la ruta si existe (para id_registro_afectado)
function extraerIdRuta(params) {
  for (const val of Object.values(params || {})) {
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        val
      )
    ) {
      return val;
    }
  }
  return null;
}

export function auditoriaMiddleware(req, res, next) {
  const metodosMutacion = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!metodosMutacion.includes(req.method)) {
    return next();
  }

  const bodyOriginal = res.json.bind(res);

  res.json = function (data) {
    // Solo auditar si el usuario está autenticado y la respuesta es exitosa
    const userId = req.user?.id;
    const statusCode = res.statusCode;

    if (userId && statusCode >= 200 && statusCode < 300) {
      const tabla = inferirNombreTabla(req.path || req.route?.path || '');
      const idRegistro =
        extraerIdRuta(req.params) || data?.id_historia || data?.id || null;

      pool
        .query(
          `INSERT INTO auditoria
            (id_auditoria, id_usuario, fecha_cambio, nombre_tabla, id_registro_afectado,
             accion, datos_anteriores, datos_nuevos, ip_address, user_agent)
           VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9)`,
          [
            randomUUID(),
            userId,
            tabla,
            idRegistro,
            req.method,
            null,
            req.body ? JSON.stringify(req.body) : null,
            req.ip || req.socket?.remoteAddress || null,
            req.headers?.['user-agent'] || null,
          ]
        )
        .catch(() => {
          // Silencio intencional: la auditoría no debe bloquear la respuesta
        });
    }

    return bodyOriginal(data);
  };

  next();
}
