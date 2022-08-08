const ONE_HOUR_IN_SECONDS = 3600
const ONE_HOUR_IN_MILLISECONDS = ONE_HOUR_IN_SECONDS * 1000

chrome.storage.local.get(['filters'], function (filterResult) {
    document.getElementById('origins').innerHTML = Object.keys(filterResult.filters).length ? Object.keys(filterResult.filters).map(item => {
        const {lastVisitTime, hoursToWait} = filterResult.filters[item]
        const hoursFromLastVisit = Math.round((Date.now() - lastVisitTime) / ONE_HOUR_IN_MILLISECONDS)
        const remainingHours = hoursToWait - hoursFromLastVisit
        return remainingHours > 0 ? `<li><span class="website">${item}</span> for <b>${remainingHours} hours</b></li>` : ``
    }).join('') : '<i>None so far :(</i>'
})