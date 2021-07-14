export class InfoSection extends HTMLElement {
    constructor(header, subheaders) {
        super();
        this.innerHTML = `
            <div id='infoSectionContainer' class='infoSectionContainer'>
                <div id=${this.formatHeader(header)}>
                    <h3>${header}</h3>
                    <div id='expand-collapse' class='expand-collapse'>
                        <span id='expand'>[+]</span>
                        <span id='collapse' class='hidden'>[-]</span>
                    </div>
                </div>
                <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
            </div>
        `;
        this.header = header;
        this.subheaders = subheaders;
        this.sectionDivs = {};
    }

    connectedCallback() {
        const infoSection = this.querySelector('#infoSectionContainer');
        const sectionBreak = this.querySelector('#break');
        const expand = this.querySelector('#expand');
        const collapse = this.querySelector('#collapse');

        this.sectionDivs[this.header] = this.querySelector('#' + this.formatHeader(this.header));
        for (var subheader of this.subheaders) {
            var div = document.createElement('div');
            div.id = this.formatHeader(subheader);
            var h4 = document.createElement('h4');
            h4.innerHTML = subheader;
            div.appendChild(h4);
            infoSection.insertBefore(div, sectionBreak);
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
        var p = document.createElement('p');
        p.innerHTML = description;
        subSection.appendChild(p);
    }
}

window.customElements.define('info-section', InfoSection);