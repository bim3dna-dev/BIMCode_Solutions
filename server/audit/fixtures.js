// Synthetic fixtures for offline tests only; never returned by the runtime endpoint.
export const validInput = () => ({
  schemaVersion: 1,
  contact: {
    name: "Alex Example",
    email: "alex@example.com",
    company: "Example AEC",
    role: "BIM manager",
  },
  workflow: {
    title: "Pipe tagging",
    description: "Tag pipes and review annotations before issue.",
    discipline: "Mechanical",
    software: ["Revit", "Excel"],
    revitVersion: "2025",
    frequency: { type: "weekly", occurrences: 3, intervalDays: null },
    manualEffort: {
      duration: 1.5,
      unit: "hours",
      basis: "per-person-per-occurrence",
    },
    participants: 2,
    painPoint: "Repetitive annotation checks",
    desiredOutcome: "Consistent tags",
  },
});
export const validResult = () => ({
  summary: "Rule-based pipe tagging may reduce repetitive annotation work.",
  automationFeasibility: {
    level: "high",
    score: 75,
    rationale:
      "The task has repeatable rules; template-specific validation is needed.",
  },
  workflowClassification: {
    category: "MEP documentation",
    determinism: "high",
    repetitionLevel: "high",
  },
  automationOpportunities: [
    {
      task: "Place pipe tags",
      approach: "Use explicit view and tagging rules with user review.",
      technology: "Revit API / pyRevit",
      confidence: "medium",
    },
  ],
  technicalArchitecture: {
    recommendedPrimaryApproach:
      "A controlled Revit command using deterministic tagging rules.",
    revitApiRole: "Read elements and place tags within valid transactions.",
    pythonRole: "pyRevit can provide the command UI.",
    aiRole: "Not required for tag placement.",
    externalProcessingRole:
      "Optional offline rule configuration; no model edits outside Revit.",
  },
  risks: [
    {
      risk: "Unsupported tag families",
      severity: "medium",
      mitigation: "Validate template prerequisites and test on a copy.",
    },
  ],
  questionsOrUnknowns: ["Which tag family and placement standards apply?"],
  recommendedEngagement: {
    type: "audit",
    rationale: "Confirm project-specific constraints before implementation.",
  },
});
