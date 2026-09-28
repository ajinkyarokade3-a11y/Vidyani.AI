"""Deterministic scheduling for planner-generated learning phases."""

from __future__ import annotations

import calendar
import re
from datetime import date, datetime, timedelta

from backend.schemas.intent import LearnerIntent
from backend.schemas.planner import LearningPlan


PHASE_ALLOCATIONS: dict[int, tuple[int, ...]] = {
    2: (50, 50),
    3: (35, 35, 30),
    4: (25, 25, 25, 25),
    5: (20, 20, 20, 20, 20),
}
MINIMUM_ROADMAP_HOURS = 10.0
HOURS_PER_TOPIC_BY_LEVEL = {
    "beginner": 2.0,
    "intermediate": 1.5,
    "advanced": 1.25,
}
TIME_AMOUNT_PATTERN = re.compile(
    r"(\d+(?:\.\d+)?)\s*(hours?|hrs?|minutes?|mins?)"
)
NUMBER_WORDS = {
    "one": "1",
    "two": "2",
    "three": "3",
    "four": "4",
    "five": "5",
    "six": "6",
    "seven": "7",
    "eight": "8",
    "nine": "9",
    "ten": "10",
    "eleven": "11",
    "twelve": "12",
}


class PlannerSchedulingError(ValueError):
    """Raised when a deadline cannot support a deterministic learning plan."""


def validate_planning_feasibility(
    intent: LearnerIntent,
    *,
    reference_date: date | None = None,
) -> None:
    """Reject deadlines that cannot support even a minimal roadmap."""

    start_date = reference_date or date.today()
    target_date = parse_target_date(intent.target_deadline, start_date)
    total_days = _inclusive_days(start_date, target_date)
    available_hours = estimate_available_study_hours(
        intent.available_time,
        start_date=start_date,
        target_date=target_date,
    )

    if available_hours < MINIMUM_ROADMAP_HOURS:
        raise PlannerSchedulingError(
            "The selected deadline and study schedule provide only "
            f"{available_hours:g} study hours. A meaningful roadmap needs at "
            f"least {MINIMUM_ROADMAP_HOURS:g} hours. Choose a later completion "
            "date or increase your daily study time."
        )
    if total_days < 2:
        raise PlannerSchedulingError(
            "The target completion date must allow at least two learning days."
        )


def schedule_learning_plan(
    plan: LearningPlan,
    intent: LearnerIntent,
    *,
    reference_date: date | None = None,
) -> LearningPlan:
    """Replace LLM durations with exact contiguous phase dates."""

    start_date = reference_date or date.today()
    target_date = parse_target_date(intent.target_deadline, start_date)
    total_days = _inclusive_days(start_date, target_date)
    phase_count = len(plan.phases)

    if total_days < phase_count:
        raise PlannerSchedulingError(
            f"The deadline allows {total_days} learning days for {phase_count} "
            "phases. Choose a later completion date."
        )

    available_hours = estimate_available_study_hours(
        intent.available_time,
        start_date=start_date,
        target_date=target_date,
    )
    topic_count = sum(len(phase.recommended_topics) for phase in plan.phases)
    level = (intent.current_skill_level or "").strip().lower()
    hours_per_topic = next(
        (
            hours
            for level_name, hours in HOURS_PER_TOPIC_BY_LEVEL.items()
            if level_name in level
        ),
        1.5,
    )
    required_hours = max(MINIMUM_ROADMAP_HOURS, topic_count * hours_per_topic)
    if available_hours < required_hours:
        raise PlannerSchedulingError(
            "The generated roadmap needs approximately "
            f"{required_hours:g} study hours, but the selected schedule provides "
            f"only {available_hours:g} hours before {target_date.isoformat()}. "
            "Choose a later completion date or increase your study time."
        )

    phase_days = allocate_phase_days(total_days, phase_count)
    phase_start = start_date
    scheduled_phases = []
    for phase, duration_days in zip(plan.phases, phase_days, strict=True):
        phase_end = phase_start + timedelta(days=duration_days - 1)
        scheduled_phases.append(
            phase.model_copy(
                update={
                    "duration_days": duration_days,
                    "estimated_duration": format_duration(duration_days),
                    "start_date": phase_start,
                    "end_date": phase_end,
                }
            )
        )
        phase_start = phase_end + timedelta(days=1)

    if scheduled_phases[-1].end_date != target_date:
        raise RuntimeError("Deterministic planner scheduling missed the target date.")
    return plan.model_copy(update={"phases": scheduled_phases})


def allocate_phase_days(total_days: int, phase_count: int) -> list[int]:
    """Allocate days by phase count and give rounding remainder to the last."""

    if total_days <= 0:
        raise PlannerSchedulingError("The target deadline must be in the future.")
    if phase_count <= 0:
        raise PlannerSchedulingError("A learning plan must contain at least one phase.")
    if total_days < phase_count:
        raise PlannerSchedulingError(
            "The target deadline does not provide at least one day per phase."
        )

    weights = PHASE_ALLOCATIONS.get(phase_count)
    if weights is None:
        weights = tuple(100 / phase_count for _ in range(phase_count))
    allocations = [
        int(total_days * weight / 100)
        for weight in weights[:-1]
    ]
    allocations.append(total_days - sum(allocations))
    if any(days <= 0 for days in allocations):
        raise PlannerSchedulingError(
            "The target deadline does not provide enough time for every phase."
        )
    return allocations


def parse_target_date(value: str | None, reference_date: date) -> date:
    """Parse an absolute date or a relative day/week/month deadline."""

    if value is None or not value.strip():
        raise PlannerSchedulingError("A target completion date is required.")

    normalized = re.sub(r"\s+", " ", value.strip().replace(",", ""))
    normalized = re.sub(
        r"(\d+)(?:st|nd|rd|th)\b",
        r"\1",
        normalized,
        flags=re.IGNORECASE,
    )
    normalized = _replace_number_words(normalized)
    normalized = re.sub(
        r"^(?:by|before|on|finish by|complete by)\s+",
        "",
        normalized,
        flags=re.IGNORECASE,
    )
    for date_format in (
        "%Y-%m-%d",
        "%d %B %Y",
        "%d %b %Y",
        "%B %d %Y",
        "%b %d %Y",
    ):
        try:
            parsed_date = datetime.strptime(normalized, date_format).date()
        except ValueError:
            continue
        return _validate_target_date(parsed_date, reference_date)

    relative_match = re.search(
        r"(?:in|within)?\s*(\d+)\s*(day|week|month)s?",
        normalized,
        flags=re.IGNORECASE,
    )
    if relative_match:
        amount = int(relative_match.group(1))
        unit = relative_match.group(2).lower()
        if amount <= 0:
            raise PlannerSchedulingError(
                "The target deadline must be in the future."
            )
        if unit == "day":
            target_date = reference_date + timedelta(days=amount)
        elif unit == "week":
            target_date = reference_date + timedelta(weeks=amount)
        else:
            target_date = _add_months(reference_date, amount)
        return _validate_target_date(target_date, reference_date)

    raise PlannerSchedulingError(
        "The target completion date could not be understood. Use a date such "
        "as 30 September 2026 or a duration such as 12 weeks."
    )


def estimate_available_study_hours(
    value: str | None,
    *,
    start_date: date,
    target_date: date,
) -> float:
    """Estimate total study hours available through the target date."""

    if value is None or not value.strip():
        raise PlannerSchedulingError("Daily or weekly study time is required.")

    normalized = _replace_number_words(value.lower())
    total_days = _inclusive_days(start_date, target_date)
    weekly_match = re.search(
        r"\b(\d+(?:\.\d+)?)\s*hours?\s+(?:per|a|every)\s+week\b",
        normalized,
    )
    if weekly_match:
        return round(float(weekly_match.group(1)) * total_days / 7, 2)

    weekday_hours = _hours_for_schedule(normalized, "weekday")
    weekend_hours = _hours_for_schedule(normalized, "weekend")
    if weekday_hours is not None or weekend_hours is not None:
        weekdays, weekend_days = _count_weekdays_and_weekends(
            start_date,
            target_date,
        )
        return round(
            weekdays * (weekday_hours or 0)
            + weekend_days * (weekend_hours or 0),
            2,
        )

    time_match = TIME_AMOUNT_PATTERN.search(normalized)
    if not time_match:
        raise PlannerSchedulingError(
            "Study time could not be understood. Use a value such as "
            "2 hours every day."
        )
    amount = float(time_match.group(1))
    daily_hours = (
        amount / 60 if time_match.group(2).startswith("min") else amount
    )
    return round(daily_hours * total_days, 2)


def format_duration(duration_days: int) -> str:
    """Return a readable exact phase duration."""

    if duration_days == 1:
        return "1 day"
    if duration_days < 7:
        return f"{duration_days} days"
    weeks, remaining_days = divmod(duration_days, 7)
    if duration_days < 30:
        if remaining_days == 0:
            return f"{weeks} {'week' if weeks == 1 else 'weeks'}"
        return (
            f"{weeks} {'week' if weeks == 1 else 'weeks'} "
            f"{remaining_days} {'day' if remaining_days == 1 else 'days'}"
        )
    months, remaining_days = divmod(duration_days, 30)
    if remaining_days == 0:
        return f"{months} {'month' if months == 1 else 'months'}"
    return (
        f"{months} {'month' if months == 1 else 'months'} "
        f"{remaining_days} {'day' if remaining_days == 1 else 'days'}"
    )


def _inclusive_days(start_date: date, target_date: date) -> int:
    return (target_date - start_date).days + 1


def _validate_target_date(target_date: date, reference_date: date) -> date:
    if target_date < reference_date:
        raise PlannerSchedulingError(
            f"The target completion date {target_date.isoformat()} is in the past."
        )
    return target_date


def _add_months(source_date: date, months: int) -> date:
    month_index = source_date.month - 1 + months
    year = source_date.year + month_index // 12
    month = month_index % 12 + 1
    day = min(source_date.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def _hours_for_schedule(value: str, schedule: str) -> float | None:
    matches = list(TIME_AMOUNT_PATTERN.finditer(value))
    for index, match in enumerate(matches):
        next_start = (
            matches[index + 1].start()
            if index + 1 < len(matches)
            else len(value)
        )
        if schedule not in value[match.end():next_start]:
            continue
        amount = float(match.group(1))
        return amount / 60 if match.group(2).startswith("min") else amount
    return None


def _count_weekdays_and_weekends(
    start_date: date,
    target_date: date,
) -> tuple[int, int]:
    weekdays = 0
    weekend_days = 0
    current_date = start_date
    while current_date <= target_date:
        if current_date.weekday() < 5:
            weekdays += 1
        else:
            weekend_days += 1
        current_date += timedelta(days=1)
    return weekdays, weekend_days


def _replace_number_words(value: str) -> str:
    normalized = value
    for word, number in NUMBER_WORDS.items():
        normalized = re.sub(
            rf"\b{word}\b",
            number,
            normalized,
            flags=re.IGNORECASE,
        )
    return normalized
