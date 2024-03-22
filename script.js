const columns = [];

// https://stackoverflow.com/a/48969580
/**
 * @param {string} url 
 * @param {"GET" | "POST"} method 
 * @returns 
 */
function makeAJAXRequest(url, method = "GET") {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function() {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function() {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}
/**
 * @param {int} start - inclusive
 * @param {int} end - exclusive
 * @returns {int[]} - array of integers from start to end
 * @example range(1, 5) // [1, 2, 3, 4]
 * @example range(5, 1) // []
 * @example range(5, 5) // []
 * @example range(5, 6) // [5]
 */
function range(start, end) {
    return Array(end - start).fill().map((_, idx) => start + idx)
}

class BookmarkTreeNode {
    /**
     * @param {object} obj
     */
    constructor(obj) {
        this.dateAdded = obj.dateAdded;
        this.dateGroupModified = obj.dateGroupModified;
        this.id = obj.id;
        this.index = obj.index;
        this.parentId = obj.parentId;
        this.title = obj.title;
        this.url = obj.url;
        this.type = obj.url ? "bookmark" : "folder";

        // Get domain name from URL
        let faviconDomain = this.url;
        try {
            faviconDomain = new URL(this.url).hostname;
        } catch (e) {}

        this.faviconURL = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${this.url}&size=128`;
        this.colorURL = `http://favicon.yandex.net/favicon/${faviconDomain}`;

        /** @type {BookmarkTreeNode[]} */
        this.children = [];
        try {
            obj.children.forEach(x => {
                this.children.push(new BookmarkTreeNode(x))
            });
        } catch (e) {} // To catch the case where obj.children is undefined
    }

    htmlFolder(color = "white") {
        if (this.type != "folder") return "";
        const contents = this.children.map(x => x.htmlBookmark()).join("");
        if (contents == "") return "";
        return (`
            <div class="category blur-in">
                <div
                    class="category-title"
                    style="color:${color}"
                >
                    ${this.title}
                </div>
                ${contents}
            </div>
        `);
    }

    htmlBookmark() {
        if (this.type != "bookmark") return "";
        let imgElement = "";
        if (options.FAVICONS)
            imgElement = (`
                <div class="category-item-underline" style="background-color:${this.color}"></div>
                <div class="category-item-favicon">
                    <img src="${this.faviconURL}" />
                </div>
            `);

        let urlDisplay = this.url;
        // Remove HTTP/HTTPS
        urlDisplay = urlDisplay.replace(/(^\w+:|^)\/\//, '');
        // Remove www
        urlDisplay = urlDisplay.replace(/^www\./, '');
        // Remove query string
        urlDisplay = urlDisplay.replace(/\?.*$/, '');
        // Remove hash
        urlDisplay = urlDisplay.replace(/#.*$/, '');
        // Remove trailing slash
        urlDisplay = urlDisplay.replace(/\/$/, '');

        return (`
            <a
                class="category-item clickable"
                href=${this.url}
            >
                ${imgElement}
                <div class="category-item-text">
                    <div class="category-item-title">
                        ${this.title}
                    </div>
                    <div class="category-item-url">
                        ${urlDisplay}
                    </div>
                </div>
            </a>
        `);
    }

    async updateFaviconColor() {
        try {
            this.color = await colorjs.prominent(this.colorURL, {
                amount: 1,
                format: "hex"
            });

            // LIKELY empty favicon, kinda hacky
            if (this.color == "#000000")
                this.color = "white";
        } catch (e) {
            console.error(e);
            this.color = "white";
        }
        console.log(this.color);
    }
}

/**
 * @param {BookmarkTreeNode[]} items 
 */
async function renderPage(items) {
    const root = document.getElementById("categories");
    console.log(items[0].children);
    const bookmarkBarRegex = /(bookmarks (tool)?bar|favou?rites bar)/i;
    const startPageBookmarks = items[0].children.find(
        x => bookmarkBarRegex.test(x.title)
    ).children.find(
        x => options.ROOT_FOLDER.test(x.title)
    );

    if (!startPageBookmarks) {
        console.error(`Was expecting a folder called '${options.ROOT_FOLDER}'`);
        return;
    }
    
    let bookmarkFolderId = startPageBookmarks.id;
    
    document.getElementById("edit").addEventListener("click", () => {
        // Navigate to the bookmarks page in current tab
        chrome.tabs.update({ url: `chrome://bookmarks/?id=${bookmarkFolderId}` });
    });

    const rootFolders = startPageBookmarks.children.filter(node => node.type == "folder");
    
    // Run all async operations in parallel to load icons faster
    await Promise.allSettled(range(0, rootFolders.length).map(async (i) => {
        await Promise.allSettled(rootFolders[i].children.map(x => x.updateFaviconColor()));
    }));
    
    for (let i = 0; i < rootFolders.length; i++) {
        let color = options.COLOR_THEME[i % options.COLOR_THEME.length];
        root.innerHTML += rootFolders[i].htmlFolder(color);
    }
}

chrome.bookmarks.getTree(
    itemsRaw => renderPage(
        itemsRaw.map(
            x => new BookmarkTreeNode(x)
        )
    )
);


document.addEventListener("DOMContentLoaded", () => {
    document.body.style.background = options.BACKGROUND;
    document.getElementById("bg-top-left").style.color = options.TITLE_COLOR;
});

// notify firefox users to set their home page
if (window.browser) {
    window.browser.runtime.getBrowserInfo().then((browser) => {
        if (browser.name === "Firefox") {
            console.log(
                `On ${browser.name} you can make this your home page by setting the following URL in your home page preferences:`
            );
            console.log(window.location.href);
        }
    });
}

document.getElementById("bg-top-left").innerHTML = options.TITLE;

// Dice roll!
let htmlDiceEntities = ["&#x2680;","&#x2681;","&#x2682;","&#x2683;","&#x2684;","&#x2685;"];

function randomElement(arr) {
    return arr[Math.round(Math.random()*(arr.length - 1))];
}

let e_bg_bottom_right = document.getElementById("bg-bottom-right");
e_bg_bottom_right.innerHTML = randomElement(htmlDiceEntities);