console.log('*** content script inurl started')

let isw = '200px';  // '100px';
let iswL = '600px';  // '300px';
let darkBackground = '#242424';
let darkColor = '#b2b2b2';

const DpgMedia = [
    'https://www.trouw.nl/', 'https://www.volkskrant.nl/'
];

const homeWebsiteStyle = [
    // set dark mode
    [
        ['https://www.trouw.nl/', 'https://www.volkskrant.nl/'],
        `<style data-provided-by-inurl>
body, .app-header-home, .app-navigation, #main-content, .section, .oortje-wrapper,
 .section__anchor, .section__header, .section-title, .section-title > span, a.app-navigation__link,
  .read-more__text {
    background-color: #242424;
    color: #b2b2b2 !important;
}
</style>`
    ],
    [
        ['https://www.volkskrant.nl/'],
        `<style data-provided-by-inurl>
.wl-tile, .teaser__title span {
    background-color: #242424;
    color: #b2b2b2 !important;
}
</style>`

    ],
]
const globalStyles = {
    stackoverflow:
        `<style data-provided-by-inurl>
    #sidebar {
        display: none;
    }
    #mainbar {
        width: 100%;    
    }
</style>
`,
    trouw:
        `<style data-provided-by-inurl>
    #main-content div[data-temptation-position] {
        display: none;
    }
</style>
`,
    nrc:
        `<style data-provided-by-inurl>
    body {
        background-color: #242424;
        color: #b2b2b2;
    }
    h2 {
        color: #b2b2b2 !important;    
    }
    dmt-quote, img {
        opacity: .7 !important;
    }
    .banner, #paywall-form {
        display: none !important;
    }
</style>
`,
    fontawesome:
        `<style data-provided-by-inurl>
    article:has(span.sr-only) {
        display: none !important;
    }
</style>
`
} 
const globalWebsiteStyle = [
    // hide sidebar
    ['https://stackoverflow.com/', globalStyles.stackoverflow
    ],
    // hide: Blijf op de hoogte
    ['https://www.trouw.nl/', globalStyles.trouw
],
    // maak background minder zwart dan #111
    ['https://www.nrc.nl/', globalStyles.nrc
],
    // hide pro (paid) icons
    ['https://fontawesome.com/', globalStyles.fontawesome
]
];

function hasGraphExtension(s) {
    const p = s.lastIndexOf('.'),
        exts = ['jpg','png', 'gif', 'jpeg', 'bmp'];
    if (p !== -1) {
        const extension = s.substring(p + 1).toLowerCase();
        for (let ext of exts) {
            if (extension === ext) {
                return true;
            }
        }
    }
    return false;
}

function bodyAppendBrs(body, n) {
    for (let i = 0; i < n; i += 1) {
        body.appendChild(document.createElement('br'));
    }
}

function getSrc(href) {
    if (!href.startsWith('http')) {
        console.log('link without http');
        const fullHref = document.location.host + href;
        console.log(fullHref);
        return fullHref;
    }
    return href;
}

function getAnchor(href, nr, caption) {
    const img = document.createElement('img');
    let naturalDims;
    img.style.width = isw;
    img.style.height = 'auto';
    img.style.margin = '2px';
    img.src = getSrc(href);
    const anchor = document.createElement('a');
    const tile = document.createElement('div');
    tile.appendChild(img);
    tile.appendChild(document.createElement('br'));
    const text = document.createTextNode(nr);
    const dimSpan = document.createElement('span');
    tile.style.paddingBottom = '8px';
    tile.appendChild(text);
    tile.appendChild(dimSpan);
    anchor.appendChild(tile);
    img.onload = function() {
        naturalDims = this.naturalWidth + 'x' + this.naturalHeight;
        this.title = caption
        text.textContent = nr
        dimSpan.textContent = ' ' + naturalDims;
        dimSpan.style.opacity = '0.4';
        if (this.naturalWidth > 1000) {
            this.style.border = '1px solid red';
            this.style.width = iswL;
        }
    };
    img.onclick = function(e) {
        const w = e.target.style.width;
        let targetWidth = '';
        if (!(w === isw || w === iswL)) {
            targetWidth = w === '' ? '900px' : isw;
        }
        e.target.style.width = targetWidth;
    };
    return anchor;
}

function removeElement(element) {
    const parent = element.parentNode;
    if (parent) {
        if (parent.nodeName === 'LI') {
            parent.parentNode.removeChild(parent);
        } else if (parent.nodeName === 'TD') {
            const tr = parent.parentNode;
            tr.parentNode.removeChild(tr);
        } else {
            let sibling = element.nextSibling;
            if (sibling) {
                sibling.remove();
            }
            element.remove();
        }
    }
}

function getAnchors() {
    const links = document.links,
        removable = [],
        anchors = [];
    let parentDirectoryLink = '';
    let linksLength = links.length;
    for (let i = 0; i < linksLength; i+=1) {
        const link = links[i];
        let href = link.href;
        if (link.innerHTML.trim() === 'Parent Directory') {
            parentDirectoryLink = link;
        }
        else if (hasGraphExtension(href)) {
            anchors.push(getAnchor(href, i, link.textContent));
            removable.push(link);
        }
    }
    for (let r of removable) {
        removeElement(r);
    }
    return {anchors, parentDirectoryLink};
}

function injectImages(anchors) {
    const body = document.body;
    const p = document.createElement('p');
    const headerText = `${document.location.host}: ${anchors.length} images.`;
    let header = document.createTextNode(headerText)
    p.appendChild(header);
    const headers = document.getElementsByTagName('h1');
    if (headers.length) {
        body.insertBefore(p, headers[0]);
    }
    bodyAppendBrs(body, 2);
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    for (let anchor of anchors) {
        container.appendChild(anchor);
    }
    body.appendChild(container);
}

function appendParentDirectoryLink(parentDirectoryLink) {
    const body = document.body;
    bodyAppendBrs(body, 2);
    body.appendChild(document.createTextNode(document.title));
    bodyAppendBrs(body, 1);
    body.appendChild(parentDirectoryLink.cloneNode(true));
    bodyAppendBrs(body, 3);
}

function loadImages() {
    if (!document.title.startsWith('Index of ')) {
        return;
    }
    document.body.style.background = '#999';
    const {anchors, parentDirectoryLink} = getAnchors();
    if (anchors.length) {
        injectImages(anchors);
        if (parentDirectoryLink) {
            appendParentDirectoryLink(parentDirectoryLink);
        }
    }
}

function styleIframe() {
    const style =         `<style data-provided-by-inurl>
    .singlePodcast {
        opacity: .3;
    }
</style>
`;
    if (document.location.href.startsWith('https://www.nrc.nl/')) {
        console.log(frames)
        const iframe = frames[0];
        console.log(iframe);
        if (iframe) {
            iframe.document.head.innerHTML += style;
        }
    }

}

function injectGlobalStyles() {
    for (let [url, style] of globalWebsiteStyle) {
        console.log(url, document.location.href)
        if (document.location.href.startsWith(url)) {
            console.log('inject global style into: ' + url);
            document.head.innerHTML += style;
        }
    }
}

function  injectDarkMode() {
    for (let [urls, style] of homeWebsiteStyle) {
        if (urls.indexOf(document.location.href) !== -1) {
            document.head.innerHTML += style;
        }
    }
}

function injectStyles() {
    injectGlobalStyles();
    styleIframe();
    injectDarkMode();
}

(function() {
    loadImages();
    injectStyles();
})();
