import _ from 'lodash';
import jsonApi from 'jsonapi-server';
import moment from 'moment';
import { factory } from 'factory-girl';

import * as placeholders from './placeholders';

import { randomRelatedObjects } from './utils';

export default {
  title: jsonApi.Joi.string().required(),
  description: jsonApi.Joi.string(),
  imageUrl: jsonApi.Joi.string().uri(),
  tags: jsonApi.Joi.many('tags'),
  meditations: jsonApi.Joi.many('meditations'),
  createdAt: jsonApi.Joi.date().required(),
  updatedAt: jsonApi.Joi.date(),
};

factory.define('meditationCategories', Object, {
  id: factory.sequence('meditationCategories.id', n => `${n}`),
  type: 'meditationCategories',
  title: factory.chance('sentence', { words: 3 }),
  description: () => (
    _.times(3, () => (
      factory.chance('paragraph', { sentences: 3 })()
    )).join('\n\n')
  ),
  imageUrl: placeholders.imageUrl,
  tags: randomRelatedObjects('meditationCategories', 'tags'),
  meditations: randomRelatedObjects('meditationCategories', 'meditations'),
  createdAt: factory.sequence(
    'meditationCategories.createdAt',
    n => moment('2017-02-07').add(n, 'weeks'),
  ),
});