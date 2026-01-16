export const parseData = (input) => {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const stack = [];
  const result = [];
  let currentObject = null;

  lines.forEach((line) => {
    const depth = line.match(/^(\s*)/)[0].length / 4;
    line = line.trim();
    const typeMatch = line.match(/^(card|button|accordion|heading|text)(.*)$/);
    const contentMatch = line.match(/^>(.*)$/);

    if (typeMatch) {
      const type = typeMatch[1];
      const content = typeMatch[2].trim();
      const newObject = { type, content: [] };

      if (depth === stack.length) {
        if (currentObject) {
          stack[stack.length - 1].content.push(currentObject);
        }
        currentObject = newObject;
        stack.push(currentObject);
      } else if (depth < stack.length) {
        while (depth < stack.length) {
          const completedObject = stack.pop();
          if (stack.length > 0) {
            stack[stack.length - 1].content.push(completedObject);
          } else {
            result.push(completedObject);
          }
        }
        currentObject = newObject;
        stack.push(currentObject);
      } else {
        currentObject.content.push(newObject);
        stack.push(newObject);
        currentObject = newObject;
      }
    } else if (contentMatch) {
      currentObject.link = contentMatch[1].trim();
    } else {
      if (currentObject.type === "card" || currentObject.type === "accordion") {
        currentObject.content.push(line);
      } else {
        currentObject.content = line;
      }
    }
  });

  while (stack.length > 0) {
    const completedObject = stack.pop();
    if (stack.length > 0) {
      stack[stack.length - 1].content.push(completedObject);
    } else {
      result.push(completedObject);
    }
  }

  return result;
};
