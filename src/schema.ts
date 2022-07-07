export const fanCardEditorSchema = [
    {
        name: "entity",
        selector: { entity: {domain: ["switch", "fan"]} }
    },
    {
        name: "name",
        selector: { text: {} }
    },
    {
      name: "",
      type: "grid",
      // eslint-disable-next-line @typescript-eslint/camelcase
      column_min_width: "50px",
      schema: [
        // { name: "show_name", selector: { boolean: {} } },
        // { name: "show_state", selector: { boolean: {} } },

      ],
    },
  ]