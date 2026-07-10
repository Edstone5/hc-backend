import { randomUUID } from 'crypto';
import { IFiliacionRepository } from '../domain/filiacionDomain.js';
import pool from '../../db/db.js';

export class FiliacionRepository extends IFiliacionRepository {
  async create(agregado) {
    const values = agregado.obtenerParametros();
    // La PK id_filiacion se genera en la app (randomUUID) en vez de depender del
    // DEFAULT gen_random_uuid() de PostgreSQL, que no existe en MySQL. Así el
    // INSERT es portable entre ambos motores (mismo patrón que patient/hc repos).
    await pool.query(
      `INSERT INTO filiacion (
        id_filiacion, id_historia, raza, fecha_nacimiento, lugar, estado_civil, nombre_conyuge,
        ocupacion, lugar_procedencia, tiempo_residencia_tacna, direccion,
        ultima_visita_dentista, motivo_visita_dentista, ultima_visita_medico,
        motivo_visita_medico, contacto_emergencia, telefono_emergencia, acompaniante,
        edad, sexo, fecha_elaboracion
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [randomUUID(), ...values]
    );
    return { success: true, id_historia: agregado.idHistoria };
  }

  async getByHistoria(id_historia) {
    const { rows } = await pool.query(
      'SELECT * FROM filiacion WHERE id_historia = $1',
      [id_historia]
    );
    return rows[0];
  }

  async update(agregado) {
    const p = agregado.obtenerParametros();
    // p[0]=id_historia, p[1..19]=campos
    await pool.query(
      `UPDATE filiacion SET
        raza=$2, fecha_nacimiento=$3, lugar=$4, estado_civil=$5, nombre_conyuge=$6,
        ocupacion=$7, lugar_procedencia=$8, tiempo_residencia_tacna=$9, direccion=$10,
        ultima_visita_dentista=$11, motivo_visita_dentista=$12, ultima_visita_medico=$13,
        motivo_visita_medico=$14, contacto_emergencia=$15, telefono_emergencia=$16,
        acompaniante=$17, edad=$18, sexo=$19, fecha_elaboracion=$20
       WHERE id_historia=$1`,
      p
    );
    return { success: true, id_historia: agregado.idHistoria };
  }
}

const filiacionRepository = new FiliacionRepository();
export default filiacionRepository;
