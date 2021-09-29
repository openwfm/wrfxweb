export class InfoSection extends HTMLElement {
    constructor(header, subheaders) {
        super();
        this.innerHTML = `
            <div id='infoSectionContainer'> 
                <div id=${this.formatHeader(header)} class='infoSectionHeader'>
                    <h3 id='header'>
                    ${header}
                    <div id='expand-collapse' class='expand-collapse'>
                        [+]
                    </div>
                    </h3>
                </div>
                <div id='subheaders' class='hidden'>
                    <div id='generalDescription'></div>
                </div>
                <div class='section-break'></div>
            </div>
        `;
        this.header = header;
        this.subheaders = subheaders;
        this.sectionDivs = {};
        this.expanded = false;
    }

    connectedCallback() {
        this.initializeHeader();
        this.createSubHeaders();
    }

    initializeHeader() {
        const header = this.querySelector('#header');
        const expandCollapse = this.querySelector('#expand-collapse');

        header.onclick = () => {
            if (this.expanded) {
                this.contractSection();
            } else {
                this.expandSection();
            }
        }
        header.onmouseover = () => {
            expandCollapse.classList.add('hover');
        }
        header.onmouseout = () => {
            expandCollapse.classList.remove('hover');
        }
    }

    expandSection() {
        const subsections = this.querySelector('#subheaders');
        const expandCollapse = this.querySelector('#expand-collapse');

        subsections.classList.remove('hidden');
        expandCollapse.innerHTML = '[-]';
        this.expanded = true;
    }

    contractSection() {
        const subsections = this.querySelector('#subheaders');
        const expandCollapse = this.querySelector('#expand-collapse');

        subsections.classList.add('hidden');
        expandCollapse.innerHTML = '[+]';
        this.expanded = false;
    }

    createSubHeaders() {
        const subsections = this.querySelector('#subheaders');
        this.sectionDivs[this.header] = this.querySelector('#generalDescription');
        for (let subheader of this.subheaders) {
            let div = document.createElement('div');
            div.id = this.formatHeader(subheader);
            let h4 = document.createElement('h4');
            h4.innerHTML = subheader;
            div.appendChild(h4);
            subsections.appendChild(div);
            this.sectionDivs[subheader] = div;
        }
    }

    formatHeader(header) {
        return header.replace(' ', '-');
    }

    updateDescription(subheader, description) {
        const subSection = this.sectionDivs[subheader];
        if (subSection == null) {
            return;
        }
        let p = document.createElement('p');
        p.innerHTML = description;
        subSection.appendChild(p);
    }
}

window.customElements.define('info-section', InfoSection);