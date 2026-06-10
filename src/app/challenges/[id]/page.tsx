import { ChallengeDetail } from "../../../components/ChallengeDetail";

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChallengeDetail id={id} />;
}
