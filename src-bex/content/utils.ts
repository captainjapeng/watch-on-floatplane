import { debounce } from 'quasar'

export async function waitForElement<T>(selector: string) {
  await sleep(500)
  return new Promise<T>(resolve => {
    let selectedEl = document.querySelector(selector)
    if (selectedEl) {
      return resolve(selectedEl as any)
    }

    const observer = new MutationObserver(() => {
      selectedEl = document.querySelector(selector)
      if (selectedEl) {
        resolve(selectedEl as any)
        observer.disconnect()
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  })
}

export function watchForElement<T extends Element>(selector: string, cb: (el: T) => void | Promise<void>, continuous = false) {
  let currElement = document.querySelector(selector) as T
  if (currElement) {
    cb(currElement)
  }

  const observer = new MutationObserver(() => {
    const newElement = document.querySelector(selector) as T
    if (continuous || currElement !== newElement) {
      currElement = newElement
      cb(currElement)
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  return observer
}

export async function watchElement(element: HTMLElement, cb: () => void) {
  const observer = new MutationObserver(() => {
    observer.disconnect()
    cb()
  })

  observer.observe(element, {
    childList: true,
    subtree: true
  })

  return observer
}

export function watchLocationChange(_cb: (url: string) => void | Promise<void>) {
  const cb = debounce(_cb, 250)
  let currHref = document.location.href

  const observer = new MutationObserver(() => {
    if (currHref !== document.location.href) {
      currHref = document.location.href
      cb(currHref)
    }
  })

  const body = document.querySelector('body')
  if (body) {
    observer.observe(body, {
      childList: true,
      subtree: true
    })
  }
  cb(currHref)

  return observer
}

export function sleep(t: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, t)
  })
}
