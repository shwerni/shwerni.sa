// renders its children at request time. a client component that reads the url (nuqs,
// useSearchParams) inside a prerendered page is otherwise skipped on the server and only renders
// after hydration; awaiting the search params here moves it out of the prerendered shell, so the
// server renders it with the real url in the same response. place it inside a <Suspense>
export default async function RequestTime({
  searchParams,
  children,
}: {
  searchParams: Promise<unknown>;
  children: React.ReactNode;
}) {
  await searchParams;
  return children;
}
