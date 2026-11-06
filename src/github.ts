export type RepoStats = { stars: number; forks: number };

export type Day = {
  date: string;
  count: number;
  /** GitHub's own quartile for this day: 0 (none) to 4. */
  level: number;
  /** 0 = Sunday. */
  weekday: number;
};

export type ProfileData = {
  /** Contributions over the calendar GitHub shows on the profile (about a year). */
  total: number;
  /** Calendar columns, oldest first; the first and last may be partial. */
  weeks: Day[][];
  /** Every public, non-fork repository the user owns. */
  repos: Map<string, RepoStats>;
  stars: number;
  forks: number;
  followers: number;
  commits: number;
  pullRequests: number;
  newRepos: number;
  /** Bytes per language across those repositories, largest first. */
  languages: { name: string; bytes: number }[];
  /** True once the GitHub Sponsors profile is approved and public. */
  sponsorsPublic: boolean;
};

const LEVELS: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

type GraphQLResponse = {
  data?: {
    user: {
      sponsorsListing: { isPublic: boolean } | null;
      followers: { totalCount: number };
      repositories: {
        totalCount: number;
        nodes: {
          name: string;
          stargazerCount: number;
          forkCount: number;
          languages: { edges: { size: number; node: { name: string } }[] };
        }[];
      };
      contributionsCollection: {
        totalCommitContributions: number;
        totalPullRequestContributions: number;
        totalRepositoryContributions: number;
        contributionCalendar: {
          totalContributions: number;
          weeks: {
            contributionDays: { date: string; weekday: number; contributionCount: number; contributionLevel: string }[];
          }[];
        };
      };
    } | null;
  };
  errors?: { message: string }[];
};

const QUERY = `query($login: String!) {
  user(login: $login) {
    sponsorsListing { isPublic }
    followers { totalCount }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) {
      totalCount
      nodes {
        name
        stargazerCount
        forkCount
        languages(first: 20) { edges { size node { name } } }
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalRepositoryContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date weekday contributionCount contributionLevel } }
      }
    }
  }
}`;

export async function fetchProfile(login: string, token: string): Promise<ProfileData> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
      "user-agent": `${login}-profile-build`,
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL HTTP ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as GraphQLResponse;
  if (json.errors?.length) throw new Error(`GitHub GraphQL: ${json.errors.map((e) => e.message).join("; ")}`);
  const user = json.data?.user;
  if (!user) throw new Error(`GitHub user "${login}" not found`);
  if (user.repositories.totalCount > user.repositories.nodes.length) {
    throw new Error(`${user.repositories.totalCount} public repositories; paginate the query past ${user.repositories.nodes.length}`);
  }

  const repos = new Map<string, RepoStats>();
  const bytes = new Map<string, number>();
  for (const r of user.repositories.nodes) {
    repos.set(r.name, { stars: r.stargazerCount, forks: r.forkCount });
    for (const e of r.languages.edges) bytes.set(e.node.name, (bytes.get(e.node.name) ?? 0) + e.size);
  }

  const c = user.contributionsCollection;
  return {
    total: c.contributionCalendar.totalContributions,
    weeks: c.contributionCalendar.weeks.map((w) =>
      w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: LEVELS[d.contributionLevel] ?? 0,
        weekday: d.weekday,
      })),
    ),
    repos,
    stars: [...repos.values()].reduce((sum, r) => sum + r.stars, 0),
    forks: [...repos.values()].reduce((sum, r) => sum + r.forks, 0),
    followers: user.followers.totalCount,
    commits: c.totalCommitContributions,
    pullRequests: c.totalPullRequestContributions,
    newRepos: c.totalRepositoryContributions,
    languages: [...bytes].map(([name, size]) => ({ name, bytes: size })).sort((a, b) => b.bytes - a.bytes),
    sponsorsPublic: user.sponsorsListing?.isPublic === true,
  };
}
