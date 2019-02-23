import _ from 'lodash';
import jsonApi from 'jsonapi-server';
import moment from 'moment';
import { factory } from 'factory-bot';

import * as placeholders from './placeholders';

import { randomRelatedObjects } from './utils';

export default {
  title: jsonApi.Joi.string().required(),
  description: jsonApi.Joi.string(),
  imageUrl: jsonApi.Joi.string().uri(),
  largeImageUrl: jsonApi.Joi.string().uri(),
  episodes: jsonApi.Joi.many('podcastEpisodes'),
  tags: jsonApi.Joi.many('tags'),
  contributors: jsonApi.Joi.many('contributors'),
  createdAt: jsonApi.Joi.date().required(),
  updatedAt: jsonApi.Joi.date(),
};

factory.define('podcasts', Object, {
  id: factory.sequence('podcasts.id', n => `${n}`),
  type: 'podcasts',
  title: () => (
    factory.chance('sentence', { words: 3 })().slice(0, -1)
  ),
  description: () => (
    _.times(3, () => (
      factory.chance('paragraph', { sentences: 3 })()
    )).join('\n\n')
  ),
  imageUrl: factory.sequence(
    'podcasts.imageUrl',
    n => placeholders.imageUrl(n),
  ),
  largeImageUrl: factory.sequence(
    'podcasts.largeImageUrl',
    n => placeholders.largeImageUrl(n),
  ),
  episodes: randomRelatedObjects('podcasts', 'podcastEpisodes'),
  tags: randomRelatedObjects('podcasts', 'tags', 3),
  contributors: randomRelatedObjects('podcasts', 'contributors'),
  createdAt: factory.sequence(
    'meditationCategories.createdAt',
    n => moment().subtract(n, 'weeks'),
  ),
});
