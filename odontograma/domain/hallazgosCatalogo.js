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
];

// Set de códigos válidos para validación O(1) en el dominio.
export const CODIGOS_HALLAZGO = new Set(HALLAZGOS_ODONTO.map((h) => h.codigo));

// Clasificación para índices CPO-D/CEO-D (Bloque 3):
//   cariado | perdido | obturado | otro
export const CLASE_CPOD = {
  C: 'cariado',
  DEX: 'perdido',
  O: 'obturado',
  R: 'obturado',
  Io: 'obturado',
};
