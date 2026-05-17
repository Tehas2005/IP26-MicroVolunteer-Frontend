import { AuthFetcher } from './AuthFetcher'
import { GuestFetcher } from './GuestFetcher'
import { NotificationsFetcher } from './NotificationsFetcher'
import { OffersFetcher } from './OffersFetcher'
import { ProfileFetcher } from './ProfileFetcher'
import { TasksFetcher } from './TasksFetcher'
import { UploadsFetcher } from './UploadsFetcher'
import { VolunteerProfilesFetcher } from './VolunteerProfilesFetcher'
import type { Fetcher } from './Fetcher'

export class Backend {
  public readonly auth: AuthFetcher
  public readonly guest: GuestFetcher
  public readonly notifications: NotificationsFetcher
  public readonly offers: OffersFetcher
  public readonly profile: ProfileFetcher
  public readonly tasks: TasksFetcher
  public readonly uploads: UploadsFetcher
  public readonly volunteerProfiles: VolunteerProfilesFetcher

  constructor(readonly fetcher: Fetcher) {
    this.auth = new AuthFetcher(this.fetcher)
    this.guest = new GuestFetcher(this.fetcher)
    this.notifications = new NotificationsFetcher(this.fetcher)
    this.offers = new OffersFetcher(this.fetcher)
    this.profile = new ProfileFetcher(this.fetcher)
    this.tasks = new TasksFetcher(this.fetcher)
    this.uploads = new UploadsFetcher(this.fetcher)
    this.volunteerProfiles = new VolunteerProfilesFetcher(this.fetcher)
  }
}
