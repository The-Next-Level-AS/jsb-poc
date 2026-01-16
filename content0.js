import { common } from "./common.js";

export const content0 = [
  "You will be provided with a node tree data structure in Mermaid syntax.\n",
  "When prompted with a specific node ID, your job is to output a JSON object with summarized data.\n",
  "A card can only contain a single button.\n\n",
  "You will create a UI based on a submitted node ID. Use this exact format (just change the content):\n\n",
  "title Lorem ipsum\n",
  "body Lorem ipsum dolor sit amet",
  "card\n",
  "    title Lorem ipsum\n",
  "    body Lorem ipsum dolor sit amet\n",
  "    button\n",
  "        text Read more\n",
  "            > node_id\n",
  "card\n",
  "    title Lorem ipsum\n",
  "    body Lorem ipsum dolor sit amet\n",
  "    button\n",
  "        text Read more\n",
  "            > node_id\n",
  "(The > token denotes a link to a different node)\n\n",
  "This is your data structure:\n\n",
];
