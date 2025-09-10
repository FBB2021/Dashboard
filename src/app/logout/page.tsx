import LogoutPage from "./logout_page";

export default function Page({ searchParams }: { searchParams: { next?: string } }) {
  const nextUrl = searchParams?.next ?? "/login";
  return <LogoutPage nextUrl={nextUrl} />;
}
