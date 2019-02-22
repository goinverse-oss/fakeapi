import moment from 'moment';

export const imageUrl = n => `https://loremflickr.com/300/300?random=${n}`;
export const mediaUrl = (
  'https://github.com/kennethreitz/unmastered-impulses' +
  '/blob/master/mp3/01-Holy_Moment.mp3?raw=true'
);

// arbitrary date to make publishedAt timestamps consistent
export const latestPublishedAt = moment('2019-02-22T20:00:00Z');
