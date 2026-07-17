import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";

const WIDGET_BASE_URL = "https://softtech-ai-app.onrender.com";
const WIDGET_SERVER_URL = "https://softtech-ai.onrender.com";
const WIDGET_NGROK_URL = "https://scone-hatchling-relenting.ngrok-free.dev";

const GENERIC_WIDGET_RESOURCES = [
  {
    name: "Widgets",
    uri: "ui://generic/widgets.html",
  },
];

const addTodoInputSchema = {
  title: z.string().min(1),
};

const completeTodoInputSchema = {
  id: z.string().min(1),
};

const todoOutputSchema = {
  tasks: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      completed: z.boolean(),
    }),
  ),
};

let todos: { id: string; title: string; completed: boolean }[] = [];
let nextId = 1;

const replyWithTodos = (message?: string) => ({
  content: message ? [{ type: "text" as const, text: message }] : [],
  structuredContent: { tasks: todos },
});
export const registerGenericWidgetResources = (server: any) => {
  //   registerAppResource(
  //     server,
  //     "todo-widget",
  //     "ui://widget/todo.html",
  //     {},
  //     async () => {
  //       const todoJs = await fetch(`${WIDGET_BASE_URL}/widget.js`).then(
  //         (r) => r.text(),
  //       );
  //       const todoCss = await fetch(
  //         `${WIDGET_BASE_URL}/widget.css`,
  //       ).then((r) => r.text());

  //       const todoHtml = `
  //       <!DOCTYPE html>
  //       <html lang="en">
  //         <head>
  //           <meta charset="utf-8" />
  //           <title>Todo list</title>
  //           <style>${todoCss}</style>
  //         </head>
  //         <body>
  //           <div id="root"></div>
  //           <script type="module">${todoJs}</script>
  //         </body>
  //       </html>
  // `;
  //       return {
  //         contents: [
  //           {
  //             uri: "ui://widget/todo.html",
  //             mimeType: RESOURCE_MIME_TYPE,
  //             text: todoHtml,
  //             _meta: {
  //               "openai/outputTemplate": "ui://widget/todo.html",
  //               "openai/widgetAccessible": true,
  //               "openai/toolInvocation/invoking": "Loading...",
  //               "openai/toolInvocation/invoked": "Loaded",
  //               ui: {
  //                 prefersBorder: true,
  //                 domain: WIDGET_SERVER_URL,
  //                 csp: {
  //                   connectDomains: [
  //                     WIDGET_BASE_URL,
  //                     WIDGET_NGROK_URL,
  //                     WIDGET_SERVER_URL,
  //                   ],
  //                   resourceDomains: [
  //                     WIDGET_BASE_URL,
  //                     WIDGET_NGROK_URL,
  //                     WIDGET_SERVER_URL,
  //                   ],
  //                 },
  //               },
  //             },
  //           },
  //         ],
  //       };
  //     },
  //   );
  //   registerAppTool(
  //     server,
  //     "add_todo",
  //     {
  //       title: "Add todo",
  //       description: "Creates a todo item with the given title.",
  //       inputSchema: addTodoInputSchema,
  //       outputSchema: todoOutputSchema,
  //       _meta: {
  //         ui: { resourceUri: "ui://widget/todo.html" },
  //       },
  //     },
  //     async (args) => {
  //       const title = args?.title?.trim?.() ?? "";
  //       if (!title) return replyWithTodos("Missing title.");
  //       const todo = { id: `todo-${nextId++}`, title, completed: false };
  //       todos = [...todos, todo];
  //       return replyWithTodos(`Added "${todo.title}".`);
  //     },
  //   );

  //   registerAppTool(
  //     server,
  //     "complete_todo",
  //     {
  //       title: "Complete todo",
  //       description: "Marks a todo as done by id.",
  //       inputSchema: completeTodoInputSchema,
  //       outputSchema: todoOutputSchema,
  //       _meta: {
  //         ui: { resourceUri: "ui://widget/todo.html" },
  //       },
  //     },
  //     async (args) => {
  //       const id = args?.id;
  //       if (!id) return replyWithTodos("Missing todo id.");
  //       const todo = todos.find((task) => task.id === id);
  //       if (!todo) {
  //         return replyWithTodos(`Todo ${id} was not found.`);
  //       }

  //       todos = todos.map((task) =>
  //         task.id === id ? { ...task, completed: true } : task,
  //       );

  //       return replyWithTodos(`Completed "${todo.title}".`);
  //     },
  //   );

  GENERIC_WIDGET_RESOURCES.forEach((widget) => {
    registerAppResource(
      server,
      widget.name,
      widget.uri,
      {
        description: "Interactive " + widget.name + " visualizer.",
      },
      async () => {
        const HTML = await fetch(`${WIDGET_BASE_URL}/widget.js`).then((r) =>
          r.text(),
        );
        const CSS = await fetch(`${WIDGET_BASE_URL}/widget.css`).then((r) =>
          r.text(),
        );
        let widgetHtml = `
         <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Todo list</title>
          <style>${CSS}</style>
        </head>
        <body>
          <div id="root"></div>
          <script type="module">${HTML}</script>
        </body>
      </html>
        `;

        return {
          contents: [
            {
              uri: widget.uri,
              mimeType: RESOURCE_MIME_TYPE,
              text: widgetHtml,
              _meta: {
                "openai/outputTemplate": widget.uri,
                "openai/widgetAccessible": true,
                "openai/toolInvocation/invoking": "Loading...",
                "openai/toolInvocation/invoked": "Loaded",
                ui: {
                  prefersBorder: true,
                  domain: WIDGET_SERVER_URL,
                  csp: {
                    connectDomains: [
                      WIDGET_BASE_URL,
                      WIDGET_NGROK_URL,
                      WIDGET_SERVER_URL,
                    ],
                    resourceDomains: [
                      WIDGET_BASE_URL,
                      WIDGET_NGROK_URL,
                      WIDGET_SERVER_URL,
                    ],
                  },
                },
              },
            },
          ],
        };
      },
    );
  });
};
