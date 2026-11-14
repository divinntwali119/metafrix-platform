import { ResetPasswordForm } from "./ResetPasswordForm";

interface ResetPasswordPageProps {
  searchParams: Promise<{ uid?: string | string[]; token?: string | string[] }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { uid, token } = await searchParams;
  return (
    <ResetPasswordForm
      uid={typeof uid === "string" ? uid : ""}
      token={typeof token === "string" ? token : ""}
    />
  );
}