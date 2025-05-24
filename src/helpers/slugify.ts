import slugify_ from "slugify";

export const slugify = (text: string) => {
  return slugify_(text, {
    lower: true,
    strict: true,
    trim: true,
  });
};
