# TextYLE teletext image history

This serverless application fetches YLE teletext images periodically and
stores all the choronological versions of them. Also contains an API endpoint
for showing a teletext page in any given point in time, as long as the image
has been stored.

Deploy to AWS using [Serverless Framework](https://www.serverless.com/).

Uses [esbuild](https://esbuild.github.io/) for bundling.
