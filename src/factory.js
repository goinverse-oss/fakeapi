import _ from 'lodash';
import { factory, ObjectAdapter } from 'factory-girl';

import resources from './resources';

function resourceCount(resourceName) {
  if (
    resourceName === 'meditationCategories' ||
    resourceName === 'podcasts'
  ) {
    return 5;
  }
  return 25;
}

factory.setAdapter(new ObjectAdapter());

export function buildExamples() {
  return _.map(resources, (attributes, resource) => (
    factory.buildMany(resource, resourceCount(resource)).then(
      (examples) => ({ examples, attributes, resource })
    )
  ));
}
