# jsb-poc

Jæren Sparebank prototype, hosted on GitHub Pages with content from Sanity.

## Semantic search

Typed and voice searches use the same flow:

1. The browser sends `POST {"message":"jeg har mistet lommeboken"}` to the DigitalOcean function configured in `ask2.js`.
2. The function loads a compact catalog of published Sanity node IDs and titles, matching the original search context, and asks OpenAI to rank them by the user's underlying banking intent. Slang, indirect context, and the direction of a payment are considered.
3. It returns `{"ids":["bank-card-block", ...]}`. The browser displays up to five matching nodes with their existing content and navigation links.

The OpenAI key belongs in the function environment. It is never sent to the browser. Search remains semantic; there is no keyword-search fallback.

A small loading indicator appears while the search is pending and is removed when the request succeeds or fails.

## Deploy the function

Use the DigitalOcean CLI with the intended account and namespace selected:

```sh
doctl serverless status
cp backend/.env.example backend/.env
```

Set `OPENAI_API_KEY` in `backend/.env` using an editor, then deploy:

```sh
doctl serverless deploy backend --env backend/.env --include jsb/search
doctl serverless functions get jsb/search --url
```

Set `SEARCH_ENDPOINT` in `ask2.js` to the returned URL. The function can be deployed before a key is supplied; searches return HTTP 503 until the key is configured. The `.env` file is ignored by Git.

If the key was added through the DigitalOcean dashboard, preserve the deployed environment when updating the function code. Deploying with the `UNCONFIGURED` example value would replace that key.

The function accepts the GitHub Pages origin by default. To use another origin, set `ALLOWED_ORIGINS` to a comma-separated list in the function environment. Local previews also need their origin allowed in the Sanity project's CORS settings.

## Verification

Use Node.js 24 or later:

```sh
node --test tests/*.test.*
```

The tests cover the semantic API contract, ranked results, backend validation, upstream failures, and the loading indicator.

To run the live matching cases (including Norwegian slang and implied overseas payments):

```sh
node scripts/check-semantic-search.mjs
```

This command invokes the deployed model and requires a valid OpenAI key on the function. Set `SEARCH_ENDPOINT` in the command's environment to test another deployment. The queries and expected categories are in `tests/semantic-cases.json`.
