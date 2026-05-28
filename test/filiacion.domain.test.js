import { describe, it, expect } from 'vitest';
import {
  DomainError,
  IdHistoriaClinicaVO,
  EdadClinicaVO,
  FechaClinicaVO,
  FiliacionAggregate,
} from '../filiacion/domain/filiacionDomain.js';

/**
 * Tests unitarios exhaustivos para mutation testing:
 * - Boundary value analysis
 * - Ramas lógicas y errores literales
 * - Nulos / vacíos según semántica
 * - Inmutabilidad (Object.freeze)
 * - obtenerParametros() con valores exactos y orden fijo
 */

describe('IdHistoriaClinicaVO', () => {
  describe('camino feliz', () => {
    it('acepta y normaliza UUID v4 con espacios y mayúsculas', () => {
      const vo = new IdHistoriaClinicaVO(
        '  550E8400-E29B-41D4-A716-446655440000  '
      );
      expect(vo.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('valores límite', () => {
    it('lanza para cadena vacía', () => {
      expect(() => new IdHistoriaClinicaVO('')).toThrow(
        'La historia clinica debe ser un UUID v4 valido'
      );
    });

    it('lanza para solo espacios', () => {
      expect(() => new IdHistoriaClinicaVO('   ')).toThrow(
        'La historia clinica debe ser un UUID v4 valido'
      );
    });

    it('lanza para null', () => {
      expect(() => new IdHistoriaClinicaVO(null)).toThrow(
        'La historia clinica debe ser un UUID v4 valido'
      );
    });

    it('lanza para undefined', () => {
      expect(() => new IdHistoriaClinicaVO(undefined)).toThrow(
        'La historia clinica debe ser un UUID v4 valido'
      );
    });

    it('acepta UUID v4 válido (minimo caso válido)', () => {
      const vo = new IdHistoriaClinicaVO(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(vo.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('invariantes — errores de dominio', () => {
    it('lanza si el tipo no es string', () => {
      expect(() => new IdHistoriaClinicaVO(123)).toThrow(
        'La historia clinica debe ser un UUID v4 valido'
      );
    });

    it('lanza para patrón inválido', () => {
      expect(() => new IdHistoriaClinicaVO('not-a-uuid')).toThrow(
        'La historia clinica debe ser un UUID v4 valido'
      );
    });
  });

  describe('inmutabilidad', () => {
    it('no permite mutar la propiedad value (Object.freeze)', () => {
      const vo = new IdHistoriaClinicaVO(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });
});

describe('EdadClinicaVO', () => {
  describe('camino feliz', () => {
    it('acepta entero number', () => {
      const vo = new EdadClinicaVO(25);
      expect(vo.value).toBe(25);
    });

    it('acepta entero string numeric', () => {
      const vo = new EdadClinicaVO('30');
      expect(vo.value).toBe(30);
    });
  });

  describe('valores límite', () => {
    it('min-1 (-1) debe fallar', () => {
      expect(() => new EdadClinicaVO(-1)).toThrow(
        'La edad clinica debe ser un entero entre 0 y 130'
      );
    });

    it('min (0) debe pasar', () => {
      expect(new EdadClinicaVO(0).value).toBe(0);
    });

    it('max (130) debe pasar', () => {
      expect(new EdadClinicaVO(130).value).toBe(130);
    });

    it('max+1 (131) debe fallar', () => {
      expect(() => new EdadClinicaVO(131)).toThrow(
        'La edad clinica debe ser un entero entre 0 y 130'
      );
    });
  });

  describe('invariantes — errores de dominio', () => {
    it('no acepta números no enteros (25.5)', () => {
      expect(() => new EdadClinicaVO(25.5)).toThrow(
        'La edad clinica debe ser un entero entre 0 y 130'
      );
    });

    it('no acepta texto no numérico', () => {
      expect(() => new EdadClinicaVO('veinticinco')).toThrow(
        'La edad clinica debe ser un entero entre 0 y 130'
      );
    });
  });

  describe('nulos y vacíos (nullable)', () => {
    it('null -> .value === null', () => {
      expect(new EdadClinicaVO(null).value).toBeNull();
    });

    it('undefined -> .value === null', () => {
      expect(new EdadClinicaVO(undefined).value).toBeNull();
    });

    it("'' -> .value === null", () => {
      expect(new EdadClinicaVO('').value).toBeNull();
    });
  });

  describe('inmutabilidad', () => {
    it('objetos congelados no permiten mutación', () => {
      const vo = new EdadClinicaVO(40);
      expect(() => {
        vo.value = 99;
      }).toThrow();
      expect(vo.value).toBe(40);
    });
  });
});

describe('FechaClinicaVO', () => {
  const msgNacimiento = 'La fecha de nacimiento no tiene un formato valido';
  const msgElaboracion = 'La fecha de elaboracion no tiene un formato valido';

  describe('camino feliz', () => {
    it('acepta ISO 8601 y normaliza con toISOString', () => {
      const src = '2020-01-02T00:00:00.000Z';
      const vo = new FechaClinicaVO(src, msgNacimiento);
      expect(vo.value).toBe('2020-01-02T00:00:00.000Z');
    });
  });

  describe('nulos y vacíos (nullable)', () => {
    it('null -> .value === null', () => {
      expect(new FechaClinicaVO(null, msgNacimiento).value).toBeNull();
    });

    it('undefined -> .value === null', () => {
      expect(new FechaClinicaVO(undefined, msgNacimiento).value).toBeNull();
    });

    it("'' -> .value === null", () => {
      expect(new FechaClinicaVO('', msgNacimiento).value).toBeNull();
    });
  });

  describe('invariantes — errores de dominio', () => {
    it('lanza mensaje pasado si fecha inválida (nacimiento)', () => {
      expect(() => new FechaClinicaVO('not-a-date', msgNacimiento)).toThrow(
        msgNacimiento
      );
    });

    it('lanza mensaje pasado si fecha inválida (elaboracion)', () => {
      expect(() => new FechaClinicaVO('bad', msgElaboracion)).toThrow(
        msgElaboracion
      );
    });
  });

  describe('inmutabilidad', () => {
    it('freeze impide asignar value', () => {
      const vo = new FechaClinicaVO('2021-01-01T00:00:00.000Z', msgElaboracion);
      expect(() => {
        vo.value = 'otro';
      }).toThrow();
      expect(vo.value).toBe('2021-01-01T00:00:00.000Z');
    });
  });
});

describe('FiliacionAggregate', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';

  describe('construcción válida', () => {
    it('construye con datos completos y normaliza texto', () => {
      const input = {
        id_historia: ' 550E8400-E29B-41D4-A716-446655440000 ',
        raza: ' Mestizo ',
        fecha_nacimiento: '2020-01-02T00:00:00.000Z',
        lugar: 'Tacna',
        estado_civil: 'Soltero',
        nombre_conyuge: null,
        ocupacion: 'Estudiante',
        lugar_procedencia: 'Puno',
        tiempo_residencia_tacna: '5 años',
        direccion: 'Calle 123',
        ultima_visita_dentista: '2021-06-01T10:00:00.000Z',
        motivo_visita_dentista: 'dolor',
        ultima_visita_medico: '2021-06-01T11:00:00.000Z',
        motivo_visita_medico: 'consulta',
        contacto_emergencia: 'John Doe',
        telefono_emergencia: '123456789',
        acompaniante: 'Jane',
        edad: 30,
        sexo: 'M',
        fecha_elaboracion: '2021-01-01T00:00:00.000Z',
      };

      const agg = new FiliacionAggregate(input);
      expect(agg.idHistoria).toBe(validId);
    });
  });

  describe('obtenerParametros()', () => {
    it('devuelve el array exacto y en el orden preciso', () => {
      const input = {
        id_historia: '550e8400-e29b-41d4-a716-446655440000',
        raza: 'Mestizo',
        fecha_nacimiento: '2020-01-02T00:00:00.000Z',
        lugar: 'Tacna',
        estado_civil: 'Soltero',
        nombre_conyuge: null,
        ocupacion: 'Estudiante',
        lugar_procedencia: 'Puno',
        tiempo_residencia_tacna: '5 años',
        direccion: 'Calle 123',
        ultima_visita_dentista: '2021-06-01T10:00:00.000Z',
        motivo_visita_dentista: 'dolor',
        ultima_visita_medico: '2021-06-01T11:00:00.000Z',
        motivo_visita_medico: 'consulta',
        contacto_emergencia: 'John Doe',
        telefono_emergencia: '123456789',
        acompaniante: 'Jane',
        edad: 30,
        sexo: 'M',
        fecha_elaboracion: '2021-01-01T00:00:00.000Z',
      };

      const agg = new FiliacionAggregate(input);
      expect(agg.obtenerParametros()).toEqual([
        '550e8400-e29b-41d4-a716-446655440000', // idHistoria.value
        'Mestizo', // raza
        '2020-01-02T00:00:00.000Z', // fechaNacimiento.value
        'Tacna', // lugar
        'Soltero', // estadoCivil
        null, // nombreConyuge
        'Estudiante', // ocupacion
        'Puno', // lugarProcedencia
        '5 años', // tiempoResidenciaTacna
        'Calle 123', // direccion
        '2021-06-01T10:00:00.000Z', // ultimaVisitaDentista
        'dolor', // motivoVisitaDentista
        '2021-06-01T11:00:00.000Z', // ultimaVisitaMedico
        'consulta', // motivoVisitaMedico
        'John Doe', // contactoEmergencia
        '123456789', // telefonoEmergencia
        'Jane', // acompaniante
        30, // edad.value (número)
        'M', // sexo
        '2021-01-01T00:00:00.000Z', // fechaElaboracion.value
      ]);
    });

    it('cuando edad es null, el parámetro correspondiente es null', () => {
      const agg = new FiliacionAggregate({ id_historia: validId, edad: null });
      const params = agg.obtenerParametros();
      expect(params[17]).toBeNull();
    });
  });

  describe('propagación de errores de VOs', () => {
    it('propaga error de IdHistoria inválido', () => {
      expect(() => new FiliacionAggregate({ id_historia: 'bad-uuid' })).toThrow(
        'La historia clinica debe ser un UUID v4 valido'
      );
    });

    it('propaga error de edad inválida', () => {
      expect(
        () => new FiliacionAggregate({ id_historia: validId, edad: -1 })
      ).toThrow('La edad clinica debe ser un entero entre 0 y 130');
    });

    it('propaga error de sexo no permitido', () => {
      expect(
        () => new FiliacionAggregate({ id_historia: validId, sexo: 'X' })
      ).toThrow('El sexo clinico no tiene un valor permitido');
    });

    it('propaga error de fecha_nacimiento inválida', () => {
      expect(
        () =>
          new FiliacionAggregate({
            id_historia: validId,
            fecha_nacimiento: 'invalid-date',
          })
      ).toThrow('La fecha de nacimiento no tiene un formato valido');
    });

    it('propaga error de fecha_elaboracion inválida', () => {
      expect(
        () =>
          new FiliacionAggregate({
            id_historia: validId,
            fecha_elaboracion: 'invalid',
          })
      ).toThrow('La fecha de elaboracion no tiene un formato valido');
    });
  });

  describe('inmutabilidad del agregado', () => {
    it('Object.freeze impide añadir o mutar propiedades públicas', () => {
      const agg = new FiliacionAggregate({ id_historia: validId });
      expect(() => {
        // Intento de mutación sobre objeto congelado (modo strict por ESM)
        agg.idHistoria = 'otro';
      }).toThrow();
      expect(agg.idHistoria).toBe(validId);
    });
  });
});

describe('IdHistoriaClinicaVO — anchors de regex (kills ^ y $ mutants)', () => {
  const MSG = 'La historia clinica debe ser un UUID v4 valido';

  it('lanza para UUID con carácter extra al inicio (kills ^ anchor)', () => {
    expect(
      () => new IdHistoriaClinicaVO('x550e8400-e29b-41d4-a716-446655440000')
    ).toThrow(MSG);
  });

  it('lanza para UUID con carácter extra al final (kills $ anchor)', () => {
    expect(
      () => new IdHistoriaClinicaVO('550e8400-e29b-41d4-a716-446655440000x')
    ).toThrow(MSG);
  });
});

describe('FiliacionAggregate — normalizeText vacío y trim (kills mutants)', () => {
  const validId = '550e8400-e29b-41d4-a716-446655440000';

  it('campo raza con cadena vacía convierte a null en params[1]', () => {
    const agg = new FiliacionAggregate({ id_historia: validId, raza: '' });
    expect(agg.obtenerParametros()[1]).toBeNull();
  });

  it('campo raza con espacios se trimea antes de almacenarse en params[1]', () => {
    const agg = new FiliacionAggregate({
      id_historia: validId,
      raza: '  Mestizo  ',
    });
    expect(agg.obtenerParametros()[1]).toBe('Mestizo');
  });

  it('campo lugar con null produce null en params[3]', () => {
    const agg = new FiliacionAggregate({ id_historia: validId, lugar: null });
    expect(agg.obtenerParametros()[3]).toBeNull();
  });

  it('nombre_conyuge con cadena vacía produce null en params[5]', () => {
    const agg = new FiliacionAggregate({
      id_historia: validId,
      nombre_conyuge: '',
    });
    expect(agg.obtenerParametros()[5]).toBeNull();
  });
});

describe('Whitelist Sexo (casos permitidos y no permitidos)', () => {
  it('acepta cada valor permitido individualmente', () => {
    const allowed = ['M', 'F', 'Masculino', 'Femenino', 'O'];
    for (const v of allowed) {
      const agg = new FiliacionAggregate({
        id_historia: '550e8400-e29b-41d4-a716-446655440000',
        sexo: v,
      });
      // El valor retenido debe ser exactamente el mismo (trimmed por normalizeText)
      expect(agg.obtenerParametros()[18]).toBe(v);
    }
  });

  it('rechaza valores no permitidos (al menos dos)', () => {
    expect(
      () =>
        new FiliacionAggregate({
          id_historia: '550e8400-e29b-41d4-a716-446655440000',
          sexo: 'X',
        })
    ).toThrow('El sexo clinico no tiene un valor permitido');
    expect(
      () =>
        new FiliacionAggregate({
          id_historia: '550e8400-e29b-41d4-a716-446655440000',
          sexo: 'masculino',
        })
    ).toThrow('El sexo clinico no tiene un valor permitido');
  });
});
