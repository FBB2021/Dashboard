import LoginPage from "./login_page";

export default function Page({ searchParams }: { searchParams: { next?: string } }) {
  const nextUrl = searchParams?.next ?? "/dashboard";
  return <LoginPage nextUrl={nextUrl} />;
}
