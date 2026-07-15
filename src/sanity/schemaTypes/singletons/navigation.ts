import { MenuIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export const navigation = defineType({
  name: "navigation",
  title: "Navigation",
  type: "document",
  icon: MenuIcon,
  fields: [
    defineField({
      name: "headerLinks",
      title: "Header links",
      type: "array",
      of: [
        {
          type: "object",
          name: "headerLink",
          fields: [
            { name: "link", type: "link" },
            {
              name: "children",
              title: "Dropdown items",
              type: "array",
              of: [{ type: "link" }],
            },
          ],
          preview: { select: { title: "link.label" } },
        },
      ],
    }),
    defineField({
      name: "collectionsBarLinks",
      title: "Collections sub-nav links",
      type: "array",
      of: [{ type: "link" }],
    }),
    defineField({
      name: "footerColumns",
      title: "Footer columns",
      type: "array",
      of: [
        {
          type: "object",
          name: "footerColumn",
          fields: [
            { name: "title", type: "string" },
            {
              name: "links",
              type: "array",
              of: [{ type: "link" }],
            },
          ],
          preview: { select: { title: "title" } },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Navigation" };
    },
  },
});
