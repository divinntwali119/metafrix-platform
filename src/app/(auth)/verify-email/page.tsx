import { VerifyEmailForm } from "./VerifyEmailForm";

interface VerifyEmailPageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  return <VerifyEmailForm token={typeof token === "string" ? token : ""} />;
}