var startTabId;
var yelpTabID;
var facebookTabID;
var instagramTabID;
var incognitoWindowId = 0;
var currentQuery = '';
var pageUrls = ["http://treehouse.ownlocal.com/review-business-advanced/*", 
"http://treehouse.ownlocal.com/create-business-advanced/*", 
"http://treehouse.ownlocal.com/associate-ad/*", 
"http://treehouse.ownlocal.com/check-association/*"];

var servicesSearchUris = {
  "facebookSearchUri": "https://www.facebook.com/search/top/?init=quick&q=",
  "twitterSearchUri": "https://twitter.com/search?q=",
  "yelpSearchUri": "https://www.yelp.com/search?find_desc=",
  "youtubeSearchUri": "https://www.youtube.com/results?search_query=",
  "instagramSearchUri": "https://www.instagram.com/",
  "googleSearchUri": "https://www.google.com/search?q="
};

var myid = chrome.runtime.id;

addContextMenuOption("Tim's special tool v2", ["selection"], searchInServices, pageUrls);
//addContextMenuOption("YES - this is Correct EMAIL - take it!", ["selection"], fillEmail);
//await addContextMenuOption("Open in incognito mode", ["selection"], openIncognito);
addContextMenuOption("OK - I'm done! Close all tabs you opened!", ["page"], closeOpenedTabs);
addContextMenuOption("YES - this is Correct URL - take it!", ["page"], fillField);

document.addEventListener('copy', function (e) {
  e.clipboardData.setData('text/plain', currentQuery);
  e.preventDefault();
});

function cc() {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  },
    function (tabs) {
      var currentTab = tabs[0];

      if (currentTab) {
        var id = currentTab.id;

        if (id == yelpTabID) {
          chrome.tabs.sendMessage(id, {
            yelp: "yelp"
          });
        }

        if (id == facebookTabID) {
          chrome.tabs.sendMessage(id, {
            facebook: "facebook"
          });
        }
      }
    });
}

function cci() {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  },
    function (tabs) {
      var currentTab = tabs[0];

      if (currentTab) {
        var id = currentTab.id;

        if (id == instagramTabID) {
          chrome.tabs.sendMessage(id, {
            msg: "instagram",
            query: currentQuery
          });
        }
      }
    });
}

chrome.tabs.onUpdated.addListener(function () {
  cc();
  cci();
});

chrome.tabs.onActivated.addListener(function () {

  cc();
});

chrome.windows.onRemoved.addListener(function () {
  incognitoWindowId = 0;
});


var openedTabIds = [];

function fillEmail(info) {
  chrome.tabs.query({ active: true, currentWindow: true },
    function (tabs) {
      var currentTab = tabs[0];
      chrome.tabs.update(startTabId, { selected: true });
      var link = info.selectionText;

      chrome.tabs.sendMessage(startTabId, { site: "email", inputLink: link });
    });
}

function fillField(info) {
  chrome.tabs.query({ active: true, currentWindow: true },
    function (tabs) {
      var currentTab = tabs[0];
      chrome.tabs.update(startTabId, { selected: true });
      var link = info.pageUrl;
      if (link.includes("www.facebook.com")) {
        chrome.tabs.sendMessage(startTabId, { site: "facebook", inputLink: link });
      } else {
        if (link.includes("twitter.com")) {
          chrome.tabs.sendMessage(startTabId, { site: "twitter", inputLink: link });
        } else {
          if (link.includes("instagram.com")) {
            chrome.tabs.sendMessage(startTabId, { site: "instagram", inputLink: link });
          } else {
            if (link.includes("www.yelp.com")) {
              chrome.tabs.sendMessage(startTabId, { site: "yelp", inputLink: link });
            } else {
              if (link.includes("www.youtube.com")) {
                chrome.tabs.sendMessage(startTabId, { site: "youtube", inputLink: link });
              } else {
                chrome.tabs.sendMessage(startTabId, { site: "website", inputLink: link });
              }
            }
          }
        }
      }
    });
}

function searchInService(serviceUri, query) {
  return new Promise(resolve => {
    chrome.tabs.create({
      url: serviceUri + escape(query)
    }, function (tab) {
      openedTabIds.push(tab.id);
      resolve(tab.id);
    });
  });
}

function addContextMenuOption(title, contexts, onclick, pattern = ["*://*/*"]) {
  return new Promise(() => {
    chrome.contextMenus.create({
      title: title,
      contexts: contexts,
      onclick: onclick,
      documentUrlPatterns: pattern
    });
  });
}

function closeOpenedTabs() {
  openedTabIds.forEach(item => {
    chrome.tabs.remove(item);
  });
  openedTabIds = [];
  if (incognitoWindowId !== 0) {
    chrome.windows.remove(incognitoWindowId);
    incognitoWindowId = 0;
  }
}

function addSearchButton() {

}

async function searchInServices(info, tab) {
  startTabId = tab.id;

  currentQuery = info.selectionText;

  facebookTabID = await searchInService(servicesSearchUris.facebookSearchUri, info.selectionText);
  yelpTabID = await searchInService(servicesSearchUris.yelpSearchUri, info.selectionText);
  await searchInService(servicesSearchUris.twitterSearchUri, info.selectionText);
  await searchInService(servicesSearchUris.youtubeSearchUri, info.selectionText);
  instagramTabID = await searchInService(servicesSearchUris.instagramSearchUri, info.selectionText);
  await searchInService(servicesSearchUris.googleSearchUri, info.selectionText);
}