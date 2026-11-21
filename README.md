# MyWaifuList API

This app idea come from a friend of mine (Hapis, He got the idea from Rama, Rama probably got the idea from Evan)

The idea is simple you see a waifu you like, you log it to the system, share you waifu list to your friends, and if your waifu is not on the list add them!

there should be also a leaderboard endpoint for showing what the top waifu on the database.

and how about husbandos? well 
> "sometimes it takes a real man to be the best girl" - Gigguk

Anyway, the project is made for final project assignment for veteran tech study club back-end basic class

## What's needed to run the project

- Node.js 20+
- Docker or Podman (for MongoDB), or any MongoDB instance

```bash
podman-compose up -d        # start MongoDB (admin/admin on :27017); with Docker: docker compose up -d
cp .env.example .env        # then edit JWT_SECRET
npm install
npm run seed                # optional
npm start                   # http://localhost:3000
```

Environment variables (`.env`): `MONGO_URI` and `JWT_SECRET` are required; `JWT_LIFETIME` (default `1d`) and `PORT` (default `3000`) are optional.

Swagger docs are at `http://localhost:3000/api-docs` (non-production only). To call protected endpoints there: log in via `/auth/login`, click **Authorize**, and paste the token (without the `Bearer ` prefix).

Demo accounts after `npm run seed` (password `password123`): `sakata@yorozuya.jp` and `saturosuzuki@yahoo.co.jp`.

## Endpoints

Authenticated routes need `Authorization: Bearer <token>`. Every response uses the same envelope:

```json
// success (200, 201)
{ "success": true, "message": "Waifu created!", "data": { }, "meta": { } }
// failure (400, 401, 403, 404, 409, 500)
{ "success": false, "message": "Waifu not found!" }
```

`data` is `null` when there is nothing to return, and `meta` only appears on paginated lists. Response shapes below describe the contents of `data`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | no | Health check |
| POST | `/auth/register` | no | `{username, email, password}` -> `data: {token}` |
| POST | `/auth/login` | no | `{email, password}` -> `data: {token}` |
| GET | `/waifus` | no | Paginated list (`meta: {page, limit, total, pages}`). Query: `search` (matches name, series, or tags including tag aliases), `sort` (`new`/`name`/`popular`), `page`, `limit` |
| GET | `/waifus/leaderboard` | no | Top waifus by `claims_count`. Query: `limit` |
| GET | `/waifus/:id` | no | Single waifu |
| POST | `/waifus` | yes | multipart: `name`, `series`, `series_type?`, `tags` (comma separated), `media` (1-5 files) |
| PATCH | `/waifus/:id` | yes | Creator only. `name`, `series`, `series_type`, `tags`, all optional. No files; use the media endpoints |
| POST | `/waifus/:id/media` | yes | Any logged-in user. multipart `media` (1-5 files), appended to the waifu and credited to the uploader. A waifu holds at most 20 media; going over returns 409 |
| DELETE | `/waifus/:id/media/:mediaId` | yes | Only the user who uploaded that media (the waifu's creator for media with no recorded uploader). The last remaining media can't be removed |
| DELETE | `/waifus/:id` | yes | Creator only, soft delete. Also removes it from every user's list |
| GET | `/lists` | no | Paginated users with their lists, newest first (emails hidden). Query: `page`, `limit` |
| GET | `/lists/:slug` | no | One user's public list |
| GET | `/lists/my/list` | yes | Your list |
| POST | `/lists/my/list` | yes | `{waifu_id, note?}` |
| PATCH | `/lists/my/list/:waifuId` | yes | `{note}` |
| DELETE | `/lists/my/list/:waifuId` | yes | Remove from your list |
| GET | `/tags` | no | Paginated tags by usage. Query: `search` (substring of label, slug or any alias, so `tsu` finds Tsundere), `page`, `limit` |
| GET | `/tags/suggest` | no | Typo-tolerant lookup. Query: `q`, `limit` (default 5). `tsundre` finds Tsundere |
| GET | `/tags/:slug` | no | Single tag |
| POST | `/tags` | yes | `{label, aliases?}`. Slug is derived from the label |
| PATCH | `/tags/:slug` | yes | Creator only. `{label?, aliases?}` (slug can't change) |
| DELETE | `/tags/:slug` | yes | Creator only, soft delete. Rejected with 409 while waifus still use it |

## Project structure

```
app.js            Express app, routers, error handlers
bin/www           Server entry (connects DB, listens)
config/           DB connection
controllers/      Request/response handlers only
middlewares/      JWT auth, multer upload
models/           Mongoose models
routes/           Express routers
utils/            Helpers used by controllers
seeder/           Demo data
public/           Uploaded images/videos
swagger.js        Generates swagger-output.json
compose.yaml      MongoDB container
```
