# Especificaciones BDD - Archivos .feature Gherkin

## 📋 Archivos Creados

Se han generado **5 archivos .feature** en español en la carpeta `/hc-backend/features/`:

### 1. **HU-01-registro-historia-clinica.feature**
- **Escenarios:** 4
- **Focus:** Crear historias clínicas con validación de campos
- **Casos de prueba:**
  - Registro correcto con datos válidos
  - Rechazo sin datos obligatorios
  - Generación de ID único
  - Aparición en listado del estudiante

### 2. **HU-02-registro-filiacion.feature**
- **Escenarios:** 5
- **Focus:** Ingresar y actualizar datos de filiación
- **Casos de prueba:**
  - Registrar datos válidos
  - Actualizar datos existentes
  - Rechazar datos inválidos
  - Validar para historia inexistente
  - Historial de versiones con usuario y timestamp

### 3. **HU-03-historial-versiones.feature**
- **Escenarios:** 7
- **Focus:** Ver historial de cambios con auditoría
- **Casos de prueba:**
  - Accesibilidad del historial
  - Información de cambios (campo, valores, usuario, fecha)
  - Orden cronológico
  - Identificación de responsable
  - Historial vacío
  - Control de acceso por rol

### 4. **HU-04-busqueda-historias.feature**
- **Escenarios:** 7
- **Focus:** Búsqueda de historias clínicas
- **Casos de prueba:**
  - Búsqueda por estudiante
  - Búsqueda sin resultados
  - Respeto de permisos
  - Filtro por tipo de paciente
  - Múltiples resultados
  - Búsqueda por nombre (futuro)
  - Ordenamiento de resultados

### 5. **HU-07-validacion-comentarios.feature**
- **Escenarios:** 8
- **Focus:** Validación de historias y comentarios por docentes
- **Casos de prueba:**
  - Validación con comentario
  - Rechazo con observaciones
  - Notificación al estudiante
  - Registro en auditoría
  - Control de permisos
  - Múltiples validaciones
  - Observaciones opcionales

---

## 📊 Resumen de Especificaciones

| HU | Archivo | Escenarios | Camino Feliz | Camino Error |
|---|---|---|---|---|
| HU-01 | HU-01-registro-historia-clinica.feature | 4 | ✅ | ✅ |
| HU-02 | HU-02-registro-filiacion.feature | 5 | ✅ | ✅ |
| HU-03 | HU-03-historial-versiones.feature | 7 | ✅ | ✅ |
| HU-04 | HU-04-busqueda-historias.feature | 7 | ✅ | ✅ |
| HU-07 | HU-07-validacion-comentarios.feature | 8 | ✅ | ✅ |
| **TOTAL** | **5 archivos** | **31 escenarios** | **✅** | **✅** |

---

## 📁 Estructura de Carpetas

```
hc-backend/
├── features/
│   ├── HU-01-registro-historia-clinica.feature
│   ├── HU-02-registro-filiacion.feature
│   ├── HU-03-historial-versiones.feature
│   ├── HU-04-busqueda-historias.feature
│   ├── HU-07-validacion-comentarios.feature
│   └── step-definitions/
│       ├── hc-common.steps.js (Por implementar)
│       ├── registro.steps.js (Por implementar)
│       ├── busqueda.steps.js (Por implementar)
│       └── validacion.steps.js (Por implementar)
├── controllers/
├── models/
├── routes/
└── api.js
```

---

## 🚀 Próximos Pasos

### Fase 1: Instalación de Cucumber ✅ (Completado)
Los archivos .feature están listos en español (idioma: es)

### Fase 2: Instalación de Dependencias (Por hacer)
```bash
npm install --save-dev @cucumber/cucumber
npm install --save-dev @cucumber/messages
```

### Fase 3: Crear Step Definitions (Por hacer)
Implementar los pasos en:
- `/features/step-definitions/hc-common.steps.js`
- `/features/step-definitions/registro.steps.js`
- `/features/step-definitions/busqueda.steps.js`
- `/features/step-definitions/validacion.steps.js`

### Fase 4: Ejecutar Tests
```bash
npx cucumber-js features/ --require features/step-definitions/
```

### Fase 5: Generar Reportes
```bash
npx cucumber-js features/ --format html:cucumber-report.html
```

---

## 📖 Convenciones Utilizadas

### Palabras Clave en Español
- **Característica:** Define la feature
- **Como:** Role/Actor
- **Quiero:** Acción
- **Para:** Beneficio
- **Escenario:** Caso de prueba
- **Dado:** Precondiciones (Given)
- **Cuando:** Acción principal (When)
- **Entonces:** Resultado esperado (Then)
- **Y:** Conjunción para agregar más pasos

### Estructura de Datos
- **Antecedentes (Background):** Precondiciones compartidas
- **Tablas:** Para datos tabulares
- **Ejemplos:** Para escenarios parametrizados (si aplica)

---

## ✅ Checklist para el Informe

- [x] Identificadas 5 HU implementadas
- [x] Creados 5 archivos .feature
- [x] Escritos 31 escenarios BDD
- [x] Incluidos caminos felices y de error
- [x] Especificados criterios de aceptación
- [x] Incluidos antecedentes (backgrounds)
- [x] Documentado mapeo HU → Feature → Backend
- [ ] Instalar Cucumber en package.json
- [ ] Crear step-definitions
- [ ] Ejecutar y validar tests
- [ ] Generar reportes HTML
- [ ] Incluir evidencia en informe final

---

## 📝 Notas para el Informe

1. **Especificaciones Gherkin:** Las especificaciones están escritas en español para facilitar comprensión por stakeholders no técnicos
2. **Trazabilidad:** Cada HU tiene su archivo .feature correspondiente
3. **Cobertura:** Se cubren 31 escenarios (camino feliz + errores)
4. **Backend Validado:** Se verificó que cada HU tiene implementación backend en controladores y modelos
5. **Listo para Implementar:** Los step-definitions se pueden implementar directamente llamando a los endpoints REST

