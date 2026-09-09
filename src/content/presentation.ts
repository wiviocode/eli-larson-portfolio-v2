import type { Presentation } from "@/lib/presentation";

// The initial edit. Admin changes are stored separately in R2; deployments do
// not overwrite them. IDs refer to existing photographs, never new duplicates.
export const defaultPresentation: Presentation = {
  version: 1,
  editorPhotoIds: [249, 236, 214, 216, 239, 235, 233, 192, 197, 179, 173, 208, 238, 201, 245, 230],
  stories: [
    {
      slug: "beyond-the-score",
      title: "Beyond the score",
      category: "Basketball",
      description: "The quiet before tipoff. The collision. The release. Photographs from different games, brought together around the feeling of basketball — on the floor and just beyond it.",
      photoIds: [214, 173, 221, 192, 209, 212, 246, 224],
      published: true,
    },
    {
      slug: "at-the-line",
      title: "At the line",
      category: "Track & cross country",
      description: "Early practice, the seconds before a start, and everything a finish can mean. A sequence across training sessions and competitions, following effort into the moments after it.",
      photoIds: [207, 204, 239, 189, 197, 237, 196, 201],
      published: true,
    },
  ],
  photoDetails: {},
};
