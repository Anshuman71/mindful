const ONE_HOUR_IN_SECONDS = 60
const ONE_HOUR_IN_MILLISECONDS = ONE_HOUR_IN_SECONDS * 1000

chrome.storage.local.get(['filters'], function (filterResult) {
    document.getElementById('origins').innerHTML = Object.keys(filterResult.filters).length ? Object.keys(filterResult.filters).map(item => {
        const {lastVisitTime, hoursToWait} = filterResult.filters[item]
        const hoursFromLastVisit = (Date.now() - lastVisitTime) / ONE_HOUR_IN_MILLISECONDS
        const remainingHours = Math.ceil(hoursToWait - hoursFromLastVisit)
        return remainingHours > 0 ? `<li><span class="website">${item}</span> for <b>${remainingHours} hours</b></li>` : ``
    }).join('') : '<i>None so far :(</i>'
})