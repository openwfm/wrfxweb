export class InfoSection extends HTMLElement {
    constructor(header, subheaders) {
        super();
        this.innerHTML = `
            <div id='infoSectionContainer'>
                <div id=${this.formatHeader(header)}>
                    <h3>${header}</h3>
                </div>
                <div id='break' style='width: 100%; height: 1px; background: #5d5d5d'></div>
            </div>
        `;
        // this.subheaders = subheaders.map(subheader => this.formatHeader(subheader));
        this.header = header;
        this.subheaders = subheaders;
        this.sectionDivs = {};
    }

    connectedCallback() {
        const infoSection = this.querySelector('#infoSectionContainer');
        const sectionBreak = this.querySelector('#break');
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
        console.log(this.sectionDivs);
    }

    formatHeader(header) {
        return header.replace(' ', '-');
    }

    updateDescription(subheader, description) {
        // const subSection = this.querySelector('#' + formattedSubheader);
        const subSection = this.sectionDivs[subheader];
        if (subSection == null) {
            // console.log(formattedSubheader);
            console.log(subheader);
            return;
        }
        var p = document.createElement('p');
        p.innerHTML = description;
        subSection.appendChild(p);
    }
}

window.customElements.define('info-section', InfoSection);