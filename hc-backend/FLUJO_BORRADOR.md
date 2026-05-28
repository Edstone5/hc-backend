# Flujo de Historia Clínica en Borrador

## Arquitectura

### ¿Por qué Zustand y no Cookies?

| Aspecto          | Cookies            | Zustand                 | ✅ Decisión                             |
| ---------------- | ------------------ | ----------------------- | --------------------------------------- |
| **Persistencia** | Entre sesiones     | Solo sesión actual      | ✅ Zustand - El draft NO debe persistir |
| **Propósito**    | Autenticación      | Estado UI temporal      | ✅ Zustand - Es estado temporal         |
| **Limpieza**     | Manual/expiración  | Automática al refrescar | ✅ Zustand - Se limpia solo             |
| **Acceso**       | Servidor + Cliente | Solo Cliente            | ✅ Zustand - No necesita servidor       |
| **Complejidad**  | Más código         | Menos código            | ✅ Zustand - Más simple                 |

**Conclusión:** Cookies son para datos de sesión que el servidor necesita validar (JWT). Zustand es para estado temporal de UI que desaparece al refrescar.

---

## Flujo Completo

### 1. Usuario inicia nueva Historia Clínica

**Frontend:**

```javascript
// En Dashboard o Lista de Historias
import { useHistoriaStore } from '@/stores/historiaStore';
import { createDraftHistoria } from '@/services/historiaService';

const { setDraftHistoriaId } = useHistoriaStore();

const handleNuevaHistoria = async () => {
  // Crear o obtener borrador existente
  const { id_historia } = await createDraftHistoria();

  // Guardar en Zustand
  setDraftHistoriaId(id_historia);

  // Navegar a ruta dinámica
  navigate(`/historia/${id_historia}`);
};
```

**Backend:**

```
POST /api/hc/draft
Authorization: Bearer <token JWT>

Response:
{
  "success": true,
  "id_historia": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Historia clinica en borrador obtenida o creada"
}
```

**Base de Datos:**

```sql
-- Función: fn_obtener_o_crear_borrador
SELECT fn_obtener_o_crear_borrador('a1b2c3d4-...');

-- Primero busca borrador existente:
SELECT id_historia FROM historia_clinica
WHERE id_estudiante = 'a1b2c3d4-...' AND estado = 'borrador'
LIMIT 1;

-- Si no existe, inserta nuevo:
INSERT INTO historia_clinica (id_estudiante, estado, fecha_elaboracion)
VALUES ('a1b2c3d4-...', 'borrador', CURRENT_DATE)
RETURNING id_historia;

-- Si existe, devuelve el ID existente
```

**⚠️ IMPORTANTE:** Si el estudiante ya tiene un borrador, esta función **devuelve el ID del borrador existente** en lugar de crear uno nuevo. Esto evita tener múltiples borradores incompletos.---

### 2. Usuario navega a /historia/:id

**URL:** `http://localhost:5173/historia/550e8400-e29b-41d4-a716-446655440000`

**Componente:**

```javascript
import { useParams } from 'react-router-dom';
import { useHistoriaStore } from '@/stores/historiaStore';

function PaginaHistoria() {
  const { id } = useParams(); // ID de la URL
  const { draftHistoriaId } = useHistoriaStore();

  // Verificar si estamos en modo borrador
  const isDraft = draftHistoriaId === id;

  return (
    <div>
      <h1>Historia Clínica {isDraft && '(Borrador)'}</h1>
      <FormularioPaciente historiaId={id} />
    </div>
  );
}
```

---

### 3. Usuario llena formulario de paciente

**Frontend:**

```javascript
const handleSubmit = async (formData) => {
  // 1. Crear paciente
  const { id_paciente } = await crearPaciente(formData);

  // 2. Asignar paciente a la historia
  await assignPatientToHistoria(draftHistoriaId, id_paciente);

  // 3. Limpiar el draft
  clearDraftHistoriaId();

  // 4. Navegar a vista completa
  navigate(`/historia/${draftHistoriaId}/view`);
};
```

**Backend:**

```
PATCH /api/hc/assign-patient
Authorization: Bearer <token>

Body:
{
  "idHistory": "550e8400-e29b-41d4-a716-446655440000",
  "idPatient": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}

Response:
{
  "success": true,
  "message": "Paciente asignado a la historia clinica"
}
```

**Base de Datos:**

````sql
**Base de Datos:**
```sql
-- Función: fn_asignar_paciente_a_historia
SELECT fn_asignar_paciente_a_historia(
  '550e8400-e29b-41d4-a716-446655440000',
  'a1b2c3d4-e5f6-7890-1234-567890abcdef'
);

-- Valida:
-- ✅ Historia existe y estado='borrador'
-- ✅ Paciente existe
-- ✅ Paciente no tiene otra historia asignada

-- Actualiza:
UPDATE historia_clinica
SET
  id_paciente = 'a1b2c3d4-...',
  estado = 'en_proceso',
  ultima_modificacion = CURRENT_TIMESTAMP
WHERE id_historia = '550e8400-...';
````

````

---

## Casos Especiales

### ¿Qué pasa si el usuario refresca la página?

**Estado:** El `draftHistoriaId` se pierde (Zustand no persiste)

**Comportamiento esperado:**

1. Usuario ve `/historia/:id` pero sin contexto de draft
2. Puede ver la historia si ya está completa
3. Si está en borrador incompleto → mostrar mensaje "Historia no encontrada o incompleta"

**Solución:**

```javascript
// En PaginaHistoria.jsx
useEffect(() => {
  if (!draftHistoriaId && id) {
    // Verificar estado de la historia en BD
    fetchHistoriaStatus(id).then((historia) => {
      if (historia.estado === 'borrador') {
        // Redirigir a lista
        navigate('/historias', {
          replace: true,
          state: { message: 'Sesión de borrador expirada' },
        });
      }
    });
  }
}, []);
````

---

### ¿Qué pasa si el usuario cierra sin completar?

**Estado:** Draft queda en BD con `estado='borrador'` y `id_paciente=NULL`

**Soluciones:**

**Opción 1: Limpiar manualmente**

```javascript
// Botón "Cancelar" en formulario
const handleCancel = async () => {
  await deleteDraftHistoria(draftHistoriaId);
  clearDraftHistoriaId();
  navigate('/historias');
};
```

**Opción 2: Trigger de limpieza automática**

```sql
-- En la BD: Borrar drafts antiguos (>24h)
CREATE OR REPLACE FUNCTION limpiar_drafts_antiguos()
RETURNS void AS $$
BEGIN
  DELETE FROM historia_clinica
  WHERE estado = 'borrador'
    AND fecha_elaboracion < CURRENT_DATE - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Ejecutar diariamente con cron job
```

**Opción 3: Mostrar drafts en lista**

```javascript
// En ListaHistorias.jsx
const drafts = historias.filter((h) => h.estado === 'borrador');
const completadas = historias.filter((h) => h.estado !== 'borrador');

return (
  <>
    {drafts.length > 0 && (
      <section>
        <h2>Borradores Incompletos</h2>
        {drafts.map((draft) => (
          <DraftCard
            key={draft.id}
            onContinue={() => {
              setDraftHistoriaId(draft.id);
              navigate(`/historia/${draft.id}`);
            }}
            onDelete={() => deleteDraft(draft.id)}
          />
        ))}
      </section>
    )}

    <section>
      <h2>Historias Completas</h2>
      {/* ... */}
    </section>
  </>
);
```

---

## Testing en Insomnia

### 1. Crear borrador

```http
POST http://localhost:3000/api/hc/draft
Cookie: token=<JWT del estudiante>

# Respuesta esperada:
{
  "success": true,
  "id_historia": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Historia clinica en borrador creada"
}
```

### 2. Crear paciente

```http
POST http://localhost:3000/api/pacientes
Cookie: token=<JWT del estudiante>
Content-Type: application/json

{
  "dni": "12345678",
  "nombre": "Juan",
  "apellido_paterno": "Pérez",
  "apellido_materno": "García",
  "fecha_nacimiento": "1990-05-15",
  "sexo": "Masculino"
}

# Respuesta esperada:
{
  "success": true,
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}
```

### 3. Asignar paciente al draft

```http
PATCH http://localhost:3000/api/hc/assign-patient
Cookie: token=<JWT del estudiante>
Content-Type: application/json

{
  "idHistory": "550e8400-e29b-41d4-a716-446655440000",
  "idPatient": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
}

# Respuesta esperada:
{
  "success": true,
  "message": "Paciente asignado a la historia clinica"
}
```

---

## Resumen

✅ **Zustand** para draft ID (temporal, no persiste)
✅ **Cookies** para JWT (sesión, persiste)
✅ **Dos procedures** separados (crear + asignar)
✅ **Validación robusta** en BD (estado, existencia, duplicados)
✅ **Cleanup strategy** para drafts abandonados

**Ventajas de este enfoque:**

- URL dinámica disponible inmediatamente
- Separación clara de responsabilidades
- Estado temporal correctamente manejado
- Validaciones en BD garantizan consistencia
- Fácil de testear y debuggear
