import { ChallengeStudent } from "../../../components/ChallengeStudent";

export default async function ChallengeStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ChallengeStudent id={id} />;
}
