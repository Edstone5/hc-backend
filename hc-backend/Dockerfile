# Usa una versión ligera de Node 20
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiamos primero los archivos de dependencias para aprovechar el caché de Docker
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto 3000 (donde escucha tu api.js por defecto)
EXPOSE 3000

# Comando para arrancar. 
# Usamos el script "start" (node api.js) para producción o docker estable.
CMD ["npm", "run", "start"]