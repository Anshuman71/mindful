const ONE_HOUR_IN_SECONDS = 60
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
                title: `Set my visit frequency to `,
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

function handleTab({url, tabId}) {
    chrome.storage.local.get(['filters'], async function (filterResult) {
        const filterUrls = Object.keys(filterResult.filters).filter(domainName => url.includes(domainName))
        if (filterUrls.length) {
            const filteredOrigin = filterUrls[0]
            const {lastVisitTime, hoursToWait} = filterResult.filters[filteredOrigin]
            const hoursFromLastVisit = (Date.now() - lastVisitTime) / ONE_HOUR_IN_MILLISECONDS
            const remainingHours = Math.ceil(hoursToWait - hoursFromLastVisit)
            if (remainingHours <= 0) {
                chrome.action.setBadgeText(
                    {
                        tabId,
                        text: 'ON'
                    }
                )
                chrome.storage.local.set({
                    ['filters']: {
                        ...filterResult?.filters,
                        [filteredOrigin]: {hoursToWait, lastVisitTime: Date.now()}
                    }
                })
            } else {
                chrome.notifications.create(
                    `mindful-${filteredOrigin}`,
                    {
                        title: `Mindful`,
                        type: 'basic',
                        message: `You've cannot visit ${filteredOrigin} for another ${remainingHours} hours`,
                        priority: 1,
                        iconUrl: 'images/128.png'
                    }
                )
                const tabs = await chrome.tabs.query(
                    {currentWindow: true}
                )
                if (tabs.length === 1) {
                    await chrome.tabs.create(
                        {
                            active: false,
                            openerTabId: tabs.find(item => item.active).id
                        }
                    )
                }
                const newTabs = await chrome.tabs.query(
                    {currentWindow: true, active: true}
                )
                await chrome.tabs.remove(newTabs[0].id)
            }
        }
    })
}

let lastTry = {}

chrome.tabs.onUpdated.addListener((tabId, updates, tab) => {
        const url = tab.url
        const [_, domainName] = url.match(REGEX_FOR_DOMAIN)
        if (updates.status === 'loading') {
            console.log({diff: Date.now() - lastTry[domainName]})
        }
        if (updates.status && updates.status === 'loading' && ((lastTry[domainName] || 0) + 5000) < Date.now()) {
            handleTab({url, tabId})
            lastTry[domainName] = Date.now()
        }
    }
)

// chrome.webNavigation.onCompleted.addListener(({tabId, url, parentFrameId, frameId, ...details}) => {
//     console.log({tabId, url, parentFrameId, frameId, ...details})
//     if (parentFrameId === -1 && frameId === 0) { // if the main frame in this tab
//         handleTab({url, tabId})
//     }
// })

chrome.contextMenus.onClicked.addListener(async ({pageUrl, menuItemId}) => {
        const [_, domainName] = pageUrl.match(REGEX_FOR_DOMAIN)
        const hours = parseInt(menuItemId.split('-')[0])
        const activeTabs = await chrome.tabs.query({
            active: true,
            currentWindow: true
        })
        const tabId = activeTabs[0].id
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