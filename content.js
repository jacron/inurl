// ==UserScript==
// @name         openindeximgs
// @namespace    http://tampermonkey.net/
// @version      0.11
// @description  on Index page, immediately load the images
// @author       Jan Croonen
// @match        *://*/*
// @grant        none
// bookmarklets/opener
// ==/UserScript==

(function() {
    'use strict';

    let isw = '200px';  // '100px';
    let iswL = '600px';  // '300px';

    function hasGraphExtension(s) {
        const p = s.lastIndexOf('.'),
            exts = ['jpg','png', 'gif', 'jpeg', 'bmp'];
        if (p !== -1) {
            const ext = s.substr(p + 1).toLowerCase();
            for (let k = 0; k < exts.length; k+=1) {
                if (ext === exts[k]) {
                    return true;
                }
            }
        }
        return false;
    }

    function bodyAppendBrs(body, n) {
        for (let i = 0; i < n; i+=1) {
            body.appendChild(document.createElement('br'));
        }
    }

    function getSrc(href) {
        if (href.indexOf('http') !== 0) {
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
        // anchor.href = href;
        // anchor.target = '_blank';
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
            // this.title = naturalDims;
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
            let w = e.target.style.width;
            e.target.style.width = (w === isw || w === iswL) ? '' :
                w === '' ? '900px' : isw;
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
        let pdLink = '';
        let linksLength = links.length;
        //debug
        // linksLength = 3;
        for (let i = 0; i < linksLength; i+=1) {
            const link = links[i];
            let href = link.href;
            if (link.innerHTML.trim() === 'Parent Directory') {
                pdLink = link;
            }
            else {
                if (hasGraphExtension(href)) {
                    anchors.push(getAnchor(href, i, link.textContent));
                    removable.push(link);
                }
            }
        }
        for (let i = 0; i < removable.length; i += 1) {
            removeElement(removable[i]);
        }
        return {anchors, pdLink};
    }

    function loadImages() {
        const body = document.body;
        body.style.background = '#999';
        const {anchors, pdLink} = getAnchors(body);
        if (!anchors.length) {
            return;
        }
        const anchorsLen = anchors.length;
        const p = document.createElement('p');
        const headerText = `${document.location.host}: ${anchorsLen} images.`;
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
        for (let i = 0; i < anchorsLen; i+=1) {
            container.appendChild(anchors[i]);
        }
        body.appendChild(container);
        if (pdLink) {
            bodyAppendBrs(body, 2);
            body.appendChild(document.createTextNode(document.title));
            bodyAppendBrs(body, 1);
            body.appendChild(pdLink.cloneNode(true));
            bodyAppendBrs(body, 3);
        }
    }

    // console.log(document.title);
    // console.log(document.location);
    if (document.title.indexOf('Index of ') === 0) {
        loadImages();
    }

})();
