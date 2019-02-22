import _ from 'lodash';
import { factory, ObjectAdapter } from 'factory-bot';

// constant seed for repeatable results
factory.chance.seed(42);

import resources from './resources';

function resourceCount(resourceName) {
  if (
    resourceName === 'meditationCategories' ||
    resourceName === 'podcasts' ||
    resourceName === 'podcastSeasons'
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
