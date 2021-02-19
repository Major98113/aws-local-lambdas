import type { Serverless } from 'serverless/aws';
import { IMPORT_PRODUCTS_BUCKET } from "../libs/constants/s3";

const serverlessConfiguration: Serverless = {
  service: {
    name: 'import-service'
  },
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    }
  },
  plugins: [ 'serverless-webpack', 'serverless-offline' ],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    apiGateway: {
      minimumCompressionSize: 1024,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '10',
      DB_HOST: 'ziggy.db.elephantsql.com',
      DB_PORT: '5432',
      DB_NAME: 'yqcpikbt',
      DB_USERNAME: 'yqcpikbt',
      DB_PASSWORD: 'LcIjch4PLbGFsHJnLlc-NSJwYxWxXAJ2',
      IMPORT_PRODUCTS_BUCKET_ARN: {
        Ref: "ImportProductsBucket"
      },
      CATALOG_ITEMS_QUEUE: {
        Ref: "catalogItemsQueue"
      }
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [ "s3:*" ],
        Resource: [ "arn:aws:s3:::*" ]
      },
      {
        Effect: "Allow",
        Action:"s3:*",
        Resource: [
          {
            "Fn::GetAtt" : [ "ImportProductsBucket", "Arn" ]
          }
        ]
      },
      {
        Effect: "Allow",
        Action:"sqs:*",
        Resource: [
          {
            "Fn::GetAtt" : [ "catalogItemsQueue", "Arn" ]
          }
        ]
      }
    ],
  },
  package: {
    include: [ '../libs/*' ]
  },
  functions: {
    importProductsFile: {
      handler: 'handler.importProductsFile',
      events: [
        {
          http: {
            method: 'get',
            path: 'import',
          }
        }
      ]
    },
    importFileParser: {
      handler: 'handler.importFileParser',
      events: [
        {
          s3: {
            bucket: IMPORT_PRODUCTS_BUCKET,
            event: "s3:ObjectCreated:*",
            rules: [
              {
                prefix: "uploaded/",
                suffix: "csv"
              }
            ],
            existing: true
          }
        }
      ]
    }
  },
  resources: {
    Resources: {
      ImportProductsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: IMPORT_PRODUCTS_BUCKET,
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedHeaders: [ "*" ],
                AllowedMethods: [ "PUT", "POST", "DELETE" ],
                AllowedOrigins: [ "*" ]
              }
            ]
          }
        }
      },
      ImportProductsBucketPolicy: {
        Type: "AWS::S3::BucketPolicy",
        Properties: {
          Bucket: {
            Ref: "ImportProductsBucket"
          },
          PolicyDocument: {
            Version: "2012-10-17",
            Id: "Policy1613559523522",
            Statement: [
              {
                Sid: "Stmt1613559520235",
                Effect: "Allow",
                Principal: "*",
                Action: [
                  "s3:PutObject",
                  "s3:PutObjectAcl"
                ],
                Resource: `arn:aws:s3:::${ IMPORT_PRODUCTS_BUCKET }/*`
              }
            ]
          }
        }
      },
      catalogItemsQueue: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "catalogItemsQueue"
        }
      }
    },
    Outputs: {
      CatalogItemsQueue: {
        Value: {
          "Fn::GetAtt" : [ "catalogItemsQueue", "Arn" ]
        }
      }
    }
  }
}

module.exports = serverlessConfiguration;
