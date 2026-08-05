import type { Metadata } from "next";
import type { ReactElement } from "react";
import { QuizClient } from "@/components/quiz/QuizClient";

export const metadata: Metadata = {
  title: "Quiz",
  description:
    "Zece întrebări auto contra cronometru, cu multiplicator de streak și recompense în monede și XP.",
};

export default function QuizPage(): ReactElement {
  return <QuizClient />;
}
