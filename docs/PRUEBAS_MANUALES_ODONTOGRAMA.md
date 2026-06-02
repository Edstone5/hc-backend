# Guion de pruebas manuales — Odontograma NTS-188 (ADR-0029 → 0036)

> Re-prueba en navegador de TODO lo nuevo/cambiado desde la última prueba manual
> completa. Rama `feature/odontograma-nts150` (ambos repos). Marca ✅/❌ por paso.

## 0. Preparación

1. **Backend**: `cd hc-backend && npm run dev` (o el script de arranque del equipo).
2. **Frontend**: `cd hc-frontend && npm run dev` → abrir la URL de Vite.
3. **Datos de prueba** (si la BD está limpia):
   - Admin: `node db/seed-admin.mjs 2023-119013 esis123 admin`
   - Reportes RF-12: `node db/seed-reporte-odontograma.mjs` (usar `--clean` para
     re-sembrar).

---

## 1. Login y roles (ADR-0030/0031)

| #   | Paso                                | Esperado                                 |
| --- | ----------------------------------- | ---------------------------------------- |
| 1.1 | Login con `2023-119013` / `esis123` | Entra; Dashboard muestra vista **admin** |
| 1.2 | Login con una cuenta de estudiante  | Entra; vista estudiante                  |
| 1.3 | Login con credenciales erróneas     | Mensaje de error, no entra               |

## 2. Barra admin y logout (ADR-0030)

| #   | Paso                                                | Esperado                            |
| --- | --------------------------------------------------- | ----------------------------------- |
| 2.1 | Como admin, ir a una tarjeta (`/admin/*`) y navegar | La **barra superior NO desaparece** |
| 2.2 | Pulsar **Cerrar sesión** desde `/admin/*`           | Cierra sesión y vuelve a login      |

## 3. Menú lateral con zoom (ADR-0032)

| #   | Paso                                  | Esperado                             |
| --- | ------------------------------------- | ------------------------------------ |
| 3.1 | Como estudiante, abrir el odontograma | Menú lateral visible                 |
| 3.2 | Zoom del navegador a 150–200%         | El menú **hace scroll**, NO se corta |

## 4. Doble formación: fusión y germinación (ADR-0029/0032)

| #   | Paso                                                      | Esperado                                                                |
| --- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| 4.1 | Aplicar **Fusión** a una pieza con 2 vecinos libres       | Abre **modal** con las 2 opciones contiguas (clic/Tab, botones grandes) |
| 4.2 | Aplicar **Fusión** a pieza con 1 solo vecino libre        | Aplica directo, sin modal                                               |
| 4.3 | Probar fusión con la pieza **3.1**                        | Funciona: ofrece 4.1 (cruza línea media)                                |
| 4.4 | Sobre una pieza ya **fusionada**, aplicar **Germinación** | **Bloqueado** con mensaje                                               |
| 4.5 | Sobre una pieza con **germinación**, aplicar **Fusión**   | **Bloqueado** con mensaje                                               |

## 5. Diastema = paréntesis invertido )( (ADR-0034)

| #   | Paso                                  | Esperado                                        |
| --- | ------------------------------------- | ----------------------------------------------- |
| 5.1 | Aplicar **Diastema** entre dos piezas | Dibuja **)(** (paréntesis invertidos), NO una X |

## 6. Corona y corona temporal (ADR-0034)

| #   | Paso                        | Esperado                                   |
| --- | --------------------------- | ------------------------------------------ |
| 6.1 | Aplicar **Corona** (azul)   | Contorno cuadrado azul bordeando la corona |
| 6.2 | Aplicar **Corona temporal** | Contorno cuadrado **rojo** + sigla CT      |

## 7. Sección 7 · Otros hallazgos NTS-188 (ADR-0035)

| #    | Paso                                                                    | Esperado                                                |
| ---- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| 7.1  | **Caries ▾** → MB / CE / CD / CDP                                       | Escribe la sigla (rojo) en el recuadro                  |
| 7.2  | Aplicar dos severidades de caries en la **misma** pieza                 | La 2.ª queda **bloqueada** (exclusión caries-severidad) |
| 7.3  | **Endodoncia ▾** → TC, luego PC en la misma pieza                       | PC **bloqueado** (exclusión endodoncia)                 |
| 7.4  | **Posición anormal ▾** → M; luego D en la misma pieza                   | D **bloqueado** (exclusión posición)                    |
| 7.5  | Espigo muñón (EM)                                                       | Línea de raíz + cuadrado en corona                      |
| 7.6  | Remanente radicular (RR)                                                | Sigla RR (rojo)                                         |
| 7.7  | Supernumeraria (S)                                                      | "S" en círculo en zona apical                           |
| 7.8  | Sellante (S)                                                            | Sigla S (según color activo)                            |
| 7.9  | Superficie desgastada (DES)                                             | Sigla DES (rojo)                                        |
| 7.10 | Pieza en erupción                                                       | Flecha **zig-zag** hacia oclusal                        |
| 7.11 | Pieza extruida                                                          | Flecha recta hacia oclusal                              |
| 7.12 | Pieza intruida                                                          | Flecha recta hacia ápice                                |
| 7.13 | Verificar orientación de flechas en piezas **superiores vs inferiores** | Punta orientada correctamente por cuadrante             |

## 8. Restauración por material — NUEVO (ADR-0036)

| #   | Paso                                    | Esperado                                                          |
| --- | --------------------------------------- | ----------------------------------------------------------------- |
| 8.1 | **40. Restauración ▾**                  | Despliega: Definitiva (AM/R/IV/IM/IE, azul) + Temporal (RT, rojo) |
| 8.2 | Aplicar **AM** a una pieza              | Sigla AM (azul) en el recuadro                                    |
| 8.3 | Aplicar **IV** sobre la **misma** pieza | **Bloqueado** (exclusión restauración)                            |
| 8.4 | Aplicar **RT** sobre la misma pieza     | **Bloqueado** (excluyente con definitiva)                         |
| 8.5 | Aplicar IM / IE / R en piezas distintas | Cada una escribe su sigla                                         |

## 9. Exclusiones generales (ADR-0033)

| #   | Paso                                                            | Esperado                                              |
| --- | --------------------------------------------------------------- | ----------------------------------------------------- |
| 9.1 | Marcar pieza **AUSENTE** (DNE/DEX/DAO) y luego otro tratamiento | Otro tratamiento **bloqueado**                        |
| 9.2 | Macrodoncia + Microdoncia (o Clavija) en misma pieza            | 2.ª **bloqueada** (tamaño/forma)                      |
| 9.3 | Dos coronas en la misma pieza                                   | 2.ª **bloqueada**                                     |
| 9.4 | Giroversión D + I en misma pieza                                | 2.ª **bloqueada**                                     |
| 9.5 | Aplicar varios hallazgos válidos en la misma pieza              | Etiquetas **desfasadas** verticalmente, sin solaparse |

## 10. Eliminar tratamiento (ADR-0017)

| #    | Paso                                          | Esperado                                                |
| ---- | --------------------------------------------- | ------------------------------------------------------- |
| 10.1 | En "Tratamientos aplicados", eliminar un ítem | Borra su dibujo del SVG y limpia el recuadro del diente |

## 11. Guardar / cargar odontograma (RF-06)

| #    | Paso                                 | Esperado                                                   |
| ---- | ------------------------------------ | ---------------------------------------------------------- |
| 11.1 | Guardar cambios (INICIAL)            | Persiste; recargar y "Cargar guardado" rehidrata el editor |
| 11.2 | Guardar EVOLUCIÓN sin INICIAL previo | Se guarda como INICIAL (línea base) con aviso              |

## 12. Reportes Odontograma RF-12 (ADR-0026/0027/0031)

| #    | Paso                                       | Esperado                                                                                                |
| ---- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| 12.1 | Como admin, abrir **Reportes Odontograma** | Tabla con pacientes, prevalencia de caries y CPO-D                                                      |
| 12.2 | **Exportar CSV**                           | Descarga CSV con datos (no vacío); las nuevas restauraciones AM/IV/IM/IE cuentan como obturado en CPO-D |

---

## Resultado

- Fecha: ****\_\_**** · Tester: ****\_\_****
- Pasos ❌ (con detalle para abrir issue):
  - …
