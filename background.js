const ONE_HOUR_IN_SECONDS = 3600
const ONE_HOUR_IN_MILLISECONDS = ONE_HOUR_IN_SECONDS * 1000
const REGEX_FOR_DOMAIN = /^(?:https?:\/\/)?(?:[^@\/\n]+@)?(?:www\.)?([^:\/?\n]+)/
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

chrome.webNavigation.onCommitted.addListener(({tabId, url, parentFrameId, frameId}) => {
    if (parentFrameId === -1 && frameId === 0) { // if the main frame in this tab
        chrome.storage.local.get(['filters'], async function (filterResult) {
            const filterUrl = Object.keys(filterResult.filters).filter(domainName => url.includes(domainName))
            if (filterUrl.length) {
                const filteredOrigin = filterUrl[0]
                const {lastVisitTime, hoursToWait} = filterResult.filters[filteredOrigin]
                const hoursFromLastVisit = Math.round((Date.now() - (lastVisitTime)) / ONE_HOUR_IN_MILLISECONDS)
                if (!lastVisitTime || hoursFromLastVisit > hoursToWait) {
                    chrome.action.setBadgeText(
                        {
                            tabId,
                            text: 'ON'
                        }
                    )
                    chrome.storage.local.set({
                        ['filters']: {
                            ...filterResult?.filters,
                            [domainName]: {hoursToWait, lastVisitTime: Date.now()}
                        }
                    })
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
                    await chrome.tabs.remove(tabId)
                }
            }
        })
    }
})

chrome.contextMenus.onClicked.addListener(async ({pageUrl, menuItemId}) => {
        const [_, domainName] = pageUrl.match(REGEX_FOR_DOMAIN)
        const hours = parseInt(menuItemId.split('-')[0])
        const [{id: tabId}] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        })
        chrome.action.setBadgeText(
            {
                tabId,
                text: 'ON'
            }
        )
        chrome.storage.local.get(['filters'], function (filterResult) {
            chrome.storage.local.set({
                ['filters']: {
                    ...filterResult?.filters,
                    [domainName]: {hoursToWait: hours, lastVisitTime: Date.now()}
                }
            })
        })
    }
)