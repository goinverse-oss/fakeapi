import _ from 'lodash';
import jsonApi from 'jsonapi-server';
import moment from 'moment';
import { factory } from 'factory-bot';

import * as placeholders from './placeholders';

import { randomRelatedObject, randomRelatedObjects } from './utils';

export default {
  title: jsonApi.Joi.string().required(),
  description: jsonApi.Joi.string(),
  imageUrl: jsonApi.Joi.string().uri(),
  mediaUrl: jsonApi.Joi.string().uri().required(),
  duration: jsonApi.Joi.string().required(),
  publishedAt: jsonApi.Joi.date(),
  status: jsonApi.Joi.string().valid('published', 'draft').required(),
  podcast: jsonApi.Joi.one('podcasts'),
  season: jsonApi.Joi.one('podcastSeasons'),
  seasonEpisodeNumber: jsonApi.Joi.number(),
  tags: jsonApi.Joi.many('tags'),
  contributors: jsonApi.Joi.many('contributors'),
  createdAt: jsonApi.Joi.date().required(),
  updatedAt: jsonApi.Joi.date(),
};

factory.define('podcastEpisodes', Object, {
  id: factory.sequence('podcastEpisodes.id', n => `${n}`),
  type: 'podcastEpisodes',
  title: () => (
    factory.chance('sentence', { words: _.random(3, 8) })().slice(0, -1)
  ),
  description: () => (
    _.times(3, () => (
      factory.chance('paragraph', { sentences: 3 })()
    )).join('\n\n')
  ),
  imageUrl: factory.sequence(
    'podcastEpisodes.imageUrl',
    n => placeholders.imageUrl(n),
  ),
  mediaUrl: placeholders.mediaUrl,
  duration: factory.sequence(
    'podcastEpisodes.duration',
    () => moment.duration(_.random(60 * 7, 60 * 25), 'seconds').toISOString(),
  ),
  publishedAt: factory.sequence(
    'podcastEpisodes.publishedAt',
    n => placeholders.latestPublishedAt.subtract(n, 'weeks'),
  ),
  status: 'published',
  podcast: randomRelatedObject('podcastEpisodes', 'podcasts', 1, 5),
  season: randomRelatedObject('podcastEpisodes', 'podcastSeasons', 1, 5),
  tags: randomRelatedObjects('podcastEpisodes', 'tags', 3),
  contributors: randomRelatedObjects('podcastEpisodes', 'contributors'),
  createdAt: factory.sequence(
    'podcastEpisodes.createdAt',
    n => moment().subtract(n, 'weeks'),
  ),
}, {
  afterBuild: (model, attrs, buildOptions) => {
    const key = `podcastEpisodes.seasonEpisodeNumber.season${model.season.id}`;
    model.seasonEpisodeNumber = factory.sequence(key)();
    return model;
  },
});
