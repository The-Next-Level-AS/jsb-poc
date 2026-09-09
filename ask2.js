import { createClient } from "https://esm.sh/@sanity/client";

const api = createClient({
  projectId: "zq5it0ga",
  dataset: "production",
  useCdn: true, // true
  apiVersion: "2024-04-04",
});

async function fetchData() {
  return await api.fetch(
    `*[_type == "node"]{ title, no, id, _id, picture, content_short_0_0, content_short_0_1, content_short_0_2, content_short_0_3, content_short_1_0, content_short_1_1, content_short_1_2, content_short_1_3, content_short_2_0, content_short_2_1, content_short_2_2, content_short_2_3, content_short_3_0, content_short_3_1, content_short_3_2, content_short_3_3}`
  );
}

// The provider key is configured on the DigitalOcean function, never in the browser.
const SEARCH_ENDPOINT = "https://faas-ams3-2a2df116.doserverless.co/api/v1/web/fn-b858f54b-90b1-4e75-b3d7-e729bccfc432/jsb/search";

export const askAI2 = async function (message) {
  const data = await fetchData();
  const response = await fetch(SEARCH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error("Semantic search is unavailable.");
  const result = await response.json();
  if (!Array.isArray(result?.ids)) throw new Error("Invalid search response.");

  return result.ids
    .map((matched) => data.find(({ id }) => matched === id))
    .filter(Boolean);
};
