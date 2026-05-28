// tests/fixtures/test-data.js
export const testData = {
  student: {
    id: 'a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p',
    name: 'Juan Pérez',
    email: 'juan.perez@universidad.edu'
  },

  teacher: {
    id: 'b1c2d3e4-f5g6-4h7i-8j9k-1l2m3n4o5p6q',
    name: 'Dr. Miguel García',
    email: 'miguel.garcia@universidad.edu'
  },

  patient: {
    id: 'c1d2e3f4-g5h6-4i7j-8k9l-2m3n4o5p6q7r',
    nombre: 'Carlos López',
    apellido: 'Martínez',
    dni: '12345678',
    fechaNacimiento: '1988-05-15',
    sexo: 'Masculino',
    telefono: '123456789',
    email: 'carlos.lopez@email.com'
  },

  filiacion: {
    nombre: 'Carlos',
    apellido: 'López Martínez',
    edad: 35,
    sexo: 'Masculino',
    direccion: 'Calle Principal 123',
    ocupacion: 'Ingeniero',
    referencia: 'Buena salud general'
  },

  revision: {
    idTeacher: 'b1c2d3e4-f5g6-4h7i-8j9k-1l2m3n4o5p6q',
    state: 'validado',
    observations: 'Excelente trabajo, todos los campos completos.'
  },

  revisionRechazo: {
    idTeacher: 'b1c2d3e4-f5g6-4h7i-8j9k-1l2m3n4o5p6q',
    state: 'requiere_correccion',
    observations: 'Falta completar sección de exámenes y diagnóstico.'
  }
};

export const expectedResponses = {
  historiaClinica: {
    fields: ['id_historia', 'id_estudiante', 'estado', 'fecha_creacion'],
    statusCode: 201
  },

  filiacion: {
    fields: ['id_filiacion', 'id_historia', 'nombre', 'apellido', 'edad'],
    statusCode: 200
  },

  evolucion: {
    fields: ['fecha', 'actividad', 'alumno', 'usuario', 'id_usuario'],
    statusCode: 200
  },

  revision: {
    fields: ['id_revision', 'id_historia', 'id_docente', 'estado', 'observaciones'],
    statusCode: 201
  }
};
