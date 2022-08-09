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

chrome.webNavigation.onCommitted.addListener(({tabId, url, parentFrameId, frameId, ...details}) => {
    if (parentFrameId === -1 && frameId === 0) { // if the main frame in this tab
        chrome.storage.local.get(['filters'], async function (filterResult) {
            const filterUrls = Object.keys(filterResult.filters).filter(domainName => url.includes(domainName))
            if (filterUrls.length) {
                const filteredOrigin = filterUrls[0]
                const {lastVisitTime, hoursToWait} = filterResult.filters[filteredOrigin]
                const hoursFromLastVisit = (Date.now() - lastVisitTime) / ONE_HOUR_IN_MILLISECONDS
                const remainingHours = Math.round(hoursToWait - hoursFromLastVisit)
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
                        filteredOrigin,
                        {
                            title: `Mindful`,
                            type: 'basic',
                            message: `You've cannot visit ${filteredOrigin} for another ${remainingHours} hours`,
                            priority: 2,
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
})

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