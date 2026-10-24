export function createLiveStore(load, {intervalMs = 5000, target = typeof window === 'undefined' ? null : window} = {}) {
  let snapshot = {records:[],error:'',loading:true}
  const listeners = new Set()
  let pending = null
  let repeat = false
  let timer
  function publish(next) {snapshot=next;listeners.forEach(listener => listener())}
  function refresh() {
    if (pending) {repeat=true;return pending}
    pending = (async () => {
      do {
        repeat=false
        try {publish({records:await load(),error:'',loading:false})}
        catch (error) {publish({...snapshot,error:error.message || 'Could not load records.',loading:false})}
      } while (repeat)
    })().finally(() => {pending=null})
    return pending
  }
  function onStorage(event) {if (event.key === 'pwd-records-revision') void refresh()}
  function onVisible() {if (!target?.document?.hidden) void refresh()}
  return {
    getSnapshot:() => snapshot,
    refresh,
    subscribe(listener) {
      listeners.add(listener)
      if (listeners.size === 1) {
        void refresh()
        if (target) {
          timer=target.setInterval(onVisible,intervalMs)
          target.addEventListener('focus',onVisible)
          target.addEventListener('online',onVisible)
          target.addEventListener('storage',onStorage)
          target.addEventListener('pwd-records-updated',refresh)
          target.document?.addEventListener('visibilitychange',onVisible)
        }
      }
      return () => {
        listeners.delete(listener)
        if (!listeners.size && target) {
          target.clearInterval(timer)
          target.removeEventListener('focus',onVisible)
          target.removeEventListener('online',onVisible)
          target.removeEventListener('storage',onStorage)
          target.removeEventListener('pwd-records-updated',refresh)
          target.document?.removeEventListener('visibilitychange',onVisible)
        }
      }
    },
  }
}
