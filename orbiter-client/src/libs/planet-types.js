export default class PlanetTypes {
  getName(number) {
    switch (number) {
      case 0:
        return 'Terrestrial'
      case 1:
        return 'Rocky'
      case 2:
        return 'Oceanic'
      case 3:
        return 'Desert'
      case 4:
        return 'Ice'
      case 5:
        return 'Volcanic'
      case 6:
        return 'Gaseous'
      case 7:
        return 'Ferrous'
      case 8:
        return 'Lava'
      case 9:
        return 'Swamp'
    }
    return number
  }
}