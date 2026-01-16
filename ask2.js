import { createClient } from "https://esm.sh/@sanity/client";
import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@10.9.0/+esm";
import { OpenAI } from "https://cdn.jsdelivr.net/npm/openai@4.36.0/+esm";

const api = createClient({
  projectId: "zq5it0ga",
  dataset: "production",
  useCdn: true, // true
  apiVersion: "2024-04-04",
});
const openai = new OpenAI({
  organization: "org-FtGCFjfFkfFDRwBsUFUWEwVa",
  apiKey: "",
  dangerouslyAllowBrowser: true,
});

async function fetchData() {
  return await api.fetch(
    `*[_type == "node"]{ title, no, id, _id, picture, content_short_0_0, content_short_0_1, content_short_0_2, content_short_0_3, content_short_1_0, content_short_1_1, content_short_1_2, content_short_1_3, content_short_2_0, content_short_2_1, content_short_2_2, content_short_2_3, content_short_3_0, content_short_3_1, content_short_3_2, content_short_3_3}`
  );
}

function convertToMermaid(data) {
  let mermaidString = "graph LR;";

  function traverse(node, parentId) {
    const nodeId = `id_${node.id}`;

    mermaidString += `${parentId} --> ${nodeId};`;
    node.children?.forEach((child) => traverse(child, nodeId));
  }

  data.forEach((rootNode) => {
    const rootNodeId = `id_${rootNode.id}`;

    mermaidString += `${rootNodeId}("${rootNode.title}");`;
    rootNode.children?.forEach((child) => traverse(child, rootNodeId));
  });

  return mermaidString;
}

mermaid.initialize({ startOnLoad: false });

export const askAI2 = async function (message) {
  const data = await fetchData();
  const mermaidDiagram = convertToMermaid(data);

  // const match = (
  //   await fetch(
  //     "https://faas-ams3-2a2df116.doserverless.co/api/v1/web/fn-9813aa14-b1ff-41ef-bed8-493c9adda1b8/default/ai?message=" +
  //       encodeURIComponent(message)
  //   ).then((res) => res.json())
  // ).choices[0].message.content;

  // console.log(match);

  const match = (
    await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: [
            "You provide bank services. Given the node tree specified in Mermaid syntax below, you always respond with (only) a comma separated list of IDs of up to five nodes that best matches my stated intent.\n\n",
            mermaidDiagram,
          ].join(""),
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0,
      seed: 23,
      max_tokens: 256,
      top_p: 0.5,
      frequency_penalty: 0,
      presence_penalty: 0,
    })
  )?.choices?.[0]?.message?.content;

  return match
    .replaceAll(" ", "")
    .split(",")
    .map((matched) => data.find(({ id }) => matched === `id_${id}`));
};
