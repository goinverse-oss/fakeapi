#!/usr/bin/env node

/* eslint no-console: off */

import 'source-map-support/register';

import jsonApi from 'jsonapi-server';

import { buildExamples } from './factory';

const promises = buildExamples().map(
  promise => promise.then(
    ({ examples, attributes, resource }) => {
      jsonApi.define({
        handlers: new jsonApi.MemoryHandler(),
        resource,
        attributes,
        examples,
      });
    }
  )
);

jsonApi.setConfig({
  port: process.env.PORT || 16006,
  graphiql: true,
});

Promise.all(promises).then(() => {
  console.log('fake json:api server up at:');
  console.log(`  http://localhost:${jsonApi._apiConfig.port}`);
  jsonApi.start();
});
