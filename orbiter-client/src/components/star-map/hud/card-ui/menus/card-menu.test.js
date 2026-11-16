import { describe, expect, it } from 'vitest'
import { cardMenu } from './card-menu'

// Moved from the SDK's networks test when the SDK became its own package: menus are the client's.
describe('NFT market links in the card menu', () => {
  it("offers the market in a planet's card menu only when the network has one", () => {
    const planet = { type: 'planet', objectId: 65536 + 3, owner: '0xabc', isMine: false, hasStation: false, moons: [] }
    const commands = (options) => cardMenu(planet, options).map((item) => item.text)
    expect(commands({ marketName: 'Rarible' })).toContain('View on Rarible')
    expect(commands({})).not.toContain('View on Rarible')
  })

  it('offers it for ships too, whoever owns them', () => {
    const ship = (isMine) => ({ type: 'ship', objectId: 5, owner: '0xabc', isMine, moons: [] })
    expect(cardMenu(ship(true), { marketName: 'Rarible' }).map((item) => item.text)).toContain('View on Rarible')
    expect(cardMenu(ship(false), { marketName: 'Rarible' }).map((item) => item.text)).toContain('View on Rarible')
  })
})
