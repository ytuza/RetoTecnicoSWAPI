const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const handler = require('../handlers/handler');
jest.mock('axios');
const axios = require('axios');
const dynamoMock = mockClient(DynamoDBDocumentClient);

jest.mock('../handlers/handler', () => ({
  ...jest.requireActual('../handlers/handler'),
  getCharacterFromSwapi: jest.fn() 
}));

const { getCharacterFromSwapi } = require('../handlers/handler');

describe('getCharacter function', () => {
  beforeEach(() => {
    dynamoMock.reset();
    getCharacterFromSwapi.mockReset();
    axios.get.mockClear();
  });

  it('successfully retrieves a character from DynamoDB', async () => {
    const event = {
      pathParameters: {
        id: '1'
      }
    };

    dynamoMock.on(GetCommand).resolves({
      Item: {
        id: '1',
        name: "Luke Skywalker",
        height: "172",
        mass: "77"
      }
    });

    const result = await handler.getCharacter(event);

    expect(dynamoMock.calls(GetCommand)).toHaveLength(1);
    expect(result.statusCode).toEqual(200);
    expect(JSON.parse(result.body)).toMatchObject({
      id: '1',
      name: "Luke Skywalker",
      height: "172",
      mass: "77"
    });
  });

  it('retrieves a character from SWAPI and stores it in DynamoDB when not found', async () => {
    const event = {
      pathParameters: {
        id: '2'
      }
    };
  
    dynamoMock.on(GetCommand, {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: '2' }
    }).resolves({});
  
    axios.get.mockResolvedValue({
        data: {
          name: "Han Solo",
          height: "180",
          mass: "80"
        }
      });

    const result = await handler.getCharacter(event);
  
    expect(dynamoMock.commandCalls(GetCommand)).toHaveLength(1);
    expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(1);
    expect(result.statusCode).toEqual(200);
  
    const responseBody = JSON.parse(result.body);
    expect(responseBody.nombre).toEqual('Han Solo');
    expect(responseBody.altura).toEqual('180');
    expect(responseBody.masa).toEqual('80');
  });

  it('returns a 404 if character is not found in DynamoDB and SWAPI', async () => {
    const event = {
      pathParameters: {
        id: 'non-existent-id'
      }
    };
  
    dynamoMock.on(GetCommand, {
      TableName: process.env.DYNAMODB_TABLE,
      Key: { id: event.pathParameters.id }
    }).resolves({});
  
    axios.get.mockRejectedValue({
      response: {
        status: 404
      }
    });
  
    const result = await handler.getCharacter(event);
  
    expect(dynamoMock.commandCalls(GetCommand)).toHaveLength(1);
    expect(result.statusCode).toEqual(404);
    expect(JSON.parse(result.body).error).toEqual('Character not found in SWAPI');
  });
});
