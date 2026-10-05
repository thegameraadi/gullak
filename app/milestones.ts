import { balance, type State } from "./domain";

// Earned milestones persist, so a release and refill never replays a completion.
export function firstCompletions(before: State, after: State, action: string): string[] {
  if (!["contribute", "split", "purchase"].includes(action)) return [];
  return after.goals.filter(goal => {
    const previous = before.goals.find(g => g.id === goal.id);
    return previous && previous.earned < 4 && goal.earned === 4 && !goal.draft &&
      (goal.status === "purchased" || balance(after, goal.id) >= goal.targetCents);
  }).map(goal => goal.name);
}
