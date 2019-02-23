#!/usr/bin/env node

// must be _before_ first use of lodash
import seedrandom from 'seedrandom';
seedrandom(42, { global: true });

import _ from 'lodash';
import { createClient } from 'contentful-management';
import yargs from 'yargs';
import inquirer from 'inquirer';
import { singular } from 'pluralize';
import ProgressBar from 'progress';

// import * as jdp from 'jsondiffpatch';
// const jsondiffpatch = jdp.create();

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

  console.log('Creating/updating resources...');

  const createResources = async (resource, makeJsonFromExample) => {
    // only create enough examples to come up to the desired amount
    const curExampleEntries = exampleEntries[resource];
    const examples = examplesByResource[resource].examples;

    const bar = new ProgressBar(
      `${resource}: :current/:total :bar`,
      { total: examples.length },
    );
    let i = 0;
    for (const example of examples) {
      const json = makeJsonFromExample(example);
      if (i < curExampleEntries.length) {
        const exampleEntry = curExampleEntries[i];
        if (!_.isEqual(exampleEntry.fields, json.fields)) {
          // if (i === 0) {
          //   console.log(`----\n${resource} diff:`);
          //   const delta = jsondiffpatch.diff(exampleEntry.fields, json.fields);
          //   jdp.console.log(delta);
          //   console.log('----\n');
          // }

          Object.assign(exampleEntry.fields, json.fields);
          await exampleEntry.update();
        }
      } else {
        await environment.createEntry(resource, json);
      }
      ++i;
      bar.tick();
    }
  };

  for (const resource of ['tag', 'contributor', 'meditationCategory']) {
    await createResources(resource, (example) => (
      {
        fields: _(example)
          .omit([
            'id',
            'type',
            'tags',
            'meditations',
            'episodes',
            'createdAt',
            'updatedAt',
          ])
          .mapValues((value) => ({ 'en-US': value }))
          .value()
      }
    ));
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

  await createResources('meditation', (example) => (
    {
      fields: {
        title: withType(example.title),
        description: withType(example.description),
        imageUrl: withType(example.imageUrl),
        mediaUrl: withType(example.mediaUrl),
        duration: withType(example.duration),
        publishedAt: withType(example.publishedAt),

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
    }
  ));

  await createResources('podcast', (example) => (
    {
      fields: {
        title: withType(example.title),
        description: withType(example.description),
        imageUrl: withType(example.imageUrl),
        largeImageUrl: withType(example.largeImageUrl),

        tags: withType(example.tags.map(tag => makeLink('tag', tag))),
        contributors: withType(
          example.contributors.map(
            contributor => makeLink('contributor', contributor)
          ),
        ),
      }
    }
  ));

  exampleEntries.podcast = (await environment.getEntries({
    content_type: 'podcast',
  })).items;

  await createResources('podcastSeason', (example) => (
    {
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
    }
  ));

  exampleEntries.podcastSeason = (await environment.getEntries({
    content_type: 'podcastSeason',
  })).items;

  const numPodcastSeasons = examplesByResource.podcastSeason.examples.length;
  await createResources('podcastEpisode', (example) => (
    {
      fields: {
        title: withType(example.title),
        description: withType(example.description),
        imageUrl: withType(example.imageUrl),
        mediaUrl: withType(example.mediaUrl),
        seasonEpisodeNumber: withType(
          // episodes were numbered from new to old;
          // reverse that order now so that they make sense
          numPodcastSeasons + 1 - example.seasonEpisodeNumber
        ),
        duration: withType(example.duration),
        publishedAt: withType(example.publishedAt),

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
    }
  ));

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
      if (!entry.isPublished() || entry.isUpdated()) {
        await entry.publish();
      }
      bar.tick();
    }
  }
}

main();
