// Dev builds only: drive store actions by name from the console or the smoke tests,
// e.g. __o8commit('UI/openMenu', 'planets'); __o8game is the app's game client (sdk/client.js).
export function installStoreHook(pinia, game) {
  window.__o8game = game
  window.__o8commit = (name, payload) => {
    const [id, action] = name.split('/')
    // pinia._s is Pinia's registry of instantiated stores.
    return pinia._s.get(id)[action](payload)
  }
}
