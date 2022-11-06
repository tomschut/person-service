import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import * as path from 'path';

export class PersonServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const personsTable = new Table(this, 'persons', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      tableName: 'persons',

      removalPolicy: RemovalPolicy.DESTROY,
    });

    const createPersonLambda = new lambda.NodejsFunction(this, 'CreatePerson', {
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      runtime: Runtime.NODEJS_16_X,
      handler: 'main',
      entry: path.join(__dirname, `/../src/lambdas/create/index.ts`),
      environment: {
        REGION: cdk.Stack.of(this).region,
        PERSON_TABLE_NAME: personsTable.tableName,
      },
      bundling: {
        externalModules: ['aws-sdk'],
      },
    });

    const personsApi = new apigateway.SpecRestApi(this, 'persons-api', {
      apiDefinition: apigateway.ApiDefinition.fromAsset('openapi/openapi-spec.yaml'),
    });

    const persons = personsApi.root.addResource('persons');
    persons.addMethod('POST', new apigateway.LambdaIntegration(createPersonLambda));
  }
}
