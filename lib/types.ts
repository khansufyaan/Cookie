export type Grade = "A" | "B" | "C";
export type ChainFamily = "evm" | "solana";
export type TrustTier = "Prime" | "Verified" | "Standard" | "Restricted";
export type DataSource = "live" | "demo";

export interface AppInfo {
  id: string;
  name: string;
  category: string;
  contract: string; // primary mainnet contract / program id
  altContracts?: string[]; // secondary entry points matched during live reads
  chain: string;
  family: ChainFamily;
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
  family: ChainFamily;
  activities: AppActivity[];
  firstSeen: string; // ISO date of earliest tracked tx
  activeMonths: number; // distinct months with >=1 tracked tx
}

export interface FactorScore {
  key: "consistency" | "reach" | "usage" | "magnitude" | "bedrock";
  label: string;
  weight: number; // 0..1, weights sum to 1
  raw: number; // 0..1 normalized factor value
  points: number; // contribution to the 1000-pt score
  detail: string;
}

export interface ScoreResult {
  address: string;
  family: ChainFamily;
  score: number; // 0..1000
  grade: Grade;
  modifier: "+" | "" | "-";
  tier: TrustTier;
  archetype: string;
  archetypeNote: string;
  factors: FactorScore[];
  fullStackBonus: number; // bonus for breadth across the tracked set
  kycBonus: number; // bonus when a KYC attestation is verified
  kyc: {
    verified: boolean;
    source: string;
  };
  sanctions: {
    listed: boolean;
    list: string;
    checkedAgainst: number; // entries in the snapshot
  };
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
