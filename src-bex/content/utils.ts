
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

export function sleep(t: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, t)
  })
}
