import * as z from 'zod';

//los mensajes en español
const passwdSchema = z
  .string()
  .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  .max(20, { message: 'La contraseña no debe tener más de 20 caracteres' })
  .regex(/[A-Z]/, {
    message: 'La contraseña debe contener al menos una letra mayúscula',
  })
  .regex(/[a-z]/, {
    message: 'La contraseña debe contener al menos una letra minúscula',
  })
  .regex(/[0-9]/, { message: 'La contraseña debe contener al menos un número' })
  .regex(/[\W_]/, {
    message: 'La contraseña debe contener al menos un carácter especial',
  });

export function validatePasswd(input) {
  return passwdSchema.safeParse(input);
}
