import { AlertTriangle, BriefcaseBusiness, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/common/Button";
import { InterviewResults } from "@/components/interview/InterviewResults";
import { InterviewSession } from "@/components/interview/InterviewSession";
import { InterviewSetup } from "@/components/interview/InterviewSetup";
import { useSession } from "@/context/SessionContext";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import {
  endInterview,
  startInterview,
  submitInterviewAnswer,
} from "@/services/interviewService";
import type {
  InterviewQuestion,
  InterviewStartRequest,
  InterviewSummary,
} from "@/types/interview";

type InterviewView = "setup" | "session" | "results";
const ACKNOWLEDGEMENTS = ["Thank you.", "Got it.", "Let's continue."];

export function MockInterviewPage() {
  const { state } = useSession();
  const navigate = useNavigate();
  const learningGoal =
    state.learningPlan?.learning_goal ?? state.intent?.learning_goal ?? "";
  const [view, setView] = useState<InterviewView>("setup");
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [question, setQuestion] = useState<InterviewQuestion | null>(null);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewStartedAt, setInterviewStartedAt] = useState<number | null>(
    null
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const {
    cancel: cancelSpeech,
    error: speechError,
    isMuted,
    isSpeaking,
    isSupported: speechSupported,
    replay,
    speak,
    toggleMute,
  } = useSpeechSynthesis();

  useEffect(() => {
    if (view !== "session" || !question) {
      return;
    }

    const questionText = getQuestionSpeech(question);
    if (question.question_number === 1) {
      speak(
        `Welcome to your mock interview. Let's begin. ${questionText}`
      );
      return;
    }

    const acknowledgement =
      ACKNOWLEDGEMENTS[
        Math.floor(Math.random() * ACKNOWLEDGEMENTS.length)
      ];
    speak(`${acknowledgement} ${questionText}`);
  }, [question, speak, view]);

  useEffect(() => {
    if (view !== "results" || !summary) {
      return;
    }

    const acknowledgement =
      ACKNOWLEDGEMENTS[
        Math.floor(Math.random() * ACKNOWLEDGEMENTS.length)
      ];
    speak(
      `${acknowledgement} Interview completed. Overall, ${summary.overall_feedback} Thank you for participating.`
    );
  }, [speak, summary, view]);

  async function handleStart(request: InterviewStartRequest) {
    setIsLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const response = await startInterview(request);
      setInterviewStartedAt(Date.now());
      setElapsedSeconds(0);
      setInterviewId(response.data.interview_id);
      setQuestion(response.data.current_question);
      setView("session");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Unable to start the interview."));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitAnswer(answer: string) {
    if (!interviewId) {
      setError("This interview session has expired. Please start again.");
      setView("setup");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFeedback(null);
    try {
      const response = await submitInterviewAnswer({
        interview_id: interviewId,
        answer,
      });
      setFeedback(response.data.feedback);

      if (response.data.is_interview_complete) {
        const endResponse = await endInterview({ interview_id: interviewId });
        finishTimer();
        setSummary(endResponse.data.summary);
        setQuestion(null);
        setView("results");
        return;
      }

      if (!response.data.next_question) {
        throw new Error("The next interview question was not returned.");
      }
      setQuestion(response.data.next_question);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to record your answer. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleEndInterview() {
    if (!interviewId) {
      setError("This interview session has expired. Please start again.");
      setView("setup");
      return;
    }

    cancelSpeech();
    setIsLoading(true);
    setError(null);
    try {
      const response = await endInterview({ interview_id: interviewId });
      finishTimer();
      setSummary(response.data.summary);
      setQuestion(null);
      setView("results");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to end the interview. Please try again."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  function finishTimer() {
    if (interviewStartedAt !== null) {
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - interviewStartedAt) / 1000))
      );
    }
  }

  function resetInterview() {
    cancelSpeech();
    setView("setup");
    setInterviewId(null);
    setQuestion(null);
    setSummary(null);
    setFeedback(null);
    setError(null);
    setIsLoading(false);
    setInterviewStartedAt(null);
    setElapsedSeconds(0);
  }

  if (!learningGoal) {
    return (
      <section className="mx-auto max-w-2xl rounded-md border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-blue-600">
          <BriefcaseBusiness className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          No learning plan yet
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
          Generate a learning plan first so Vidyani can prepare an interview
          around your goal.
        </p>
        <Button className="mt-6" onClick={() => navigate("/onboarding")}>
          Create Learning Plan
        </Button>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {error ? (
        <section className="rounded-md border border-red-200 bg-red-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AlertTriangle
              className="h-5 w-5 shrink-0 text-red-600"
              aria-hidden="true"
            />
            <p className="min-w-0 flex-1 text-sm text-red-800">{error}</p>
            {view !== "setup" ? (
              <Button onClick={resetInterview} size="default" variant="outline">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Start Again
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {view === "setup" ? (
        <InterviewSetup
          isLoading={isLoading}
          learningGoal={learningGoal}
          onStart={(request) => void handleStart(request)}
        />
      ) : null}

      {view === "session" && question && interviewStartedAt !== null ? (
        <InterviewSession
          feedback={feedback}
          isLoading={isLoading}
          isMuted={isMuted}
          isSpeaking={isSpeaking}
          key={question.question_id}
          onEnd={() => void handleEndInterview()}
          onReplayQuestion={() =>
            replay(getQuestionSpeech(question))
          }
          onSubmit={(answer) => void handleSubmitAnswer(answer)}
          onToggleMute={toggleMute}
          question={question}
          speechError={speechError}
          speechSupported={speechSupported}
          startedAt={interviewStartedAt}
        />
      ) : null}

      {view === "results" && summary ? (
        <InterviewResults
          elapsedSeconds={elapsedSeconds}
          isMuted={isMuted}
          isSpeaking={isSpeaking}
          onDashboard={() => navigate("/dashboard")}
          onRetry={resetInterview}
          onToggleMute={toggleMute}
          speechSupported={speechSupported}
          summary={summary}
        />
      ) : null}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function getQuestionSpeech(question: InterviewQuestion): string {
  return `Question ${question.question_number} of ${question.total_questions}. ${question.question}`;
}
