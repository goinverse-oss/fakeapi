#!/usr/bin/env node

import _ from 'lodash';
import { createClient } from 'contentful-management';
import yargs from 'yargs';
import inquirer from 'inquirer';
import { singular } from 'pluralize';
import ProgressBar from 'progress';

import { buildExamples } from './factory';

async function getExampleEntries(environment) {
  // fetch any pre-existing Entries
  return _.fromPairs(
    await Promise.all([
      'tag', 'contributor', 'meditationCategory', 'meditation',
      'podcast', 'podcastEpisode', 'podcastSeason',
    ].map(async (resource) => {
      const entries = (await environment.getEntries({ content_type: resource })).items;
      return [resource, entries];
    })
    )
  );
}

async function main() {
  const argv = yargs
    .options({
      accessToken: {
        describe: 'Contentful access token',
        demandOption: true,
      },
    })
    .argv;

  const examplesPromise = Promise.all(buildExamples());

  let { accessToken } = argv;

  const client = createClient({ accessToken });
  const prompt = inquirer.createPromptModule();

  const spaces = (await client.getSpaces()).items;
  const answers = await prompt([
    {
      name: 'space',
      type: 'list',
      choices: spaces.map(
        space => ({
          value: space,
          name: space.name,
        })
      ),
    },
    {
      name: 'environment',
      type: 'list',
      choices: async (answers) => {
        const environments = await answers.space.getEnvironments();
        return environments.items.map(
          env => ({ name: env.name, value: env })
        ).filter(choice => choice.name !== 'master');
      },
    }
  ]);

  const { space, environment } = answers;
  const types = (await environment.getContentTypes()).items;
  const typesByName = _.keyBy(types, 'sys.id')

  let exampleEntries = await getExampleEntries(environment);

  const examplesList = await examplesPromise;
  const examplesByResource = _.keyBy(examplesList, example => singular(example.resource));

  console.log('Creating resources...');
  for (const resource of ['tag', 'contributor', 'meditationCategory']) {
    // only create enough examples to come up to the desired amount
    const examples = examplesByResource[resource].examples
      .slice(exampleEntries[resource].length);
    const bar = new ProgressBar(
      `${resource}: :current/:total :bar`,
      { total: examples.length },
    );
    for (const example of examples) {
      await environment.createEntry(
        resource,
        {
          fields: _(example)
            .omit(
              ['id', 'type', 'tags', 'meditations', 'episodes', 'createdAt', 'updatedAt']
            )
            .mapValues((value) => ({ 'en-US': value }))
            .value()
        }
      );
      bar.tick();
    }
  }

  exampleEntries = await getExampleEntries(environment);

  const makeLink = (contentType, relation) => {
    const entryId = relation.id - 1;
    const entries = exampleEntries[contentType];
    const entry = entries[entryId];
    return {
      sys: {
        type: 'Link',
        linkType: 'Entry',
        id: entry.sys.id,
      },
    };
  };

  const withType = (value, type = null) => {
    const data = type === null ? value : {
      type,
      value,
    };
    return { 'en-US': data };
  };

  const meditations = examplesByResource.meditation.examples
    .slice(exampleEntries.meditation.length);
  let bar = new ProgressBar(
    'meditations: :current/:total :bar',
    { total: meditations.length },
  );
  for (const example of meditations) {
    const json = {
      fields: {
        title: withType(example.title),
        description: withType(example.description),
        imageUrl: withType(example.imageUrl),
        mediaUrl: withType(example.mediaUrl),

        category: withType(
          makeLink('meditationCategory', example.category)
        ),
        tags: withType(example.tags.map(tag => makeLink('tag', tag))),
        contributors: withType(
          example.contributors.map(
            contributor => makeLink('contributor', contributor)
          ),
        ),
      }
    };
    await environment.createEntry('meditation', json);
    bar.tick();
  }

  const podcasts = examplesByResource.podcast.examples
    .slice(exampleEntries.podcast.length);
  bar = new ProgressBar(
    'podcasts: :current/:total :bar',
    { total: podcasts.length },
  );
  for (const example of podcasts) {
    const json = {
      fields: {
        title: withType(example.title),
        description: withType(example.description),
        imageUrl: withType(example.imageUrl),

        tags: withType(example.tags.map(tag => makeLink('tag', tag))),
        contributors: withType(
          example.contributors.map(
            contributor => makeLink('contributor', contributor)
          ),
        ),
      }
    };
    await environment.createEntry('podcast', json);
    bar.tick();
  }

  exampleEntries.podcast = (await environment.getEntries({
    content_type: 'podcast',
  })).items;

  const podcastSeasons = examplesByResource.podcastSeason.examples
    .slice(exampleEntries.podcastSeason.length);
  bar = new ProgressBar(
    'podcastSeasons: :current/:total :bar',
    { total: podcastSeasons.length },
  );
  for (const example of podcastSeasons) {
    const json = {
      fields: {
        number: withType(example.number),
        title: withType(example.title),
        description: withType(example.description),
        imageUrl: withType(example.imageUrl),

        podcast: withType(
          makeLink('podcast', example.podcast)
        ),
        tags: withType(example.tags.map(tag => makeLink('tag', tag))),
        contributors: withType(
          example.contributors.map(
            contributor => makeLink('contributor', contributor)
          ),
        ),
      }
    };
    await environment.createEntry('podcastSeason', json);
    bar.tick();
  }

  exampleEntries.podcastSeason = (await environment.getEntries({
    content_type: 'podcastSeason',
  })).items;

  const podcastEpisodes = examplesByResource.podcastEpisode.examples
    .slice(exampleEntries.podcastEpisode.length);
  bar = new ProgressBar(
    'podcastEpisodes: :current/:total :bar',
    { total: podcastEpisodes.length },
  );
  for (const example of podcastEpisodes) {
    const json = {
      fields: {
        title: withType(example.title),
        description: withType(example.description),
        imageUrl: withType(example.imageUrl),
        mediaUrl: withType(example.mediaUrl),
        seasonEpisodeNumber: withType(example.seasonEpisodeNumber),

        podcast: withType(
          makeLink('podcast', example.podcast)
        ),
        season: withType(
          makeLink('podcastSeason', example.season),
        ),
        tags: withType(example.tags.map(tag => makeLink('tag', tag))),
        contributors: withType(
          example.contributors.map(
            contributor => makeLink('contributor', contributor)
          ),
        ),
      }
    };
    await environment.createEntry('podcastEpisode', json);
    bar.tick();
  }

  exampleEntries = await getExampleEntries(environment);
  console.log('Publishing resources...');
  for (const resource of Object.keys(exampleEntries)) {
    // only create enough examples to come up to the desired amount
    const entries = exampleEntries[resource];
    const bar = new ProgressBar(
      `${resource}: :current/:total :bar`,
      { total: entries.length },
    );
    for (const entry of entries) {
      if (!entry.isPublished()) {
        await entry.publish();
      }
      bar.tick();
    }
  }
}

main();
