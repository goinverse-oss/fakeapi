import _ from 'lodash';
import jsonApi from 'jsonapi-server';
import moment from 'moment';
import { factory } from 'factory-girl';

import * as placeholders from './placeholders';

import { randomRelatedObject, randomRelatedObjects } from './utils';

export default {
  number: jsonApi.Joi.number().required(),
  title: jsonApi.Joi.string().required(),
  description: jsonApi.Joi.string(),
  imageUrl: jsonApi.Joi.string().uri(),
  podcast: jsonApi.Joi.one('podcasts'),
  episodes: jsonApi.Joi.many('podcastEpisodes'),
  tags: jsonApi.Joi.many('tags'),
  contributors: jsonApi.Joi.many('contributors'),
  createdAt: jsonApi.Joi.date().required(),
  updatedAt: jsonApi.Joi.date(),
};

factory.define('podcastSeasons', Object, {
  id: factory.sequence('podcastSeasons.id', n => `${n}`),
  type: 'podcastSeasons',
  number: factory.sequence('podcastSeasons.number'),
  title: () => (
    factory.chance('sentence', { words: 3 })().slice(0, -1)
  ),
  description: () => (
    _.times(3, () => (
      factory.chance('paragraph', { sentences: 3 })()
    )).join('\n\n')
  ),
  imageUrl: factory.sequence(
    'podcastSeasons.imageUrl',
    n => placeholders.imageUrl(n),
  ),
  podcast: randomRelatedObject('podcastEpisodes', 'podcasts', 1, 5),
  episodes: randomRelatedObjects('podcastSeasons', 'podcastEpisodes'),
  tags: randomRelatedObjects('podcastSeasons', 'tags', 3),
  contributors: randomRelatedObjects('podcastSeasons', 'contributors'),
  createdAt: factory.sequence(
    'podcastSeasons.createdAt',
    n => moment().subtract(n, 'weeks'),
  ),
});
