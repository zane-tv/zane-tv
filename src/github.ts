export type RepoStats = { stars: number; forks: number };

export type ProfileData = {
  /** Contributions over the calendar GitHub shows on the profile (about a year). */
  total: number;
  /** Weekly contribution totals, oldest first. */
  weeks: number[];
  repos: Map<string, RepoStats>;
  /** True once the GitHub Sponsors profile is approved and public. */
  sponsorsPublic: boolean;
};

type GraphQLResponse = {
  data?: {
    user: {
      sponsorsListing: { isPublic: boolean } | null;
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: { contributionDays: { contributionCount: number }[] }[];
        };
      };
    } | null;
  } & Record<string, { stargazerCount: number; forkCount: number } | null>;
  errors?: { message: string }[];
};

export async function fetchProfile(login: string, repos: readonly string[], token: string): Promise<ProfileData> {
  const aliases = repos
    .map((name, i) => `r${i}: repository(owner: $login, name: ${JSON.stringify(name)}) { stargazerCount forkCount }`)
    .join("\n");
  const query = `query($login: String!) {
    user(login: $login) {
      sponsorsListing { isPublic }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { contributionCount } }
        }
      }
    }
    ${aliases}
  }`;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `bearer ${token}`,
      "content-type": "application/json",
      "user-agent": `${login}-profile-build`,
    },
    body: JSON.stringify({ query, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GitHub GraphQL HTTP ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as GraphQLResponse;
  if (json.errors?.length) throw new Error(`GitHub GraphQL: ${json.errors.map((e) => e.message).join("; ")}`);
  const user = json.data?.user;
  if (!user) throw new Error(`GitHub user "${login}" not found`);

  const stats = new Map<string, RepoStats>();
  repos.forEach((name, i) => {
    const r = json.data?.[`r${i}`] as { stargazerCount: number; forkCount: number } | null | undefined;
    if (!r) throw new Error(`repository ${login}/${name} not found or not public`);
    stats.set(name, { stars: r.stargazerCount, forks: r.forkCount });
  });

  const calendar = user.contributionsCollection.contributionCalendar;
  return {
    total: calendar.totalContributions,
    weeks: calendar.weeks.map((w) => w.contributionDays.reduce((sum, d) => sum + d.contributionCount, 0)),
    repos: stats,
    sponsorsPublic: user.sponsorsListing?.isPublic === true,
  };
}
