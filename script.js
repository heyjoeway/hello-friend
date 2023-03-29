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
        this.type = obj.type;
        this.faviconURL = `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${this.url}&size=128`;

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
            <div class="category">
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
                <div class="category-item-favicon">    
                    <img src="${this.faviconURL}" />
                </div>
            `);

        return (`
            <a
                class="category-item clickable"
                href=${this.url}
            >
                ${imgElement}
                ${this.title}
            </a>
        `);
    }
}

/**
 * @param {BookmarkTreeNode[]} items 
 */
async function renderPage(items) {
    const root = document.getElementById("categories");
    const bookmarksBar = items[0].children.find(
        x => options.ROOT_FOLDER.test(x.title)
    );

    if (!bookmarksBar) {
        console.error(`Was expecting a folder called '${options.ROOT_FOLDER}'`);
        return;
    }

    const rootFolders = bookmarksBar.children.filter(node => node.type == "folder");
    
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