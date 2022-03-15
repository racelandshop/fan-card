export const fanCardEditorSchema = [
    {
        name: "entity",
        selector: { entity: {domain: "switch"} }
    },
    {
        name: "name",
        selector: { text: {} }
    },
    {
      name: "",
      type: "grid",
      column_min_width: "50px",
      schema: [
        { name: "show_name", selector: { boolean: {} } },
        { name: "show_state", selector: { boolean: {} } },

      ],
    },
  ]