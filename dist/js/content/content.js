$(document).ready(() => {

    Mousetrap.bind('ctrl+shift+k', function () {
        var ad_uuid = $("div:contains('Ad UUID:')").text();
        ad_uuid = ad_uuid ? ad_uuid.substring(ad_uuid.indexOf("Ad UUID: "), ad_uuid.indexOf("Ad UUID: ") + 45) : "";
        ad_uuid = ad_uuid.replace("Ad UUID: ", "");
        var offer_text = $("[name=\"offer_text\"]").val() || "";
        var ad_image_url = $("div.leaflet-pane.leaflet-map-pane > div.leaflet-pane.leaflet-overlay-pane > img").prop("src") || "";

        var widget_url = $(".origami-preview").first().css("background-image");
        widget_url = widget_url ? widget_url.replace("url(\"", "") : "";
        widget_url = widget_url.substring(0, widget_url.indexOf("\"")) || "";

        chrome.runtime.sendMessage({
            msg: "send",
            ad_uuid: ad_uuid,
            ad_image_url: ad_image_url,
            widget_url: widget_url,
            offer_text: offer_text
        }, function (response) {

        });
    });

    Mousetrap.bind('ctrl+shift+l', function () {
        appendOptionsDialog();
    });

    function appendOptionsDialog() {
        var html = `
        <div id="options" style="background-color:#03a9f4; position: fixed; bottom: 30px; right:30px; z-index:10000; padding:20px; border-radius:10px; color:white !important; opacity:60%; font-size:large;">
            <h4>Why are you sending a screenshot of this page?</h4>
            <ul style="list-style: none;">
            <li style="margin-bottom:5px"><input type="radio" id="ss-o-1" name="ss-option" checked/><label for="ss-o-1">Starting Work on this item</label></li>
            <li style="margin-bottom:5px"><input type="radio" id="ss-o-2" name="ss-option" /><label for="ss-o-2">I Have a Question about this item</label></li>
            <li style="margin-bottom:5px"><input type="radio" id="ss-o-3" name="ss-option" /><label for="ss-o-3">Reporting an Error about this item</label></li>
            <li style="margin-bottom:5px"><input type="radio" id="ss-o-4" name="ss-option" /><label for="ss-o-4">Server Error about this item - work is blocked</label></li>
            </ul>
            <div style="text-align:right">
            <span onclick="go()" style="pudding:10px; cursor:pointer"><b>Send ›</b></span>
            </div>
        </div>
        <script>
            var go = function() {
                var event = document.createEvent('Event');
                event.initEvent('sendScreenshot');
                document.dispatchEvent(event);
            }
        </script>
        `;

        $("body").append(html);
    }

    document.addEventListener("sendScreenshot", function (data) {
        $("#options").remove();

        var ad_uuid = $("div:contains('Ad UUID:')").text();
        ad_uuid = ad_uuid ? ad_uuid.substring(ad_uuid.indexOf("Ad UUID: "), ad_uuid.indexOf("Ad UUID: ") + 45) : "";
        ad_uuid = ad_uuid.replace("Ad UUID: ", "");

        var option = 1;

        if ($("#ss-o-1").is(":checked")) {
            option = 1;
        }
        if ($("#ss-o-2").is(":checked")) {
            option = 2;
        }
        if ($("#ss-o-3").is(":checked")) {
            option = 3;
        }
        if ($("#ss-o-4").is(":checked")) {
            option = 4;
        }


        chrome.runtime.sendMessage({
            msg: "sendTest",
            ad_uuid: ad_uuid,
            option: option
        }, function (response) {

        });
    });

    

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        var color;

        switch (request.title) {
            case "Error": {
                color = "#e91e63";
                break;
            }
            case "Success": {
                color = "#8bc34a";
                break;
            }
            case "Waiting": {
                color = "#ffeb3b";
                break;
            }
        }

        if (request.command == "sendScreenshot") {
            sendScreenshot();
        }

        if (request.command == "notify") {
            var html = `<div class="notification" style="
            width: 350px;
            height: 150px;
            position: fixed; 
            bottom: 30px; 
            right:30px; 
            z-index:10000;
            background:`+ color + `;
            padding:20px;
            border-radius:10px;
            color:white !important;
            opacity:60%;
            font-size:large"><h4>`+ request.title + `</h4><p>` + request.message + `</p><div>`;
            $("body > div").first().append(html);

            $(".notification").show().delay(4000).fadeOut();
        }

        if (request.site) {
            var link = request.inputLink;

            switch (request.site) {
                case "facebook":
                    prepareLink(link, "facebook_url");
                    break;

                case "twitter":
                    prepareLink(link, "twitter_url");
                    break;

                case "yelp":
                    prepareLink(link, "yelp_url");
                    break;

                case "youtube":
                    prepareLink(link, "youtube_url");
                    break;

                case "instagram":
                    prepareLink(link, "instagram_url");
                    break;

                case "website":
                    prepareLink(link, "website_url");
                    break;

                case "email":
                    prepareLink(link, "email");
                    break;
            }
        }
    });

    function prepareLink(link, socialNetworkClass) {
        var input = $("input[name='" + socialNetworkClass + "']");
        link = link
            .trim()
            .replace("https://", "")
            .replace("http://", "")
            .replace("www.", "");

        if (link.substring(link.lenght - 1) === "/") {
            link = link.substring(0, length - 2);
        }

        input.focus();
        input.prop("value", link);
    }
});