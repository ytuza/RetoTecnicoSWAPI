# RetoTecnicoSWAPI

## Descripción del reto técnico:

- Crear una API en Node.js con el framework Serverless para un despliegue en AWS.
- Adaptar y transformar los modelos de la API de prueba. Se tienen que mapear todos los nombres de atributos modelos del inglés al español (Ej: name -> nombre).
- Integrar la API de prueba StarWars API (líneas abajo está el link) se deben integrar uno o más endpoints.
- Crear un modelo de su elección mediante el uso de un endpoint POST, la data se tendrá que almacenar dentro de una base de datos.
- Crear un endpoint GET que muestre la data almacenada.

## Tecnologías Utilizadas

- Node.js
- AWS Lambda
- Amazon DynamoDB
- API de SWAPI ([SWAPI](https://swapi.py4e.com))
- Swagger UI

## Configuración y Despliegue

Para desplegar este proyecto, necesitarás configurar AWS CLI y tener acceso a un entorno AWS. Sigue estos pasos:

1. Clona el repositorio:
   ```
   git clone https://github.com/ytuza/RetoTecnicoSWAPI.git
   ```
2. Instala las dependencias:
   ```
   npm install
   ```
3. Configura las variables de entorno necesarias en AWS Lambda:
   - `DYNAMODB_TABLE`: StarWarsEntities
4. Despliega usando Serverless Framework:
   ```
   serverless deploy
   ```

## Uso de la API

### Crear un Personaje

POST `/createCharacter`

```json
{
  "name": "Luke Skywalker",
  "height": "172",
  ...
}
```

### Obtener un Personaje

GET `/getCharacter/{id}`

## Documentación API con Swagger

Para acceder a la documentación de la API y probar los endpoints, navega a:

[Swagger UI](https://8dbfcyyava.execute-api.us-east-1.amazonaws.com/dev/swagger)

## Endpoints

- POST - https://8dbfcyyava.execute-api.us-east-1.amazonaws.com/dev/characters
- GET - https://8dbfcyyava.execute-api.us-east-1.amazonaws.com/dev/characters/{id}
- GET - https://8dbfcyyava.execute-api.us-east-1.amazonaws.com/dev/swagger
- GET - https://8dbfcyyava.execute-api.us-east-1.amazonaws.com/dev/swagger/swagger.yaml

# Documentación de Pruebas para el Proyecto

## Ejecución de Pruebas

Ejecuta las pruebas utilizando Jest con el comando:
```bash
npm test
```

## Casos de Prueba

### Función `createCharacter`

- **Caso de Éxito**: Prueba que un personaje puede ser creado exitosamente en DynamoDB.
- **Manejo de Errores**: Prueba que los errores son manejados adecuadamente si la escritura en DynamoDB falla.

### Función `getCharacter`

- **Caso de Éxito**: Prueba la recuperación de un personaje directamente desde DynamoDB.
- **Recuperación desde SWAPI**: Prueba la recuperación desde SWAPI y el almacenamiento subsiguiente en DynamoDB cuando el personaje no se encuentra en DynamoDB.
- **Manejo de No Encontrado**: Prueba la respuesta cuando un personaje no se encuentra en DynamoDB ni en SWAPI.

Cada función se prueba para asegurar que maneja los casos esperados y los casos límite de manera efectiva.
