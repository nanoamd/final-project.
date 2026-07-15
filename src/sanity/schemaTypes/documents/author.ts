import { UserIcon } from "lucide-react";
import { defineField, defineType } from "sanity";

export const author = defineType({
  name: "author",
  title: "Author",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "avatar", type: "image", options: { hotspot: true } }),
    defineField({ name: "role", title: "Role / title", type: "string" }),
    defineField({ name: "bio", type: "text", rows: 3 }),
  ],
  preview: {
    select: { title: "name", subtitle: "role", media: "avatar" },
  },
});
