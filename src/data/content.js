export const offers = [
  {
    name: "BIM Automation Audit",
    price: "From €1,500",
    description:
      "For BIM Managers who need to identify where automation will save the most production time.",
    features: [
      "Workflow and standards review",
      "Automation opportunity map",
      "Estimated time-saving areas",
      "Implementation roadmap",
    ],
    cta: "Book Audit",
    intent: "audit",
  },
  {
    name: "Revit Automation Sprint",
    price: "From €4,500",
    description:
      "For teams that need a production-ready pyRevit, Python, Dynamo, or Revit API tool built around their standards.",
    features: [
      "Custom automation tool",
      "Tested deployment package",
      "Documentation and handover",
      "Support period",
    ],
    cta: "Discuss Sprint",
    intent: "tool",
  },
  {
    name: "BIM Automation Retainer",
    price: "From €2,000 / month",
    description:
      "For engineering teams that want continuous automation, QA tooling, and internal BIM process improvement.",
    features: [
      "Monthly automation roadmap",
      "Tool maintenance",
      "Small workflow automations",
      "Advisory calls",
    ],
    cta: "Request Retainer",
    intent: "retainer",
  },
];

export const solutions = [
  {
    name: "Sheet Automation",
    description:
      "Automated view creation, sheet setup, naming checks, print/export routines, and deliverable preparation.",
  },
  {
    name: "BIM QA & Model Health",
    description:
      "Parameter validation, standards checks, model review routines, and structured reports for BIM managers.",
  },
  {
    name: "MEP Tagging Automation",
    description:
      "Pipe, duct, and annotation workflows that reduce repetitive tagging and improve documentation consistency.",
  },
  {
    name: "Revit Export Automation",
    description:
      "Reliable PDF, DWG, IFC, and BIM 360 export workflows aligned with project standards.",
  },
  {
    name: "AI Drawing Scanner",
    description:
      "Experimental computer vision workflows for detecting symbols, markups, and drawing patterns in engineering documentation.",
  },
  {
    name: "Custom pyRevit Toolbars",
    description:
      "Internal Revit toolkits packaged around team standards, deployment needs, and production workflows.",
  },
];

export const benefits = [
  {
    title: "Standards before scripts",
    description:
      "Automation is mapped to your templates, parameters, naming rules, and delivery expectations before code is written.",
  },
  {
    title: "Production-team focus",
    description:
      "Tools are designed for BIM managers, MEP engineers, coordinators, and Revit teams working under real deadlines.",
  },
  {
    title: "Maintainable handover",
    description:
      "pyRevit, Python, Dynamo, and Revit API workflows are documented so internal teams can operate them with confidence.",
  },
];

export const services = [
  {
    title: "Automation audits",
    description:
      "Review Revit workflows, standards, and production bottlenecks before choosing what to automate.",
    intent: "audit",
  },
  {
    title: "Custom tool development",
    description:
      "Build pyRevit, Python, Dynamo, and Revit API tools around your internal standards and delivery process.",
    intent: "tool",
  },
  {
    title: "Retainer support",
    description:
      "Maintain existing tools, ship small automations, and keep a practical roadmap for BIM process improvement.",
    intent: "retainer",
  },
];

export const blogPosts = [
  {
    title: "Why Revit automation fails when it ignores office standards",
    tag: "Standards",
    time: "6 min read",
    hook: "Automation only holds up when it respects templates, parameters, naming rules, and real project constraints.",
    slug: "revit-automation-office-standards",
    link: "/blog/revit-automation-office-standards",
    body: [
      "The fastest script can still fail in production if it ignores office standards, template structure, and project-specific conventions.",
      "Useful Revit automation starts with the way teams actually document, review, and issue work.",
      "Standards-first tools are easier to trust, support, and improve over time.",
    ],
  },
  {
    title: "What BIM teams should automate before chasing AI",
    tag: "Automation",
    time: "5 min read",
    hook: "Sheet setup, exports, tagging, model checks, and QA reports often create more immediate value than experimental AI.",
    slug: "what-bim-teams-should-automate-before-ai",
    link: "/blog/what-bim-teams-should-automate-before-ai",
    body: [
      "Before investing in AI workflows, most BIM teams benefit from automating predictable production work.",
      "Exports, tagging, sheet setup, parameter checks, and reporting are strong candidates because the rules are visible and repeatable.",
      "AI becomes more useful when the underlying BIM process is already structured.",
    ],
  },
  {
    title: "pyRevit as an internal automation layer for engineering teams",
    tag: "pyRevit",
    time: "7 min read",
    hook: "A well-structured pyRevit toolbar can turn team standards into accessible production tools inside Revit.",
    slug: "pyrevit-internal-automation-layer",
    link: "/blog/pyrevit-internal-automation-layer",
    body: [
      "pyRevit is useful because it brings automation into the environment where production teams already work.",
      "Internal toolbars can package QA checks, exports, tagging routines, and project utilities around office standards.",
      "The best implementations include documentation, deployment discipline, and a feedback path from users.",
    ],
  },
];
