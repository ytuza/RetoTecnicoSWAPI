const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const handler = require('../handlers/handler');

const dynamoMock = mockClient(DynamoDBDocumentClient);

describe('createCharacter function', () => {
  beforeEach(() => {
    dynamoMock.reset();
  });

  it('successfully creates a character in DynamoDB', async () => {
    const event = {
      body: JSON.stringify({
        name: "Luke Skywalker",
        height: "172",
        mass: "77"
      })
    };

    dynamoMock.on(PutCommand).resolves({});

    const result = await handler.createCharacter(event);

    expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(1);
    expect(result.statusCode).toEqual(200);
    const item = JSON.parse(result.body);
    expect(item.nombre).toEqual('Luke Skywalker');
    expect(item.altura).toEqual('172');
    expect(item.masa).toEqual('77');
  });

  it('handles errors when creating a character in DynamoDB', async () => {
    const event = {
      body: JSON.stringify({
        name: "Darth Vader",
        height: "202",
        mass: "136"
      })
    };

    dynamoMock.on(PutCommand).rejects(new Error("Unable to write to DynamoDB"));

    const result = await handler.createCharacter(event);

    expect(dynamoMock.commandCalls(PutCommand)).toHaveLength(1);
    expect(result.statusCode).toEqual(500);
    expect(JSON.parse(result.body).error).toEqual('Could not create character');
  });
});
