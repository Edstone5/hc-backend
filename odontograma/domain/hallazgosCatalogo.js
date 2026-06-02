// Catálogo oficial de hallazgos del odontograma — SIHCE / NTS N° 150-MINSA/2022/DGIESP.
// Fuente de verdad del dominio. El frontend mantiene una copia equivalente en
// hc-frontend/src/pages/hc/ExamenFisico/hallazgosOdonto.js (mantener sincronizadas).
//
// estado: 'bueno' (sigla azul) | 'malo' (sigla roja) | 'neutro'
//   conforme a la regla de color de la NTS N° 150 (azul = buen estado,
//   rojo = mal estado). 'neutro' para hallazgos sin color definido.

export const HALLAZGOS_ODONTO = [
  { codigo: 'C', descripcion: 'Caries dental', estado: 'malo' },
  { codigo: 'O', descripcion: 'Obturación con amalgama', estado: 'bueno' },
  { codigo: 'R', descripcion: 'Obturación con resina', estado: 'bueno' },
  { codigo: 'Io', descripcion: 'Obturación con ionómero', estado: 'bueno' },
  { codigo: 'Co', descripcion: 'Corona', estado: 'bueno' },
  { codigo: 'Cf', descripcion: 'Carilla estética', estado: 'bueno' },
  { codigo: 'Cv', descripcion: 'Corona de metal', estado: 'bueno' },
  { codigo: 'Cmc', descripcion: 'Corona metal-cerámica', estado: 'bueno' },
  { codigo: 'Clm', descripcion: 'Corona libre de metal', estado: 'bueno' },
  { codigo: 'Ct', descripcion: 'Corona temporal', estado: 'malo' },
  { codigo: 'PPF', descripcion: 'Prótesis parcial fija', estado: 'bueno' },
  { codigo: 'PPR', descripcion: 'Prótesis parcial removible', estado: 'bueno' },
  { codigo: 'PDC', descripcion: 'Prótesis dental completa', estado: 'bueno' },
  { codigo: 'DNE', descripcion: 'Diente no erupcionado', estado: 'neutro' },
  { codigo: 'DEX', descripcion: 'Diente extraído / perdido', estado: 'malo' },
  { codigo: 'DAO', descripcion: 'Diente ausente otra causa', estado: 'neutro' },
  { codigo: 'I', descripcion: 'Impactación', estado: 'malo' },
  { codigo: 'IMP', descripcion: 'Implante dental', estado: 'bueno' },
  { codigo: 'E', descripcion: 'Pieza ectópica', estado: 'malo' },
  { codigo: 'PC', descripcion: 'Pieza en clavija', estado: 'malo' },
  { codigo: 'MAC', descripcion: 'Macrodoncia', estado: 'malo' },
  { codigo: 'MIC', descripcion: 'Microdoncia', estado: 'malo' },
  { codigo: 'GV-D', descripcion: 'Giroversión derecha', estado: 'malo' },
  { codigo: 'GV-I', descripcion: 'Giroversión izquierda', estado: 'malo' },
  { codigo: 'T', descripcion: 'Transposición', estado: 'malo' },
  { codigo: 'F', descripcion: 'Fusión', estado: 'malo' },
  { codigo: 'G', descripcion: 'Germinación', estado: 'malo' },
  {
    codigo: 'O-def',
    descripcion: 'Defecto del esmalte — Opacidad',
    estado: 'malo',
  },
  {
    codigo: 'PE',
    descripcion: 'Defecto del esmalte — Hipoplasia',
    estado: 'malo',
  },
  { codigo: 'FL', descripcion: 'Fluorosis', estado: 'malo' },
  { codigo: 'FFP', descripcion: 'Fosas y fisuras profundas', estado: 'malo' },
  { codigo: 'M', descripcion: 'Movilidad patológica', estado: 'malo' },
  { codigo: 'D', descripcion: 'Diastema', estado: 'malo' },
  { codigo: 'PP', descripcion: 'Pulpotomía', estado: 'bueno' },
  {
    codigo: 'Endo',
    descripcion: 'Endodoncia / tratamiento de conductos',
    estado: 'bueno',
  },
  { codigo: 'AOF', descripcion: 'Aparato ortodóntico fijo', estado: 'bueno' },
  {
    codigo: 'AOR',
    descripcion: 'Aparato ortodóntico removible',
    estado: 'bueno',
  },
  { codigo: 'Ed-S', descripcion: 'Edéntulo superior', estado: 'malo' },
  { codigo: 'Ed-I', descripcion: 'Edéntulo inferior', estado: 'malo' },
  // ── Hallazgos NTS N° 188-MINSA/DGIESP-2022 añadidos (ADR-0035) ──────────────
  // Caries por severidad (§6.1.16)
  { codigo: 'MB', descripcion: 'Caries — mancha blanca', estado: 'malo' },
  { codigo: 'CE', descripcion: 'Caries en esmalte', estado: 'malo' },
  { codigo: 'CD', descripcion: 'Caries en dentina', estado: 'malo' },
  {
    codigo: 'CDP',
    descripcion: 'Caries en dentina con compromiso pulpar',
    estado: 'malo',
  },
  { codigo: 'EM', descripcion: 'Espigo muñón', estado: 'bueno' }, // §6.1.8
  { codigo: 'RR', descripcion: 'Remanente radicular', estado: 'malo' }, // §6.1.32
  { codigo: 'SUP', descripcion: 'Pieza supernumeraria', estado: 'malo' }, // §6.1.26
  { codigo: 'SELL', descripcion: 'Sellante', estado: 'bueno' }, // §6.1.35
  { codigo: 'ERU', descripcion: 'Pieza en erupción', estado: 'neutro' }, // §6.1.23
  { codigo: 'EXT', descripcion: 'Pieza extruida', estado: 'malo' }, // §6.1.24
  { codigo: 'INT', descripcion: 'Pieza intruida', estado: 'malo' }, // §6.1.25
  // Posición anormal dentaria (§6.1.28): M/D/V/P/L
  { codigo: 'POS-M', descripcion: 'Posición: mesializado', estado: 'malo' },
  { codigo: 'POS-D', descripcion: 'Posición: distalizado', estado: 'malo' },
  { codigo: 'POS-V', descripcion: 'Posición: vestibularizado', estado: 'malo' },
  { codigo: 'POS-P', descripcion: 'Posición: palatinizado', estado: 'malo' },
  { codigo: 'POS-L', descripcion: 'Posición: lingualizado', estado: 'malo' },
  { codigo: 'DES', descripcion: 'Superficie desgastada', estado: 'malo' }, // §6.1.36
  { codigo: 'TC', descripcion: 'Tratamiento de conductos', estado: 'bueno' }, // §6.1.37
  { codigo: 'PLPC', descripcion: 'Pulpectomía', estado: 'bueno' }, // §6.1.37
  // Restauración definitiva por material (§6.1.33): superficies pintadas de azul +
  // sigla del material en azul mayúscula. (R ya existe arriba como resina; aquí se
  // añaden AM/IV/IM/IE con la nomenclatura exacta de la norma. O/Io se conservan
  // como códigos legados de "obturación" para compatibilidad con datos ya guardados.)
  { codigo: 'AM', descripcion: 'Restauración con amalgama', estado: 'bueno' },
  {
    codigo: 'IV',
    descripcion: 'Restauración con ionómero de vidrio',
    estado: 'bueno',
  },
  {
    codigo: 'IM',
    descripcion: 'Restauración — incrustación metálica',
    estado: 'bueno',
  },
  {
    codigo: 'IE',
    descripcion: 'Restauración — incrustación estética',
    estado: 'bueno',
  },
  // Restauración temporal (§6.1.34): contorno en rojo (mal estado / provisional).
  { codigo: 'RT', descripcion: 'Restauración temporal', estado: 'malo' },
];

// Set de códigos válidos para validación O(1) en el dominio.
export const CODIGOS_HALLAZGO = new Set(HALLAZGOS_ODONTO.map((h) => h.codigo));

// Clasificación para índices CPO-D/CEO-D (Bloque 3):
//   cariado | perdido | obturado | otro
export const CLASE_CPOD = {
  C: 'cariado',
  // Caries por severidad (NTS-188 §6.1.16): las lesiones cavitadas cuentan como
  // cariado para CPO-D. La mancha blanca (MB) es precavitacional → no se cuenta.
  CE: 'cariado',
  CD: 'cariado',
  CDP: 'cariado',
  DEX: 'perdido',
  O: 'obturado',
  R: 'obturado',
  Io: 'obturado',
  // Restauraciones definitivas por material (NTS-188 §6.1.33) → obturado para CPO-D.
  // La restauración temporal (RT) NO se cuenta como obturado (es provisional).
  AM: 'obturado',
  IV: 'obturado',
  IM: 'obturado',
  IE: 'obturado',
};
