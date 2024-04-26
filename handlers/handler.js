const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const swaggerUi = require('swagger-ui-dist');
const path = require('path');
const fs = require('fs');

const dbClient = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(dbClient);

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const SWAPI_URL = 'https://swapi.py4e.com/api';

// Mapa para la traducción de atributos de inglés a español
const attributeMap = {
  name: "nombre",
  height: "altura",
  mass: "masa",
  hair_color: "color_de_cabello",
  skin_color: "color_de_piel",
  eye_color: "color_de_ojo",
  birth_year: "año_de_nacimiento",
  gender: "género",
};

// Función para traducir los atributos
const translateAttributes = (data, toEnglish = false) => {
  let newData = {};
  for (let key in data) {
    let translatedKey = toEnglish ? Object.keys(attributeMap).find(k => attributeMap[k] === key) : attributeMap[key];
    newData[translatedKey || key] = data[key];
  }
  return newData;
};

const getCharacterFromSwapi = async (characterId) => {
  const url = `${SWAPI_URL}/people/${characterId}`;
  try {
    console.log('Fetching character from SWAPI:', url);
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('Character not found in SWAPI:', characterId);
      return null;
    } else {
      throw error;
    }
  }
};

// Función para insertar un elemento en DynamoDB
module.exports.createCharacter = async (event) => {
  const data = JSON.parse(event.body);
  const translatedData = translateAttributes(data);

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id: uuidv4(),
      ...translatedData,
    },
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    return { statusCode: 200, body: JSON.stringify(params.Item) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not create character' }) };
  }
};


// Función para obtener elementos de DynamoDB
module.exports.getCharacter = async (event) => {
  const { id } = event.pathParameters;
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: { id },
  };

  try {
    const { Item } = await docClient.send(new GetCommand(params));
    if (!Item) {
      console.log('id not found in DynamoDB:', id)
      const swapiCharacter = await getCharacterFromSwapi(id);
      if (swapiCharacter) {
        const translatedCharacter = translateAttributes(swapiCharacter);
        const putParams = {
          TableName: process.env.DYNAMODB_TABLE,
          Item: {
            id: id,
            ...translatedCharacter,
          },
        };
        await docClient.send(new PutCommand(putParams));
        console.log('Character stored in DynamoDB:', putParams.Item)
        return { statusCode: 200, body: JSON.stringify(putParams.Item) };
      } else {
        return { statusCode: 404, body: JSON.stringify({ error: 'Character not found in SWAPI' }) };
      }
    }
    return { statusCode: 200, body: JSON.stringify(Item) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not retrieve character' }) };
  }
};

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Swagger UI</title>
    <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.14.0/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.14.0/swagger-ui-bundle.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.14.0/swagger-ui-standalone-preset.js"></script>
    <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: 'https://8dbfcyyava.execute-api.us-east-1.amazonaws.com/dev/swagger/swagger.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      })
    }
    </script>
</body>
</html>
`;


module.exports.serveSwagger = async (event) => {
  if (event.path.endsWith('swagger.yaml')) {
    const swaggerSpec = fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/yaml' },
      body: swaggerSpec
    };
  } else {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: htmlContent
    };
  }
};