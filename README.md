# jsb-poc

Jæren Sparebank prototype, hosted on GitHub Pages with content from Sanity.

## Semantic search

Typed and voice searches use the same flow:

1. The browser sends `POST {"message":"jeg har mistet lommeboken"}` to the DigitalOcean function configured in `ask2.js`.
2. The function loads the published Sanity nodes and asks OpenAI to rank the nodes by the user's intent.
3. It returns `{"ids":["bank-card-block", ...]}`. The browser displays up to five matching nodes with their existing content and navigation links.

The OpenAI key belongs in the function environment. It is never sent to the browser. Search remains semantic; there is no keyword-search fallback.

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

The function accepts the GitHub Pages origin by default. To use another origin, set `ALLOWED_ORIGINS` to a comma-separated list in the function environment. Local previews also need their origin allowed in the Sanity project's CORS settings.

## Verification

Use Node.js 24 or later:

```sh
node --test tests/*.test.*
```

The tests cover the semantic API contract, ranked results, backend validation, and upstream failures. A live semantic check additionally requires the deployed function to have a valid OpenAI key. The existing frontend layout and interactions are unchanged.
