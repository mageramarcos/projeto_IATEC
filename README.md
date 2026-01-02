## Visao geral

API REST em NestJS para gerenciar clientes e orders com MongoDB, cotacao USD/BRL, upload de comprovantes (S3 ou disco local), fila de notificacao com BullMQ/Redis e documentacao Swagger.

## Requisitos rapidos

- Node 20+
- MongoDB e Redis em execucao
- Variaveis de ambiente (.env) baseadas em .env.example

MongoDB e Redis com Docker:

```bash
docker run -d --name mongo -p 27017:27017 mongo:6
docker run -d --name redis -p 6379:6379 redis:7
```

## Setup

```bash
npm install
cp .env.example .env # ajuste valores
npm run start:dev
```

- Swagger: http://localhost:3000/docs
- Upload local salvo em ./uploads (servido como estatico). Para usar S3 mantenha `STORAGE_DRIVER=s3` e configure as chaves AWS.

## Principais endpoints

- Clientes: POST/GET/GET:id/PUT/DELETE em /clientes
- Orders: POST/GET/GET:id/PUT/DELETE em /orders (lista paginada com ?page&limit)
- Upload comprovante: POST /orders/:id/comprovante (campo `file`)
- Relatorio: GET /relatorios/top-clientes?limit=5
- Swagger com contratos e validacoes: /docs

## Decisoes e performance

- **Validacao global** (ValidationPipe) com transformacao e whitelist evita payloads ruidosos antes de tocar no servico.
- **Mongoose** com indices simples (email unico) e agregacao para relatorio, evitando codigo manual de calculo.
- **Conversao USD/BRL** isolada em `CurrencyService` usando Axios; facilita mock e retry futuro.
- **Fila BullMQ** (`notification`) desacopla envio de e-mail do fluxo sincrono de criacao de pedido.
- **Storage provider** dinamico (`STORAGE_DRIVER`): S3 para producao, local para testes rapidos sem alterar controller.
- **Swagger** garante que DTOs e parametros estejam documentados e alinhados as validacoes.

## Scripts

- `npm run start:dev` - desenvolvimento com reload
- `npm run start` - ambiente local sem watch
- `npm run lint` - formatacao e lint

## Estrutura

- src/customers - CRUD de clientes e schema
- src/orders - CRUD de orders, relatorio e upload de comprovante
- src/currency - consulta de cotacao USD/BRL
- src/storage - provider S3/local para arquivos
- src/notifications - fila BullMQ + processor de confirmacao
