/**
 * Middleware de autorización por rol. Debe ejecutarse DESPUÉS de authMiddleware
 * (que coloca req.user = { id, userCode, role }).
 *
 * Uso:  hcRoutes.post('/review', requireRole('docente', 'admin'), handler)
 *
 * Responde 401 si no hay usuario autenticado y 403 si el rol no está permitido.
 */
const requireRole =
  (...rolesPermitidos) =>
  (req, res, next) => {
    const role = req.user?.role;
    if (!role) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    if (!rolesPermitidos.includes(role)) {
      return res.status(403).json({
        error: `No autorizado: se requiere rol ${rolesPermitidos.join(' o ')}`,
      });
    }
    return next();
  };

export default requireRole;
