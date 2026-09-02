import { revalidatePath } from "next/cache";

// Every public page that renders media_items. Mutating API routes call this
// so /about (its rotating hero) stays in sync with uploads, not just /.
export function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/about");
}
