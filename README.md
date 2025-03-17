# About TempCvs

This is a simple online service, where you can upload, edit and share .csv files.

## Features

- Upload .csv files
- Edit .csv files
- Share .csv files

## Tech Stack

- Vue.js
- Tailwind CSS
- Vite
- Hono
- Cloudflare R2
- Cloudflare Page
- Cloudflare Workers

## Frontend

Use Vue.js as the frontend framework. Deployed on Cloudflare Page.

View and edit the .csv file online.

Default entry point is `https://tempcsv.com`.

## Backend

Use Hono as the backend framework, providing uploading and saving services. Deployed on Cloudflare Workers.

- upload: upload the .csv file to Cloudflare R2, and return the file url with a random generated name.
- save: save the .csv file to Cloudflare R2 with provided file url.

Default entry point is `https://tempcsv.com/api/`.

## Download

Download the .csv file from Cloudflare R2 with provided file url.

Default download entry point is `https://my.tempcsv.com/<file_path>`.

## Database

No database is used, all data are stored in Cloudflare R2 for simplicity.
