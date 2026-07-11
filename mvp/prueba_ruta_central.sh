#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
#  Verificador de la RUTA CENTRAL PORTABLE  (demo de hexagonalidad PG↔MySQL)
#
#  Ejercita, contra el motor indicado en $BASE, el flujo central del sistema:
#     login → registrar historia → crear paciente → asignar paciente
#           → guardar filiación (sección) → listar → buscar → leer filiación
#
#  El MISMO backend/código corre en dos motores; sólo cambia DATABASE_URL:
#     BASE=http://localhost:3000/api  bash mvp/prueba_ruta_central.sh   # PostgreSQL
#     BASE=http://localhost:3001/api  bash mvp/prueba_ruta_central.sh   # MySQL
#
#  Requisitos: la pila del perfil mysql levantada
#     docker compose -f docker-compose.mvp.yml --profile mysql up -d --build
#  Credencial demo (sembrada en ambos motores): 2023-000001 / esis123
# ═══════════════════════════════════════════════════════════════════════════
set -u
BASE="${BASE:-http://localhost:3000/api}"
TMP="$(mktemp -d)"
JAR="$TMP/cookies.txt"
DNI=$(printf '%08d' $((RANDOM * RANDOM % 100000000)))   # DNI único por corrida

pass(){ echo "  ✅ $1"; }
fail(){ echo "  ❌ $1"; }

# Extrae un valor del JSON leyéndolo por STDIN (evita que node resuelva rutas:
# en Git Bash mktemp da rutas MSYS /tmp/... que node nativo de Windows no abre).
# Uso:  jval "o.id" < archivo.json     ·  jval "Array.isArray(o)?o.length:0" < a.json
jval(){ node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{let o;try{o=JSON.parse(s)}catch(_){console.log('');return}try{console.log(($1)??'')}catch(_){console.log('')}})"; }

echo "== Motor bajo prueba: $BASE =="

# 1) LOGIN ---------------------------------------------------------------------
code=$(curl -s -o "$TMP/login.json" -w "%{http_code}" -c "$JAR" \
  -H 'Content-Type: application/json' \
  -d '{"userCode":"2023-000001","password":"esis123"}' \
  "$BASE/users/login")
USERID=$(jval "o.id" < "$TMP/login.json")
if [ "$code" = "200" ] && [ -n "$USERID" ]; then pass "login 200 (userId=$USERID)"; else fail "login ($code) $(cat "$TMP/login.json")"; exit 1; fi

# 2) REGISTRAR HISTORIA (historia nueva cada corrida) --------------------------
code=$(curl -s -o "$TMP/reg.json" -w "%{http_code}" -b "$JAR" \
  -H 'Content-Type: application/json' -d '{}' "$BASE/hc/register")
HID=$(jval "o.id_historia" < "$TMP/reg.json")
if [ "$code" = "201" ] && [ -n "$HID" ]; then pass "register 201 (id_historia=$HID)"; else fail "register ($code) $(cat "$TMP/reg.json")"; exit 1; fi

# 3) CREAR PACIENTE (DNI único) ------------------------------------------------
code=$(curl -s -o "$TMP/pac.json" -w "%{http_code}" -b "$JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"nombre\":\"Paciente\",\"apellido\":\"Demo $DNI\",\"dni\":\"$DNI\",\"fechaNacimiento\":\"1995-03-20\",\"sexo\":\"F\",\"telefono\":\"952000111\",\"email\":\"p$DNI@example.com\"}" \
  "$BASE/patients")
PID=$(jval "o.id" < "$TMP/pac.json")
if [ "$code" = "201" ] && [ -n "$PID" ]; then pass "crear paciente 201 (id=$PID, dni=$DNI)"; else fail "crear paciente ($code) $(cat "$TMP/pac.json")"; exit 1; fi

# 4) ASIGNAR PACIENTE (historia → estado 'en_proceso') -------------------------
code=$(curl -s -o "$TMP/assign.json" -w "%{http_code}" -b "$JAR" -X PATCH \
  -H 'Content-Type: application/json' \
  -d "{\"id_historia\":\"$HID\",\"id_paciente\":\"$PID\"}" "$BASE/hc/assign-patient")
if [ "$code" = "200" ]; then pass "assign-patient 200 (estado='en_proceso')"; else fail "assign-patient ($code) $(cat "$TMP/assign.json")"; fi

# 5) GUARDAR FILIACIÓN (guardar una sección) -----------------------------------
code=$(curl -s -o "$TMP/fil.json" -w "%{http_code}" -b "$JAR" \
  -H 'Content-Type: application/json' \
  -d "{\"id_historia\":\"$HID\",\"raza\":\"Mestiza\",\"ocupacion\":\"Estudiante\",\"direccion\":\"Av. Bolognesi 123\",\"edad\":36,\"sexo\":\"F\",\"lugar\":\"Tacna\"}" \
  "$BASE/hc/filiacion")
if [ "$code" = "201" ]; then pass "filiacion 201 (sección guardada)"; else fail "filiacion ($code) $(cat "$TMP/fil.json")"; fi

# 6) LISTAR HISTORIAS DEL ESTUDIANTE -------------------------------------------
code=$(curl -s -o "$TMP/list.json" -w "%{http_code}" -b "$JAR" "$BASE/hc/student/$USERID")
N=$(jval "Array.isArray(o)?o.length:0" < "$TMP/list.json")
if [ "$code" = "200" ] && [ "$N" -ge 1 ]; then pass "listar historias 200 (n=$N)"; else fail "listar ($code, n=$N) $(cat "$TMP/list.json")"; fi

# 7) BUSCAR por DNI (ILIKE/LIKE + CAST + placeholders dialect-aware) -----------
code=$(curl -s -o "$TMP/search.json" -w "%{http_code}" -b "$JAR" "$BASE/hc/search?q=$DNI")
M=$(jval "Array.isArray(o)?o.length:0" < "$TMP/search.json")
if [ "$code" = "200" ] && [ "$M" -ge 1 ]; then pass "search 200 (coincidencias=$M para dni=$DNI)"; else fail "search ($code, n=$M) $(cat "$TMP/search.json")"; fi

# 8) LEER FILIACIÓN PERSISTIDA -------------------------------------------------
code=$(curl -s -o "$TMP/filget.json" -w "%{http_code}" -b "$JAR" "$BASE/hc/filiacion/historia/$HID")
RAZA=$(jval "(o.data||{}).raza" < "$TMP/filget.json")
if [ "$code" = "200" ] && [ "$RAZA" = "Mestiza" ]; then pass "leer filiacion 200 (raza='$RAZA' persistida)"; else fail "leer filiacion ($code) $(cat "$TMP/filget.json")"; fi

rm -rf "$TMP"
echo "== FIN =="
