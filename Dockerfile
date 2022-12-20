FROM node:18-alpine

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn --frozen-lockfile install

COPY .env .
COPY tsconfig.json .
COPY src/ /app/

RUN yarn build

CMD [ "node", "/app/dist/main.js" ]
