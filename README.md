# API REST de Chefium

## Documentación

Puedes revisar la documentación de la API en [este enlace](https://mapacheverdugo.github.io/api-chefium/).

## Configuraciones

Todas las configuraciones se realizan a través de las variables de entorno de la aplicación, estas se definen dependiendo del sistema de despliegue de la aplicación, algunos ejemplos son [Google Cloud](https://cloud.google.com/appengine/docs/flexible/nodejs/configuring-your-app-with-app-yaml) o [Heroku](https://devcenter.heroku.com/articles/config-vars).

### Variables de entorno locales

Para definir las variables de entorno de forma local, se puede crear un archivo `.env` en la raíz del proyecto, que tenga el siguiete formato de ejemplo.

```
JWT_CADUCIDAD=12345
JWT_SECRETO=secreto
MONGODB_URI=mongodb://usuario:contrasenia@host.com:12345/db
```

## Inicializar

### Requisitos previos

Para correr este proyecto es necesario descargar e instalar las siguientes herramientas
- [Node.js + `npm`](https://nodejs.org/es/download/)

### Instrucciones

1. Descargar y extraer el repositorio, o clonarlo con el siguiente comando
```bash
git clone https://github.com/mapacheverdugo/api-chefium.git
```
2. Una vez descargado, entrar a la raíz del proyecto y ejecutar
```bash
npm install
```
3. Luego ejecutar el comando `npm test` que montará el servidor de manera local con el puerto `3000` por defecto, y mostrará el siguiente mensaje

```
🚀 Escuchando en el puerto puerto 3000
👍 Conectado correctamente a la base de datos
```
4. Realizar todas las consultas a la dirección [`localhost:3000`](http://localhost:3000).