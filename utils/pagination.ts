// the page to show for a list that may have shrunk: never past its last page (0 when empty)
export function clampPage(page: number, itemCount: number, perPage: number) {
  const lastPage = Math.max(Math.ceil(itemCount / perPage) - 1, 0);
  return Math.min(Math.max(page, 0), lastPage);
}
