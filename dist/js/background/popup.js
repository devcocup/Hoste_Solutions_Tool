/// <reference path="../../../typings/globals/jquery/index.d.ts" />

$(document).ready(async () => {
    var getTokenUrl = "http://3.121.129.222/api/generateAccesstoken";
    var adDataUrl = "http://3.121.129.222/api/adImageData";
    var sendScreenshotUrl = "http://3.121.129.222/api/screenshotTest";

    var userName = await getUserName();
    var password = await getPassword();

    var canSendDataFlag = true;
    var leftTimeInSeconds = 0;

    var manifestData = chrome.runtime.getManifest();

    $("#version").text(manifestData.version);

    $(document).ajaxStart(function () {
        console.log(canSendDataFlag);
    });

    $(document).ajaxStop(function () {
        console.log(canSendDataFlag);
    });

    $("#userName").val(userName);
    $("#password").val(password);

    function notify(notificationTitle, notificationMessage) {
        console.log(notificationTitle, notificationMessage);
        return new Promise((resolve, reject) => {
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    command: "notify",
                    title: notificationTitle,
                    message: notificationMessage,
                }, function (response) {

                });
            });
        });
    }

    $("#saveButton").click(async () => {
        var username = $("#userName").val();
        var password = $("#password").val();

        if (username !== "" && password !== "") {
            var token = await getToken(username, password);

            if (!token) {
                await notify("Error", "User name or password is invalid!");
            } else {
                setUserName(username);
                setPassword(password);
                await notify("Success", "Successfully Logged in!");
            }
        } else {
            await notify("Error", "User name or password is empty!");
        }

        window.close();
    });

    function setUserName(username) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({
                "username": username
            });
        });
    }

    function setPassword(password) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({
                "password": password
            });
        });
    }

    function getUserName() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['username'], data => {
                resolve(data.username);
            });
        });
    }

    function getPassword() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(['password'], data => {
                resolve(data.password);
            });
        });
    }

    function getToken(username, password) {
        return new Promise((resolve, reject) => {
            var getTokenRequest = $.ajax({
                type: 'POST',
                url: getTokenUrl,
                data: JSON.stringify({
                    "username": username,
                    "password": password
                }),
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                },
                success: function (data) {
                    resolve(data.access_token);
                },
                error: async function () {
                    await notify("Error", "Authorization error. Please check your name and password!");
                    resolve(null);
                }
            });
        });
    }

    function getScreenCaptureAsBase64String() {
        return new Promise((resolve, reject) => {
            chrome.tabs.captureVisibleTab(null, {}, function (image) {
                image = image.replace("data:image/jpeg;base64,", "");
                resolve(image);
            });
        });
    }

    async function sendData(dataToSend) {

        if (!dataToSend.ad_uuid) {
            await notify("Error", "Ad UUID is empty!");
            return;
        }

        // if (!dataToSend.widget_url) {
        //     await notify("Error", "Widget URL is empty!");
        //     return;
        // }

        dataToSend.widget_url = "";

        if (!dataToSend.ad_image_url) {
            await notify("Error", "Ad image URL is empty!");
            return;
        }

        if (!dataToSend.offer_text) {
            await notify("Error", "Offer text is empty!");
            return;
        }

        if (!dataToSend.screenshot) {
            await notify("Error", "Page screenshot is empty!");
            return;
        }

        var username = await getUserName();
        var password = await getPassword();

        var token = await getToken(username, password);

        return new Promise(() => {
            $.ajax({
                type: 'POST',
                url: adDataUrl,
                data: JSON.stringify(dataToSend),
                beforeSend: async function (xhr) {
                    canSendDataFlag = false;
                    xhr.setRequestHeader("Authorization", "Bearer " + token);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    await notify("Waiting", "Ad save request sent. Awaiting response from server");
                },
                success: async function (data) {
                    if (data === "successfully saved") {
                        await notify("Success", "Data successfully saved!");
                    } else if (data === "Duplicated") {
                        await notify("Error", "The same data has already been saved");
                    } else if (data === "Bad File" || data.indexOf("getimagesizefromstring") != -1) {
                        await notify("Error", "Screenshot file is broken");
                    } else {
                        await notify("Error", data);
                    }
                },
                error: async function (data) {
                    await notify("Error", "Error on Server. Contact Admin!");
                },
                complete: function () {
                    leftTimeInSeconds = 20;

                    var interval = setInterval(function () {
                        leftTimeInSeconds--;
                        if (leftTimeInSeconds < 1) {
                            canSendDataFlag = true;
                            leftTimeInSeconds = 20;
                            clearInterval(interval);
                        }
                    }, 1000);
                }
            });
        });
    }

    async function sendScreenshot(imageBase64String, ad_uuid, option) {

        if (!imageBase64String) {
            await notify("Error", "Screenshot of current page is invalid");
            return;
        }

        var username = await getUserName();
        var password = await getPassword();

        var token = await getToken(username, password);

        var pageName = await getPageName();

        if(!pageName || pageName === "dashboard" || pageName === "association-resolution"){
            await notify("Error", "Wrong page! You cannot send a screenshot from this page!");
            return new Promise();
        }

        return new Promise(() => {
            $.ajax({
                type: 'POST',
                url: sendScreenshotUrl,
                data: JSON.stringify({
                    "ad_uuid": ad_uuid,
                    "page_name": pageName,
                    "screenshot_bytes": imageBase64String,
                    "code": option
                }),
                beforeSend: async function (xhr) {
                        canSendDataFlag = false;
                        xhr.setRequestHeader("Authorization", "Bearer " + token);
                        xhr.setRequestHeader("Content-Type", "application/json");
                        await notify("Waiting", "Ad save request sent. Awaiting response from server");
                    },
                    success: async function (data) {
                            if (data === "success") {
                                await notify("Success", "Screenshot successfully saved!");
                            } else {
                                await notify("Error", data);
                            }
                        },
                        error: async function (data) {
                                await notify("Error", "Error on Server. Contact Admin!");
                            },
                            complete: function () {
                                leftTimeInSeconds = 20;

                                var interval = setInterval(function () {
                                    leftTimeInSeconds--;
                                    if (leftTimeInSeconds < 1) {
                                        canSendDataFlag = true;
                                        leftTimeInSeconds = 20;
                                        clearInterval(interval);
                                    }
                                }, 1000);
                            }
            });
        });
    }

    function getPageName() {
        return new Promise((resolve, reject) => {
            chrome.tabs.getSelected(null, function (tab) {
                var tabUrl = tab.url;

                if(tabUrl.indexOf("http://treehouse.ownlocal.com") !== -1){
                    var pageName = tabUrl.replace("http://treehouse.ownlocal.com/", "");
                    pageName = pageName.substring(0, pageName.indexOf("/"));
                    resolve(pageName);
                }
                else{
                    resolve("");
                }
            });
        });
    }

    chrome.runtime.onMessage.addListener(
        async function (request, sender, sendResponse) {
            if (request.msg == "send") {
                var image = await getScreenCaptureAsBase64String();

                var dataToSend = {
                    screenshot: image,
                    ad_uuid: request.ad_uuid,
                    ad_image_url: request.ad_image_url,
                    widget_url: request.widget_url,
                    offer_text: request.offer_text
                }

                if (canSendDataFlag) {
                    await sendData(dataToSend);
                } else {
                    await notify("Waiting", "Please be patient! You could send the data again within " + leftTimeInSeconds + " seconds");
                }
            } else if (request.msg == "sendTest") {

                if (canSendDataFlag) {
                    var image = await getScreenCaptureAsBase64String();
                    await sendScreenshot(image, request.ad_uuid, request.option);
                } else {
                    await notify("Waiting", "Please be patient! You could send the data again within " + leftTimeInSeconds + " seconds");
                }
            }
        });
});