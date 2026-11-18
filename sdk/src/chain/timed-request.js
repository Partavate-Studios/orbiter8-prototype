import { FetchRequest } from 'ethers'

/** A request to `url` that gives up after 30 s (ethers waits 5 min), so a stuck read fails and is retried. */
export function timedRequest(url) {
  const request = new FetchRequest(url)
  request.timeout = 30_000
  return request
}
