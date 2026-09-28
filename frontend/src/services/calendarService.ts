import type { LearningPlan } from "@/types/learning";
import type { StudyScheduleEvent } from "@/types/calendar";

const WEEKDAY_START_HOUR = 19;
const WEEKEND_START_HOUR = 10;

export function generateStudySchedule(
  plan: LearningPlan,
  options: {
    dailyStudyHours: number;
    learningGoal: string;
  }
): StudyScheduleEvent[] {
  const topics = plan.phases.flatMap((phase) =>
    phase.recommended_topics.map((topic) => ({
      phase: `Phase ${phase.phase_number}: ${phase.title}`,
      topic,
      duration: phase.estimated_duration,
    }))
  );

  return topics.map((item, index) => {
    const startDate = nextStudyDate(index);
    const durationMinutes = Math.max(30, Math.round(options.dailyStudyHours * 60));
    const endDate = new Date(startDate.getTime() + durationMinutes * 60_000);

    return {
      id: `${index}-${item.topic.toLowerCase().replace(/\W+/g, "-")}`,
      date: startDate.toISOString(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      topic: item.topic,
      phase: item.phase,
      durationMinutes,
      description: [
        `Learning Goal: ${options.learningGoal}`,
        `Topic: ${item.topic}`,
        `Phase: ${item.phase}`,
        `Estimated Duration: ${item.duration || `${durationMinutes} minutes`}`,
      ].join("\n"),
    };
  });
}

export function parseDailyStudyHours(value: string | null | undefined): number {
  if (!value) {
    return 2;
  }

  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return 2;
  }

  return Math.min(Math.max(Number(match[1]), 0.5), 4);
}

function nextStudyDate(index: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setSeconds(0, 0);

  let remainingSessions = index;
  while (remainingSessions > 0) {
    date.setDate(date.getDate() + 1);
    remainingSessions -= 1;
  }

  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  date.setHours(isWeekend ? WEEKEND_START_HOUR : WEEKDAY_START_HOUR, 0, 0, 0);
  return date;
}
