const render = (columns) => {
    const colors = options.COLOR_THEME;
    const root = document.getElementById("categories");

    let colourIndex = 0;

    root.innerHTML = columns
        .filter((column) => column.children.length)
        .map((column) => {
            const listItems = column.children
                .map((bookmark) => {
                    const title = trunc(
                        bookmark.path
                            .slice(1) // skip column name
                            .concat(bookmark.title) // add bookmark name
                            .join("/")
                    ); // join as path

                    if (bookmark.isSeparator) {
                        return '<div class="separator">&nbsp;</li>';
                    }

                    return `<a
                                href="${bookmark.url}"
                                class="category-item clickable"
                                ${title.endsWith("…") ? `title="${bookmark.title}"` : ""}
                            >
                                ${title}
                            </a>`;
                })
                .join("");

            colourIndex =
                colourIndex >= colors.length - 1 ? 0 : colourIndex + 1;
            return `<div class="category">
                    <div class="category-title" style="color: ${colors[colourIndex]}">
                        ${column.title}
                    </div>
                    ${listItems}
                </div>`;
        })
        .join("");

    document.getElementById("bg-top-left").innerHTML = options.TITLE;

    // Dice roll!
    let htmlDiceEntities = ["&#x2680;","&#x2681;","&#x2682;","&#x2683;","&#x2684;","&#x2685;"];
    
    function randomElement(arr) {
        return arr[Math.round(Math.random()*(arr.length - 1))];
    }

    let e_bg_bottom_right = document.getElementById("bg-bottom-right");
    e_bg_bottom_right.innerHTML = randomElement(htmlDiceEntities);
};
