FROM node:9

ARG REACT_APP_CLIENT_ID
ARG REACT_APP_CLIENT_SECRET
ARG REACT_APP_HOME

ENV REACT_APP_CLIENT_ID $REACT_APP_CLIENT_ID
ENV REACT_APP_CLIENT_SECRET $REACT_APP_CLIENT_SECRET
ENV REACT_APP_HOME $REACT_APP_HOME
ENV NODE_ENV 'production'

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY ./package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

RUN npm install --prefix server
RUN npm install --prefix frontend

RUN ls -la

EXPOSE 3000
CMD [ "npm", "run", "production" ]