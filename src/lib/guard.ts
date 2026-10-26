import "server-only";
import { redirect } from "next/navigation";
import { isOwner } from "./auth";

/** For owner-only pages: send visitors to the login page. */
export async function ownerPage() {
  if (!(await isOwner())) redirect("/masuk");
}
