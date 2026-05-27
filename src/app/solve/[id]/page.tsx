import { ExerciseSolve } from "../../../components/ExerciseSolve";

export default async function ExerciseSolvePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ challenge?: string }>;
}) {
  const { id } = await params;
  const { challenge } = await searchParams;

  return <ExerciseSolve id={id} challengeId={challenge} />;
}
