import { LoginOptions } from "./LoginOptions";

interface LoginPageProps {
  searchParams: Promise<{ authError?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { authError } = await searchParams;
  return <LoginOptions oauthError={typeof authError === "string" ? authError : ""} />;
}
