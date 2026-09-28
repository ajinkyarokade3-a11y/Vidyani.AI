import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Send,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { EmptyQuiz } from "@/components/quiz/EmptyQuiz";
import { QuizLoading } from "@/components/quiz/QuizLoading";
import { QuizQuestionCard } from "@/components/quiz/QuizQuestionCard";
import { QuizResults } from "@/components/quiz/QuizResults";
import { useSession } from "@/context/SessionContext";
import { useGenerateQuiz, useSubmitQuiz } from "@/hooks/useQuizApi";
import type { GeneratedQuiz, QuizSubmissionResult } from "@/types/quiz";

const DEFAULT_DIFFICULTY = "Intermediate";
const DEFAULT_QUESTION_COUNT = 5;

export function QuizPage() {
  const { state } = useSession();
  const plan = state.learningPlan;
  const generateMutation = useGenerateQuiz();
  const submitMutation = useSubmitQuiz();
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const topics = useMemo(
    () =>
      Array.from(
        new Set(
          plan?.phases.flatMap((phase) => phase.recommended_topics) ?? []
        )
      ),
    [plan]
  );

  if (!plan) {
    return <EmptyQuiz />;
  }

  async function handleGenerateQuiz() {
    generateMutation.reset();
    submitMutation.reset();
    setQuiz(null);
    setResult(null);
    setSelectedAnswers([]);
    setCurrentQuestion(0);

    try {
      const response = await generateMutation.mutateAsync({
        topics,
        difficulty: DEFAULT_DIFFICULTY,
        number_of_questions: DEFAULT_QUESTION_COUNT,
      });
      setQuiz(response.data);
      setSelectedAnswers(
        Array.from({ length: response.data.questions.length }, () => "")
      );
    } catch {
      // Mutation state renders the API error.
    }
  }

  function handleSelectAnswer(answer: string) {
    setSelectedAnswers((currentAnswers) =>
      currentAnswers.map((currentAnswer, index) =>
        index === currentQuestion ? answer : currentAnswer
      )
    );
  }

  async function handleSubmitQuiz() {
    if (!quiz || selectedAnswers.some((answer) => !answer)) {
      return;
    }

    submitMutation.reset();
    try {
      const response = await submitMutation.mutateAsync({
        generated_quiz: quiz,
        selected_answers: selectedAnswers,
      });
      setResult(response.data);
    } catch {
      // Mutation state renders the API error.
    }
  }

  if (generateMutation.isPending) {
    return <QuizLoading />;
  }

  if (result) {
    return (
      <QuizResults
        isGenerating={generateMutation.isPending}
        onGenerateNew={() => void handleGenerateQuiz()}
        result={result}
      />
    );
  }

  if (!quiz) {
    return (
      <div className="space-y-6">
        <QuizHeader goal={plan.learning_goal} topicCount={topics.length} />
        {generateMutation.error ? (
          <QuizError message={generateMutation.error.message} />
        ) : null}
        <section className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <QuizSetting label="Difficulty" value={DEFAULT_DIFFICULTY} />
            <QuizSetting
              label="Questions"
              value={`${DEFAULT_QUESTION_COUNT}`}
            />
            <QuizSetting label="Roadmap Topics" value={`${topics.length}`} />
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              disabled={topics.length === 0}
              onClick={() => void handleGenerateQuiz()}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Generate Quiz
            </Button>
          </div>
          {topics.length === 0 ? (
            <p className="mt-3 text-right text-sm text-amber-700">
              The current learning plan does not contain any quiz topics.
            </p>
          ) : null}
        </section>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const allQuestionsAnswered = selectedAnswers.every(Boolean);
  const isFinalQuestion = currentQuestion === quiz.questions.length - 1;

  return (
    <div className="space-y-5">
      <QuizHeader goal={plan.learning_goal} topicCount={quiz.topics.length} />
      {submitMutation.error ? (
        <QuizError message={submitMutation.error.message} />
      ) : null}
      <QuizQuestionCard
        currentQuestion={currentQuestion}
        onSelect={handleSelectAnswer}
        options={question.options}
        question={question.question}
        selectedAnswer={selectedAnswers[currentQuestion] ?? ""}
        totalQuestions={quiz.questions.length}
      />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          disabled={currentQuestion === 0 || submitMutation.isPending}
          onClick={() =>
            setCurrentQuestion((currentValue) => currentValue - 1)
          }
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>

        {isFinalQuestion ? (
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Button
              disabled={!allQuestionsAnswered || submitMutation.isPending}
              onClick={() => void handleSubmitQuiz()}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              {submitMutation.isPending ? "Submitting..." : "Submit Quiz"}
            </Button>
            {!allQuestionsAnswered ? (
              <p className="text-xs text-slate-500">
                Answer every question before submitting.
              </p>
            ) : null}
          </div>
        ) : (
          <Button
            disabled={submitMutation.isPending}
            onClick={() =>
              setCurrentQuestion((currentValue) => currentValue + 1)
            }
          >
            Next
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}

function QuizHeader({
  goal,
  topicCount,
}: {
  goal: string;
  topicCount: number;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-slate-900 text-white">
        <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm font-semibold text-blue-600">
        Knowledge Check
      </p>
      <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
        Quiz
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        Test your understanding of {goal} across {topicCount} roadmap{" "}
        {topicCount === 1 ? "topic" : "topics"}.
      </p>
    </section>
  );
}

function QuizSetting({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-base font-bold text-slate-950">{value}</p>
    </div>
  );
}

function QuizError({ message }: { message: string }) {
  return (
    <section className="rounded-md border border-red-200 bg-red-50 p-4">
      <div className="flex gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-red-950">
            Quiz request failed
          </p>
          <p className="mt-1 text-sm leading-6 text-red-800">{message}</p>
        </div>
      </div>
    </section>
  );
}
