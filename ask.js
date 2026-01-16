import { createClient } from "https://esm.sh/@sanity/client";
// import { OpenAI } from "https://cdn.jsdelivr.net/npm/openai@4.36.0/+esm";
import { content0 } from "./content0.js";
import { content0_1 } from "./content0_1.js";
import { content1 } from "./content1.js";
import { content2 } from "./content2.js";
import { content3 } from "./content3.js";

const api = createClient({
  projectId: "zq5it0ga",
  dataset: "production",
  useCdn: true, // true
  apiVersion: "2024-04-04",
});
// openai = new OpenAI({
//   organization: "org-FtGCFjfFkfFDRwBsUFUWEwVa",
//   apiKey: "",
//   dangerouslyAllowBrowser: true,
// });

async function fetchData() {
  return await api.fetch(
    `*[_type == "node"]{ title, no, id, _id, link, picture, content, children_3n, children_5n, children_7n, content_0_0, content_0_1, content_0_2, content_0_3, content_1_0, content_1_1, content_1_2, content_1_3, content_2_0, content_2_1, content_2_3, content_3_0, content_3_1, content_3_2, content_3_3, content_short_0_0, content_short_0_1, content_short_0_2, content_short_0_3, content_short_1_0, content_short_1_1, content_short_1_2, content_short_1_3, content_short_2_0, content_short_2_1, content_short_2_2, content_short_2_3, content_short_3_0, content_short_3_1, content_short_3_2, content_short_3_3, children[]->{ title, no, id, _id, link, picture, content, children, children_3n, children_5n, children_7n, content_0_0, content_0_1, content_0_2, content_0_3, content_1_0, content_1_1, content_1_2, content_1_3, content_2_0, content_2_1, content_2_3, content_3_0, content_3_1, content_3_2, content_3_3, content_short_0_0, content_short_0_1, content_short_0_2, content_short_0_3, content_short_1_0, content_short_1_1, content_short_1_2, content_short_1_3, content_short_2_0, content_short_2_1, content_short_2_2, content_short_2_3, content_short_3_0, content_short_3_1, content_short_3_2, content_short_3_3 }}`
  );
}

async function findParents(id) {
  return await api.fetch(
    `*[_type == "node" && references("${id}")]{ title, id }`
  );
}

function convertToMermaid(data) {
  let mermaidString = "graph LR;";

  function traverse(node, parentId) {
    const nodeId = `id_${node.id}`;

    mermaidString += `${parentId} --> id: ${nodeId}\n\ncontent: ${node.content};`;
    node.children?.forEach((child) => traverse(child, nodeId));
  }

  data.forEach((rootNode) => {
    const rootNodeId = `id_${rootNode.id}`;

    mermaidString += `${rootNodeId}("${rootNode.title}");`;
    rootNode.children?.forEach((child) => traverse(child, rootNodeId));
  });

  return mermaidString;
}

export const askAI = async (nodeId, e, a) => {
  if (localStorage.getItem(`memo11_${nodeId}_${e}_${a}`)) {
    return localStorage.getItem(`memo11_${nodeId}_${e}_${a}`);
  }
  const data = await fetchData(),
    mermaidDiagram = convertToMermaid(data);

  // const result = (
  //   await openai.chat.completions.create({
  //     model: "gpt-4-turbo",
  //     response_format: { type: "json_object" },
  //     messages: [
  //       {
  //         role: "system",
  //         content: [
  //           "Below is a node tree data structure in Mermaid syntax.\n",
  //           "You will output information about individual nodes in JSON format with this structure:\n\n",
  //           "{\n",
  //           '  title: "A fitting title for the node and its descendants",\n',
  //           '  longForm: "The essential content of the node and its descendants, formatted in Markdown",\n',
  //           "  shortForm: \"A shorter version of 'longForm'\",\n",
  //           "  mostImportantGoal: {},\n",
  //           "  secondMostImportantGoal: {},\n",
  //           "  allOtherGoals: {}\n",
  //           "}\n\n",
  //           'The "mostImportantGoal" object represents the single most important goal that can be achieved within this node and its descendants.\n',
  //           'Use this structure for "mostImportantGoal":\n\n',
  //           "{\n",
  //           '  title: "A fitting title for the goal (1-3 words)",\n',
  //           '  description: "A short text that describes the goal (3-9 words)",\n',
  //           '  nodeId: "The ID for the node that best serves as a starting point to achieve the goal"\n',
  //           "}\n\n",
  //           'The "secondMostImportantGoal" object represents the second most important goal that can be achieved within this node and its descendants.\n',
  //           'Use this structure for "secondMostImportantGoal":\n\n',
  //           "{\n",
  //           '  title: "A fitting title for the goal (1-3 words)",\n',
  //           '  description: "A short text that describes the goal (3-9 words)",\n',
  //           '  nodeId: "The ID for the node that best serves as a starting point to achieve the goal"\n',
  //           "}\n\n",
  //           'The "allOtherGoals" object is an aggregated representation of all remaining identifiable goals that can be achieved within this node and its descendants.\n',
  //           'Use this structure for "allOtherGoals":\n\n',
  //           "{\n",
  //           '  title: "A fitting shared title for these goals (1-3 words)",\n',
  //           '  description: "A short text that describes these goals (3-9 words)",\n',
  //           '  nodes: []"\n',
  //           "}\n\n",
  //           'The "nodes" array must contain an object for each goal, describing the node that best serves as a starting point to achieve the goal.\n',
  //           "List them by importance in descending order.\n",
  //           'Use this structure for objects in "nodes":\n\n',
  //           "{\n",
  //           '  title: "A fitting title for the goal (1-3 words)",\n',
  //           '  description: "A short text that describes the goal (3-9 words)",\n',
  //           '  nodeId: "The ID for the node"\n',
  //           "}\n\n",
  //           "You write in Norwegian.\n\n",
  //           "Here is the Mermaid data:\n\n",
  //           // generere alt jeg ternger...
  //           mermaidDiagram.replace(/(?:\r\n|\r|\n)/g, "\\n"),
  //         ].join(""),
  //       },
  //       { role: "user", content: nodeId },
  //     ],
  //     temperature: 0.5,
  //     seed: 23,
  //     max_tokens: 4096,
  //     top_p: 1,
  //     frequency_penalty: 0,
  //     presence_penalty: 0,
  //   })
  // )?.choices?.[0]?.message?.content;

  const node = data.find(
    ({ id }) =>
      id === nodeId.replace("__v3", "").replace("__v5", "").replace("__v7", "")
  );

  let base = (e === "2" && a === "2") || node.no === true;

  // if (node.children?.slice(0, 2)?.find((child) => child.no === true))
  //   base = true;

  const tabCandidate = node.children
      ?.slice(0, 2)
      ?.find(
        (child) =>
          child[
            (e === "2" && a === "2") || child.no === true
              ? "content"
              : `content_${e}_${a}`
          ].indexOf("| --") !== -1
      ),
    tab2Candidate = node.children
      ?.slice(2)
      ?.find(
        (child) =>
          child[
            (e === "2" && a === "2") || child.no === true
              ? "content"
              : `content_${e}_${a}`
          ].indexOf("| --") !== -1
      );

  let result = {
    nodeId: nodeId,
    title: node.title,
    link: node.link,
    content: node[base ? "content" : `content_${e}_${a}`],
    shortForm: node[`content_short_${e}_${a}`],
    picture: node.picture,
    listForm: ["A", "fitting", "title", "for", "this", "node"],
    parents: await findParents(node._id),
    tabularForm:
      node[base ? "content" : `content_${e}_${a}`].indexOf("| --") !== -1
        ? node[base ? "content" : `content_${e}_${a}`]
        : tabCandidate?.[
            (e === "2" && a === "2") || tabCandidate.no === true
              ? "content"
              : `content_${e}_${a}`
          ] || false,
    tabularForm2:
      tab2Candidate?.[
        (e === "2" && a === "2") || tab2Candidate.no === true
          ? "content"
          : `content_${e}_${a}`
      ] || false,
    children: node.children?.map((child) => ({
      nodeId: child.id,
      title: child.title,
      link: child.link,
      shortForm: child[`content_short_${e}_${a}`],
      listForm: ["A", "fitting", "title", "for", "this", "node"],
      content:
        child[
          (e === "2" && a === "2") || child.no === true
            ? "content"
            : `content_${e}_${a}`
        ],
      children: child.children,
      picture: child.picture,
      tabularForm:
        child[
          (e === "2" && a === "2") || child.no === true
            ? "content"
            : `content_${e}_${a}`
        ].indexOf("| --") !== -1
          ? child[
              (e === "2" && a === "2") || child.no === true
                ? "content"
                : `content_${e}_${a}`
            ]
          : false,
    })),
    filteredChildren: node.children
      ?.filter(
        (child) =>
          child[
            (e === "2" && a === "2") || child.no === true
              ? "content"
              : `content_${e}_${a}`
          ].indexOf("| --") === -1
      )
      .map((child) => ({
        nodeId: child.id,
        title: child.title,
        link: child.link,
        shortForm: child[`content_short_${e}_${a}`],
        listForm: ["A", "fitting", "title", "for", "this", "node"],
        content:
          child[
            (e === "2" && a === "2") || child.no === true
              ? "content"
              : `content_${e}_${a}`
          ],
        picture: child.picture,
      })),
    childSummaryThirdOnwards: {
      title: node.children_3n || "[...]",
      nodeId: `${nodeId}__v3`,
    },
  };

  if (nodeId.indexOf("__v3") !== -1) {
    result = {
      nodeId: nodeId,
      title: node.children_3n,
      parents: [{ title: "Tilbake", id: nodeId.replace("__v3", "") }],
      content: undefined,
      tabularForm:
        result.children
          ?.slice(2)
          .find(({ content }) => content.indexOf("| --") !== -1)?.content ||
        false,
      filteredChildren: result.children
        ?.filter(({ content }) => content.indexOf("| --") === -1)
        .slice(2),
      childSummaryFifthOnwards: {
        title: node.children_5n || "[...]",
        nodeId: nodeId.replace("__v3", "__v5"),
      },
    };
  }

  if (nodeId.indexOf("__v5") !== -1) {
    result = {
      nodeId: nodeId,
      title: node.children_5n,
      parents: [{ title: "Tilbake", id: nodeId.replace("__v5", "__v3") }],
      content: undefined,
      tabularForm:
        result.children
          ?.slice(4)
          .find(({ content }) => content.indexOf("| --") !== -1)?.content ||
        false,
      filteredChildren: result.children
        ?.filter(({ content }) => content.indexOf("| --") === -1)
        .slice(4),
      childSummarySeventhOnwards: {
        title: node.children_7n || "[...]",
        nodeId: nodeId.replace("__v5", "__v7"),
      },
    };
  }

  if (nodeId.indexOf("__v7") !== -1) {
    result = {
      nodeId: nodeId,
      title: node.children_7n,
      parents: [{ title: "Tilbake", id: nodeId.replace("__v7", "__v5") }],
      content: undefined,
      tabularForm:
        result.children
          ?.slice(6)
          .find(({ content }) => content.indexOf("| --") !== -1)?.content ||
        false,
      filteredChildren: result.children
        ?.filter(({ content }) => content.indexOf("| --") === -1)
        .slice(6),
    };
  }

  localStorage.setItem(`memo11_${nodeId}_${e}_${a}`, JSON.stringify(result));

  return localStorage.getItem(`memo11_${nodeId}_${e}_${a}`);
};
