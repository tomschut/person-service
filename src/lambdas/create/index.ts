import { DynamoDB, PutItemInput } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { v4 as uuid } from 'uuid';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const { body } = event;

  //checking todo at apigateway
  if (!body) {
    return fail('invalid request');
  }

  const createPersonDto = JSON.parse(body) as CreatePersonV1Dto;

  const dynamoClient = new DynamoDB({
    region: process.env.REGION,
  });

  // mapping and transformation possible here

  const person: Person = { id: uuid(), ...createPersonDto };

  const personItem: PutItemInput = {
    Item: marshall(person),
    TableName: process.env.PERSON_TABLE_NAME,
  };

  //another mapping could be done here, but that might be too much for a lambda
  try {
    await dynamoClient.putItem(personItem);

    return {
      statusCode: 200,
      body: JSON.stringify({ person }),
    };
  } catch (err) {
    console.log(err);

    return fail('error inserting Person');
  }
}

function fail(message: string): APIGatewayProxyResultV2 {
  return {
    statusCode: 400,
    body: JSON.stringify({ message }),
  };
}
