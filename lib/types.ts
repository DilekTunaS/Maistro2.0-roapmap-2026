export type HealthStatus = "green" | "yellow" | "red";

export type Sprint = {
  slug: string;
  title: string;
  goal: string;
  summary: string;
  health: HealthStatus;
  healthNote: string;
  startDate: string;
  endDate: string;
  rangeLabel: string;
  progress: number;
  completionRate: number;
  riskCount: number;
  openWorkCount: number;
  completed: string[];
  inProgress: string[];
  risks: string[];
  learnings: string[];
  reviewDate?: string;
  nextSprintGoals?: string[];
};

export type InitiativeStatus = "planned" | "in_progress" | "done" | "blocked";

export type RoadmapInitiative = {
  title: string;
  owner: string;
  month: string;
  status: InitiativeStatus;
  completed: number;
  total: number;
  businessValue: string;
  dependencies: string[];
};

export type RoadmapLane = {
  lane: string;
  items: RoadmapInitiative[];
};

export type Roadmap = {
  quarter: string;
  northStarGoal: string;
  strategyNarrative: string;
  futureStrategy: string[];
  priorities: {
    must: string[];
    should: string[];
    niceToHave: string[];
  };
  lanes: RoadmapLane[];
  risksAndDependencies: string[];
  expectedBusinessImpact: string[];
};
export type RoadmapMilestone = {
  month: string;
  title: string;
  items: string[];
};

export type RoadmapBoardStatus = "on_track" | "at_risk" | "not_started" | "completed";

export type RoadmapBoardItem = {
  id: number;
  epic: string;
  initiative: string;
  quarter: string;
  status: RoadmapBoardStatus;
  progress: number;
  lead: string;
  notes: string[];
  targetDate: string;
  constraints: string;
  completionCriteria: string;
  expectation: string;
  solution: string;
  storyPoint: number | null;
};

export type RoadmapBoardGroup = {
  epic: string;
  status: RoadmapBoardStatus;
  progress: number;
  itemCount: number;
  items: RoadmapBoardItem[];
};

export type RoadmapBoardData = {
  title: string;
  sourceSheet: string;
  quarters: string[];
  groups: RoadmapBoardGroup[];
  totalItems: number;
};

export type InitiativeRecord = {
  id: number;
  epic: string;
  title: string;
  detail: string;
  quarter: string;
  targetDate: string;
  status: string;
  progress: number;
  lead: string;
  customer: string;
  constraints: string;
  completionCriteria: string;
  solution: string;
  expectation: string;
  roiMetric: string;
  roiValue: string;
  storyPoint: number | null;
  notes: string[];
  demoLinks: string[];
  docLinks: string[];
  createdAt: string;
  updatedAt: string;
};

export type IdeaRecord = {
  id: number;
  title: string;
  description: string;
  category: string;
  votes: number;
  pinned: boolean;
  createdAt: string;
};

export type BacklogDatabase = {
  initiatives: InitiativeRecord[];
  ideas: IdeaRecord[];
};
