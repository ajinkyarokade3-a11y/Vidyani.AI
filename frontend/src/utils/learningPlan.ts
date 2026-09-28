export function getTopicKey(phaseNumber: number, topic: string): string {
  return `${phaseNumber}:${topic.trim().toLowerCase()}`;
}
