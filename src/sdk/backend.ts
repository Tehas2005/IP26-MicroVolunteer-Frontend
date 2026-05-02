import { AuthFetcher } from './AuthFetcher'
import { ProfileFetcher } from './ProfileFetcher'
import { TasksFetcher } from './TasksFetcher'
import type { Fetcher } from './Fetcher'

export class Backend {
  public readonly auth: AuthFetcher
  public readonly profile: ProfileFetcher
  public readonly tasks: TasksFetcher

  constructor(readonly fetcher: Fetcher) {
    this.auth = new AuthFetcher(this.fetcher)
    this.profile = new ProfileFetcher(this.fetcher)
    this.tasks = new TasksFetcher(this.fetcher)
  }
}
