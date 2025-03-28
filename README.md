# Steps to Execute

```sh
  # to start bulding the services
  docker-compose up --build 
```

Use this curl to get access to the application as an admin

```c
curl --location 'http://localhost:3000/user/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "superadmin@admin.com",
    "password": "admin"
}'
```

## Types of Users
1. Admin
  
  This user can any operations in the application such as

  - Registering new user
  - CRUD of Document
  - Create and get details of an Ingestion

2. Editor

  This typeof user can perform any operation on the document

  - CRUD of Document
  - Create and Details of ingestion

3. Viewer

  This typeof user can perform any operation on the document

  - Details of ingestion
  - Read any document

## NOTE

The swagger document can be accessible under `http://localhost:3000/api`

## User Authentication

The codes for authentication can be found inside of gateway under the user module. Passport's JWT auth is used for this purpose. An Auth guard is places on all those controller api's which requires user to be authenticated. 

Please see these locations,

- `gateway/src/global/guards/jwt-auth.guard.ts`

- `gateway/src/user/services/auth/strategies/jwt/jwt.strategy.ts` 

## User Authorization

CASL is a robust rule engine module which is best for bulding authorization mechanism, please find more about this at https://casl.js.org/v6/en/

Bulding ACL rules based on roles is done in the casl module. Please see the the file at `/gateway/src/global/modules/casl/cals-ability.factory.ts`

The above module is used along with a decorator which is used to tag the controller apis with the appropriate permission for invoking.

`/gateway/src/global/decorators/check-permission.decorator.ts`

The guard is then used to identify the invoker's list of permission and whether the invoker can successfully execute the target api.

`gateway/src/global/guards/permission.guard.ts`


## mocked Ingestion Service

The ingestion service is another Nestjs microservice that run along with gateway. It has apis to add and get details of the ingestion as `@MessagePattern` with linked to their command.

NOTE: 
Once a new ingestion is added,  to update it's status an event is fired. That event is then asynchronously handled to update it's status to success / failed.