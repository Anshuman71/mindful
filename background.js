const ONE_HOUR_IN_SECONDS = 3600
const ONE_HOUR_IN_MILLISECONDS = ONE_HOUR_IN_SECONDS * 1000

const ADD_TO_GRACIOUS = 'add-to-mindful'

chrome.runtime.onInstalled.addListener(
    () => {
        chrome.storage.local.set({
            ['filters']: {}
        })

        chrome.contextMenus.create(
            {
                title: 'Be Mindful for',
                id: ADD_TO_GRACIOUS
            }
        )

        chrome.contextMenus.create(
            {
                title: '1 hour',
                parentId: ADD_TO_GRACIOUS,
                id: '1-hour'
            }
        )
        chrome.contextMenus.create(
            {
                title: '3 hours',
                parentId: ADD_TO_GRACIOUS,
                id: '3-hour'
            }
        )

        chrome.contextMenus.create(
            {
                title: '6 hours',
                parentId: ADD_TO_GRACIOUS,
                id: '6-hour'
            }
        )
    }
)

chrome.webNavigation.onBeforeNavigate.addListener(({tabId, url}) => {
    const urlObj = new URL(url)
    chrome.storage.local.get(['filters'], async function (filterResult) {
        const filterUrl = Object.keys(filterResult.filters).filter(item => urlObj.origin.startsWith(item))
        if (filterUrl.length) {
            const filteredOrigin = filterUrl[0]
            const {lastVisitTime, hoursToWait} = filterResult.filters[filteredOrigin]
            const hoursFromLastVisit = Math.round((Date.now() - (lastVisitTime)) / ONE_HOUR_IN_MILLISECONDS)
            if (!lastVisitTime || hoursFromLastVisit > hoursToWait) {
                chrome.storage.local.set({[filteredOrigin]: {hoursToWait, lastVisitTime: Date.now()}})
            } else {
                const tabs = await chrome.tabs.query(
                    {currentWindow: true}
                )
                if (tabs.length === 1) {
                    await chrome.tabs.create(
                        {
                            active: false,
                            openerTabId: tabId
                        }
                    )
                }
                chrome.tabs.remove(tabId)
            }
        }
    })
})

chrome.contextMenus.onClicked.addListener(({pageUrl, menuItemId}) => {
        const url = new URL(pageUrl)
        const hours = parseInt(menuItemId.split('-')[0])
        chrome.storage.local.get(['filters'], function (filterResult) {
            chrome.storage.local.set({
                ['filters']: {
                    ...filterResult?.filters,
                    [url.origin]: {hoursToWait: hours, lastVisitTime: Date.now()}
                }
            })
        })
    }
)