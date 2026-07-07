export type Grade = "A" | "B" | "C";

export interface AppInfo {
  id: string;
  name: string;
  category: string;
  contract: string; // primary mainnet contract
  chain: string;
}

/** Raw activity a partner app reports for one wallet (the ingest payload unit). */
export interface AppActivity {
  appId: string;
  txCount: number;
  volumeUsd: number;
  firstTx: string; // ISO date
  lastTx: string; // ISO date
}

export interface WalletProfile {
  address: string;
  activities: AppActivity[];
  firstSeen: string; // ISO date of earliest tx across apps
  activeMonths: number; // distinct months with >=1 tx
}

export interface FactorScore {
  key: "consistency" | "reach" | "usage" | "magnitude" | "bonaFides";
  label: string;
  weight: number; // 0..1, weights sum to 1
  raw: number; // 0..1 normalized factor value
  points: number; // contribution to the 1000-pt score
  detail: string;
}

export interface ScoreResult {
  address: string;
  score: number; // 0..1000
  grade: Grade;
  modifier: "+" | "" | "-";
  archetype: string;
  archetypeNote: string;
  factors: FactorScore[];
  fullStackBonus: number; // bonus points for using all tracked apps
  totals: {
    txCount: number;
    volumeUsd: number;
    appsUsed: number;
    walletAgeMonths: number;
    activeMonths: number;
  };
  sbt: {
    minted: boolean;
    tokenId: string;
    standard: string;
    note: string;
  };
}
